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
  calendarAccounts,
  calendars,
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
} from '../services/calendar-sync.js';
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

      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setDate(timeMin.getDate() - 30);
      const timeMax = new Date(now);
      timeMax.setDate(timeMax.getDate() + 90);

      const syncOptions = { timeMin, timeMax };

      let allEvents: Array<{
        externalId: string;
        title: string;
        description: string | null;
        location: string | null;
        startTime: Date;
        endTime: Date;
        isAllDay: boolean;
        timezone: string | null;
        recurrenceRule: string | null;
        recurringEventId: string | null;
        status: 'confirmed' | 'tentative' | 'cancelled';
        responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction' | null;
        htmlLink: string | null;
        etag: string | null;
      }> = [];
      let allDeleted: string[] = [];
      let nextSyncToken: string | null = null;

      if (account.provider === 'icloud') {
        const result = await syncICloudAccount(account, accountCalendars, syncOptions);
        allEvents = result.events;
        allDeleted = result.deleted;
      } else {
        const provider = getProvider(account.provider);
        if (!provider || !account.accessTokenEncrypted) {
          throw new Error('Invalid provider or missing credentials');
        }

        const accessToken = await refreshTokensIfNeeded(account, provider);
        const result = await syncOAuthAccount(
          accessToken,
          provider,
          accountCalendars,
          syncOptions
        );
        allEvents = result.events;
        allDeleted = result.deleted;
        nextSyncToken = result.nextSyncToken;
      }

      await deleteRemovedEvents(userId, allDeleted);
      await upsertEvents(userId, allEvents, accountCalendars);
      await updateSyncStatus(id, 'idle', nextSyncToken);
      publishSyncEvent(userId, id, allEvents.length, allDeleted.length);

      return c.json({
        success: true,
        data: {
          syncedEvents: allEvents.length,
          deletedEvents: allDeleted.length,
          lastSyncedAt: new Date().toISOString(),
        },
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      await updateSyncStatus(id, 'error', null, errorMessage);
      console.error(`[Calendar Sync] Error syncing account ${id}: ${errorMessage}`);

      return c.json({
        success: false,
        error: { code: 'SYNC_ERROR', message: errorMessage },
      }, 500);
    }
  }
);

export { calendarAccountsRouter };
