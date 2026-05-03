/**
 * Calendar account management routes for Open Sunsama API
 * Handles listing, disconnecting, and syncing calendar accounts
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  getDb,
  eq,
  and,
  inArray,
  calendarAccounts,
  calendars,
  calendarEvents,
  sql,
} from '@open-sunsama/database';
import { NotFoundError } from '@open-sunsama/utils';
import { auth, requireScopes, type AuthVariables } from '../middleware/auth.js';
import { calendarAccountIdParamSchema } from '../validation/calendar.js';
import {
  getProvider,
  refreshTokensIfNeeded,
  syncICloudAccount,
  syncOAuthAccount,
  deleteRemovedEvents,
  upsertEvents,
  updateSyncStatus,
  publishSyncEvent,
  ensureGoogleWatches,
} from '../services/calendar-sync.js';
import { ProviderAuthError } from '../services/calendar-providers/index.js';
import { publishEvent } from '../lib/websocket/index.js';

const calendarAccountsRouter = new Hono<{ Variables: AuthVariables }>();
calendarAccountsRouter.use('*', auth);

/**
 * GET /calendar/accounts
 * List all connected calendar accounts for the user
 */
calendarAccountsRouter.get(
  '/',
  requireScopes('user:read'),
  async (c) => {
    const userId = c.get('userId');
    const db = getDb();

    const accounts = await db
      .select({
        id: calendarAccounts.id,
        provider: calendarAccounts.provider,
        email: calendarAccounts.email,
        syncStatus: calendarAccounts.syncStatus,
        syncError: calendarAccounts.syncError,
        lastSyncedAt: calendarAccounts.lastSyncedAt,
        isActive: calendarAccounts.isActive,
        createdAt: calendarAccounts.createdAt,
        updatedAt: calendarAccounts.updatedAt,
        calendarsCount: sql<number>`(
          SELECT COUNT(*)::int FROM ${calendars} 
          WHERE ${calendars.accountId} = ${calendarAccounts.id}
        )`,
      })
      .from(calendarAccounts)
      .where(eq(calendarAccounts.userId, userId))
      .orderBy(calendarAccounts.createdAt);

    return c.json({
      success: true,
      data: accounts,
    });
  }
);

/**
 * DELETE /calendar/accounts/:id
 * Disconnect a calendar account (cascades to calendars and events)
 */
calendarAccountsRouter.delete(
  '/:id',
  requireScopes('user:write'),
  zValidator('param', calendarAccountIdParamSchema),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const db = getDb();

    const [account] = await db
      .select()
      .from(calendarAccounts)
      .where(
        and(eq(calendarAccounts.id, id), eq(calendarAccounts.userId, userId))
      )
      .limit(1);

    if (!account) {
      throw new NotFoundError('Calendar account', id);
    }

    // Best-effort: tear down any Google push channels we own for
    // this account's calendars before the cascade-delete drops the
    // rows. Stop calls are async-fire-and-forget — even if Google
    // refuses, channels expire on their own within 7 days.
    if (account.provider === 'google' && account.accessTokenEncrypted) {
      try {
        const provider = getProvider('google');
        if (provider) {
          const accessToken = await refreshTokensIfNeeded(account, provider);
          const watched = await db
            .select({
              channelId: calendars.watchChannelId,
              resourceId: calendars.watchResourceId,
            })
            .from(calendars)
            .where(eq(calendars.accountId, id));
          const { stopWatch } = await import(
            '../services/google-calendar-watch.js'
          );
          for (const w of watched) {
            if (!w.channelId || !w.resourceId) continue;
            await stopWatch({
              accessToken,
              channelId: w.channelId,
              resourceId: w.resourceId,
            });
          }
        }
      } catch (err) {
        console.warn(
          `[Google Watch] stop-on-disconnect failed for account ${id}:`,
          err instanceof Error ? err.message : err
        );
      }
    }

    await db
      .delete(calendarAccounts)
      .where(eq(calendarAccounts.id, id));

    publishEvent(userId, 'calendar:account-disconnected', {
      accountId: id,
      provider: account.provider,
    });

    return c.json({
      success: true,
      message: 'Calendar account disconnected successfully',
    });
  }
);

/**
 * POST /calendar/accounts/:id/sync
 * Trigger a manual sync for a calendar account
 */
calendarAccountsRouter.post(
  '/:id/sync',
  requireScopes('user:write'),
  zValidator('param', calendarAccountIdParamSchema),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const db = getDb();

    const [account] = await db
      .select()
      .from(calendarAccounts)
      .where(
        and(eq(calendarAccounts.id, id), eq(calendarAccounts.userId, userId))
      )
      .limit(1);

    if (!account) {
      throw new NotFoundError('Calendar account', id);
    }

    if (!account.isActive) {
      return c.json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'Calendar account is inactive' },
      }, 400);
    }

    // `?force=true` clears sync tokens and wipes existing events for
    // this account's calendars before re-syncing. Used to recover from
    // historical data corruption where events were attributed to the
    // wrong calendar — a clean slate forces every event to be
    // re-fetched and attributed via the (now-correct) per-calendar
    // sync slice. Safe to run anytime; just slower than incremental.
    const forceParam = c.req.query('force');
    const force = forceParam === 'true' || forceParam === '1';

    await db
      .update(calendarAccounts)
      .set({ syncStatus: 'syncing', syncError: null, updatedAt: new Date() })
      .where(eq(calendarAccounts.id, id));

    try {
      const accountCalendars = await db
        .select()
        .from(calendars)
        .where(
          and(
            eq(calendars.accountId, id),
            eq(calendars.isEnabled, true)
          )
        );

      if (force && accountCalendars.length > 0) {
        const calendarIds = accountCalendars.map((c) => c.id);
        // Wipe events for these calendars so the upsert below rebuilds
        // attribution from scratch — protects against the case where
        // an event's calendarId is wrong in the DB.
        await db
          .delete(calendarEvents)
          .where(
            and(
              eq(calendarEvents.userId, userId),
              inArray(calendarEvents.calendarId, calendarIds)
            )
          );
        // Clear per-calendar sync tokens so the next listEvents call
        // does a full window fetch instead of an empty incremental.
        await db
          .update(calendars)
          .set({ syncToken: null, updatedAt: new Date() })
          .where(inArray(calendars.id, calendarIds));
        // Refresh the in-memory list so the OAuth path sees the
        // cleared tokens.
        for (const c of accountCalendars) c.syncToken = null;
      }

      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setDate(timeMin.getDate() - 30);
      const timeMax = new Date(now);
      timeMax.setDate(timeMax.getDate() + 90);

      const syncOptions = { timeMin, timeMax };

      // Hold onto the OAuth access token so we can register Google
      // push-notification watches after the sync. iCloud doesn't
      // need this — CalDAV has no equivalent.
      let oauthAccessToken: string | null = null;
      const syncResult =
        account.provider === 'icloud'
          ? await syncICloudAccount(account, accountCalendars, syncOptions)
          : await (async () => {
              const provider = getProvider(account.provider);
              if (!provider || !account.accessTokenEncrypted) {
                throw new Error('Invalid provider or missing credentials');
              }
              const accessToken = await refreshTokensIfNeeded(
                account,
                provider
              );
              oauthAccessToken = accessToken;
              return syncOAuthAccount(
                accessToken,
                provider,
                accountCalendars,
                syncOptions
              );
            })();

      await deleteRemovedEvents(userId, syncResult.perCalendar);
      await upsertEvents(userId, syncResult.perCalendar);
      await updateSyncStatus(id, 'idle', syncResult.nextSyncToken);

      // Register Google `events.watch` channels for any calendars
      // that don't yet have one — gives us seconds-latency push
      // notifications instead of waiting for the 5-min poll. Outlook
      // gets the same treatment in a follow-up via Microsoft Graph
      // subscriptions; iCloud has no push-notification protocol.
      if (account.provider === 'google' && oauthAccessToken) {
        await ensureGoogleWatches(id, oauthAccessToken);
      }

      publishSyncEvent(
        userId,
        id,
        syncResult.totalEvents,
        syncResult.totalDeleted
      );

      return c.json({
        success: true,
        data: {
          syncedEvents: syncResult.totalEvents,
          deletedEvents: syncResult.totalDeleted,
          lastSyncedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await updateSyncStatus(id, 'error', null, errorMessage);
      console.error(`[Calendar Sync] Error syncing account ${id}: ${errorMessage}`);

      // Surface auth failures with the same shape the per-event
      // routes use (calendar-events.ts) so the web client can show
      // its "Reconnect your calendar" toast on a 401 instead of a
      // generic 500 sync error.
      if (err instanceof ProviderAuthError) {
        return c.json(
          {
            success: false,
            error: {
              code: 'PROVIDER_AUTH_FAILED',
              message: errorMessage,
            },
          },
          401
        );
      }

      return c.json({
        success: false,
        error: { code: 'SYNC_ERROR', message: errorMessage },
      }, 500);
    }
  }
);

export { calendarAccountsRouter };
