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
  calendarEvents,
  sql,
} from '@open-sunsama/database';
import { NotFoundError } from '@open-sunsama/utils';
import { auth, requireScopes, type AuthVariables } from '../middleware/auth.js';
import { calendarAccountIdParamSchema } from '../validation/calendar.js';
import { decrypt, encrypt } from '../services/encryption.js';
import {
  GoogleCalendarProvider,
  OutlookCalendarProvider,
  type CalendarProvider,
  type SyncOptions,
  type ExternalEvent,
} from '../services/calendar-providers/index.js';
import { listCalDavEvents, listCalDavCalendars } from '../services/calendar-providers/icloud.js';
import { publishEvent } from '../lib/websocket/index.js';

const calendarAccountsRouter = new Hono<{ Variables: AuthVariables }>();
calendarAccountsRouter.use('*', auth);

function getProvider(providerName: string): CalendarProvider | null {
  switch (providerName) {
    case 'google':
      return new GoogleCalendarProvider();
    case 'outlook':
      return new OutlookCalendarProvider();
    default:
      return null; // iCloud uses CalDAV directly
  }
}

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

    // Fetch accounts with calendar count
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

    // Verify account belongs to user
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

    // Delete account (cascades to calendars and events via FK)
    await db
      .delete(calendarAccounts)
      .where(eq(calendarAccounts.id, id));

    // Publish realtime event
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

    // Fetch account with credentials
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

    // Check if account is active
    if (!account.isActive) {
      return c.json({
        success: false,
        error: { code: 'ACCOUNT_INACTIVE', message: 'Calendar account is inactive' },
      }, 400);
    }

    // Mark as syncing
    await db
      .update(calendarAccounts)
      .set({ syncStatus: 'syncing', syncError: null, updatedAt: new Date() })
      .where(eq(calendarAccounts.id, id));

    try {
      // Fetch all enabled calendars for this account
      const accountCalendars = await db
        .select()
        .from(calendars)
        .where(
          and(
            eq(calendars.accountId, id),
            eq(calendars.isEnabled, true)
          )
        );

      // Calculate sync time range (30 days back, 90 days forward)
      const now = new Date();
      const timeMin = new Date(now);
      timeMin.setDate(timeMin.getDate() - 30);
      const timeMax = new Date(now);
      timeMax.setDate(timeMax.getDate() + 90);

      const syncOptions: SyncOptions = {
        timeMin,
        timeMax,
      };

      let allEvents: ExternalEvent[] = [];
      let allDeleted: string[] = [];
      let nextSyncToken: string | null = null;

      if (account.provider === 'icloud') {
        // iCloud uses CalDAV
        if (!account.caldavPasswordEncrypted) {
          throw new Error('CalDAV credentials missing');
        }

        const password = decrypt(account.caldavPasswordEncrypted);
        const credentials = {
          username: account.email,
          password,
          serverUrl: account.caldavUrl || undefined,
        };

        for (const calendar of accountCalendars) {
          const result = await listCalDavEvents(
            credentials,
            calendar.externalId,
            syncOptions
          );
          allEvents = allEvents.concat(result.events);
          allDeleted = allDeleted.concat(result.deleted);
        }
      } else {
        // OAuth providers (Google/Outlook)
        const provider = getProvider(account.provider);
        if (!provider || !account.accessTokenEncrypted) {
          throw new Error('Invalid provider or missing credentials');
        }

        let accessToken = decrypt(account.accessTokenEncrypted);

        // Check if token needs refresh
        if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
          if (!account.refreshTokenEncrypted) {
            throw new Error('Token expired and no refresh token available');
          }

          const refreshToken = decrypt(account.refreshTokenEncrypted);
          const newTokens = await provider.refreshTokens(refreshToken);

          // Update tokens in database
          await db
            .update(calendarAccounts)
            .set({
              accessTokenEncrypted: encrypt(newTokens.accessToken),
              refreshTokenEncrypted: encrypt(newTokens.refreshToken),
              tokenExpiresAt: newTokens.expiresAt,
              updatedAt: new Date(),
            })
            .where(eq(calendarAccounts.id, id));

          accessToken = newTokens.accessToken;
        }

        for (const calendar of accountCalendars) {
          try {
            const options: SyncOptions = {
              ...syncOptions,
              syncToken: calendar.syncToken || undefined,
            };

            const result = await provider.listEvents(
              accessToken,
              calendar.externalId,
              options
            );

            allEvents = allEvents.concat(result.events);
            allDeleted = allDeleted.concat(result.deleted);

            // Update calendar sync token
            if (result.nextSyncToken) {
              await db
                .update(calendars)
                .set({
                  syncToken: result.nextSyncToken,
                  updatedAt: new Date(),
                })
                .where(eq(calendars.id, calendar.id));
            }

            if (result.nextSyncToken) {
              nextSyncToken = result.nextSyncToken;
            }
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            if (message === 'SYNC_TOKEN_INVALID') {
              // Clear sync token and retry
              await db
                .update(calendars)
                .set({ syncToken: null, updatedAt: new Date() })
                .where(eq(calendars.id, calendar.id));

              // Retry without sync token
              const result = await provider.listEvents(
                accessToken,
                calendar.externalId,
                { timeMin, timeMax }
              );

              allEvents = allEvents.concat(result.events);
              allDeleted = allDeleted.concat(result.deleted);

              if (result.nextSyncToken) {
                await db
                  .update(calendars)
                  .set({
                    syncToken: result.nextSyncToken,
                    updatedAt: new Date(),
                  })
                  .where(eq(calendars.id, calendar.id));
              }
            } else {
              throw err;
            }
          }
        }
      }

      // Delete removed events
      if (allDeleted.length > 0) {
        for (const externalId of allDeleted) {
          await db
            .delete(calendarEvents)
            .where(
              and(
                eq(calendarEvents.userId, userId),
                eq(calendarEvents.externalId, externalId)
              )
            );
        }
      }

      // Upsert events
      for (const event of allEvents) {
        // Find the calendar this event belongs to
        const calendar = accountCalendars.find(
          (cal) => allEvents.some((e) => e.externalId === event.externalId)
        );
        
        if (!calendar) continue;

        // Check if event exists
        const [existing] = await db
          .select({ id: calendarEvents.id })
          .from(calendarEvents)
          .where(
            and(
              eq(calendarEvents.calendarId, calendar.id),
              eq(calendarEvents.externalId, event.externalId)
            )
          )
          .limit(1);

        if (existing) {
          // Update existing event
          await db
            .update(calendarEvents)
            .set({
              title: event.title,
              description: event.description,
              location: event.location,
              startTime: event.startTime,
              endTime: event.endTime,
              isAllDay: event.isAllDay,
              timezone: event.timezone,
              recurrenceRule: event.recurrenceRule,
              recurringEventId: event.recurringEventId,
              status: event.status,
              responseStatus: event.responseStatus,
              htmlLink: event.htmlLink,
              etag: event.etag,
              updatedAt: new Date(),
            })
            .where(eq(calendarEvents.id, existing.id));
        } else {
          // Insert new event
          await db
            .insert(calendarEvents)
            .values({
              calendarId: calendar.id,
              userId,
              externalId: event.externalId,
              title: event.title,
              description: event.description,
              location: event.location,
              startTime: event.startTime,
              endTime: event.endTime,
              isAllDay: event.isAllDay,
              timezone: event.timezone,
              recurrenceRule: event.recurrenceRule,
              recurringEventId: event.recurringEventId,
              status: event.status,
              responseStatus: event.responseStatus,
              htmlLink: event.htmlLink,
              etag: event.etag,
            });
        }
      }

      // Update account sync status
      await db
        .update(calendarAccounts)
        .set({
          syncStatus: 'idle',
          syncToken: nextSyncToken,
          lastSyncedAt: new Date(),
          syncError: null,
          updatedAt: new Date(),
        })
        .where(eq(calendarAccounts.id, id));

      // Publish realtime event
      publishEvent(userId, 'calendar:synced', {
        accountId: id,
        eventsCount: allEvents.length,
        deletedCount: allDeleted.length,
      });

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
      
      // Update account with error
      await db
        .update(calendarAccounts)
        .set({
          syncStatus: 'error',
          syncError: errorMessage,
          updatedAt: new Date(),
        })
        .where(eq(calendarAccounts.id, id));

      console.error(`[Calendar Sync] Error syncing account ${id}: ${errorMessage}`);

      return c.json({
        success: false,
        error: { code: 'SYNC_ERROR', message: errorMessage },
      }, 500);
    }
  }
);

export { calendarAccountsRouter };
