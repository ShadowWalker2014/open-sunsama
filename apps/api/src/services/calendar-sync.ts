/**
 * Calendar sync service for Open Sunsama API
 * Handles token refresh, calling provider APIs, and upserting events
 */
import {
  getDb,
  eq,
  and,
  calendarAccounts,
  calendars,
  calendarEvents,
} from '@open-sunsama/database';
import { decrypt, encrypt } from './encryption.js';
import {
  GoogleCalendarProvider,
  OutlookCalendarProvider,
  type CalendarProvider,
  type SyncOptions,
  type ExternalEvent,
  type SyncResult,
} from './calendar-providers/index.js';
import { listCalDavEvents } from './calendar-providers/icloud.js';
import { publishEvent } from '../lib/websocket/index.js';

type CalendarAccount = Awaited<ReturnType<typeof getDb>>['query']['calendarAccounts'] extends { findFirst: (args: unknown) => Promise<infer T> } ? NonNullable<T> : never;

export function getProvider(providerName: string): CalendarProvider | null {
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
 * Refresh OAuth tokens if expired
 */
export async function refreshTokensIfNeeded(
  account: { 
    id: string;
    provider: string;
    accessTokenEncrypted: string | null;
    refreshTokenEncrypted: string | null;
    tokenExpiresAt: Date | null;
  },
  provider: CalendarProvider
): Promise<string> {
  const db = getDb();
  let accessToken = decrypt(account.accessTokenEncrypted!);

  if (account.tokenExpiresAt && new Date(account.tokenExpiresAt) < new Date()) {
    if (!account.refreshTokenEncrypted) {
      throw new Error('Token expired and no refresh token available');
    }

    const refreshToken = decrypt(account.refreshTokenEncrypted);
    const newTokens = await provider.refreshTokens(refreshToken);

    await db
      .update(calendarAccounts)
      .set({
        accessTokenEncrypted: encrypt(newTokens.accessToken),
        refreshTokenEncrypted: encrypt(newTokens.refreshToken),
        tokenExpiresAt: newTokens.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(calendarAccounts.id, account.id));

    accessToken = newTokens.accessToken;
  }

  return accessToken;
}

/**
 * Sync events for iCloud (CalDAV) account
 */
export async function syncICloudAccount(
  account: {
    email: string;
    caldavPasswordEncrypted: string | null;
    caldavUrl: string | null;
  },
  accountCalendars: Array<{ id: string; externalId: string }>,
  syncOptions: SyncOptions
): Promise<{ events: ExternalEvent[]; deleted: string[] }> {
  if (!account.caldavPasswordEncrypted) {
    throw new Error('CalDAV credentials missing');
  }

  const password = decrypt(account.caldavPasswordEncrypted);
  const credentials = {
    username: account.email,
    password,
    serverUrl: account.caldavUrl || undefined,
  };

  let allEvents: ExternalEvent[] = [];
  let allDeleted: string[] = [];

  for (const calendar of accountCalendars) {
    const result = await listCalDavEvents(
      credentials,
      calendar.externalId,
      syncOptions
    );
    allEvents = allEvents.concat(result.events);
    allDeleted = allDeleted.concat(result.deleted);
  }

  return { events: allEvents, deleted: allDeleted };
}

/**
 * Sync events for OAuth provider (Google/Outlook)
 */
export async function syncOAuthAccount(
  accessToken: string,
  provider: CalendarProvider,
  accountCalendars: Array<{ id: string; externalId: string; syncToken: string | null }>,
  syncOptions: SyncOptions
): Promise<{ events: ExternalEvent[]; deleted: string[]; nextSyncToken: string | null }> {
  const db = getDb();
  let allEvents: ExternalEvent[] = [];
  let allDeleted: string[] = [];
  let nextSyncToken: string | null = null;

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

      if (result.nextSyncToken) {
        await db
          .update(calendars)
          .set({
            syncToken: result.nextSyncToken,
            updatedAt: new Date(),
          })
          .where(eq(calendars.id, calendar.id));
        nextSyncToken = result.nextSyncToken;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message === 'SYNC_TOKEN_INVALID') {
        await db
          .update(calendars)
          .set({ syncToken: null, updatedAt: new Date() })
          .where(eq(calendars.id, calendar.id));

        const result = await provider.listEvents(
          accessToken,
          calendar.externalId,
          { timeMin: syncOptions.timeMin, timeMax: syncOptions.timeMax }
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

  return { events: allEvents, deleted: allDeleted, nextSyncToken };
}

/**
 * Delete events that were removed from the calendar
 */
export async function deleteRemovedEvents(
  userId: string,
  deletedExternalIds: string[]
): Promise<void> {
  if (deletedExternalIds.length === 0) return;

  const db = getDb();
  for (const externalId of deletedExternalIds) {
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

/**
 * Upsert events to the database
 */
export async function upsertEvents(
  userId: string,
  events: ExternalEvent[],
  accountCalendars: Array<{ id: string; externalId: string }>
): Promise<void> {
  const db = getDb();

  for (const event of events) {
    const calendar = accountCalendars.find(
      (_cal) => events.some((e) => e.externalId === event.externalId)
    );

    if (!calendar) continue;

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
}

/**
 * Update account sync status after sync completes
 */
export async function updateSyncStatus(
  accountId: string,
  status: 'idle' | 'error',
  syncToken: string | null,
  errorMessage?: string
): Promise<void> {
  const db = getDb();
  await db
    .update(calendarAccounts)
    .set({
      syncStatus: status,
      syncToken: status === 'idle' ? syncToken : undefined,
      lastSyncedAt: status === 'idle' ? new Date() : undefined,
      syncError: status === 'error' ? errorMessage : null,
      updatedAt: new Date(),
    })
    .where(eq(calendarAccounts.id, accountId));
}

/**
 * Publish calendar synced event via WebSocket
 */
export function publishSyncEvent(
  userId: string,
  accountId: string,
  eventsCount: number,
  deletedCount: number
): void {
  publishEvent(userId, 'calendar:synced', {
    accountId,
    eventsCount,
    deletedCount,
  });
}
