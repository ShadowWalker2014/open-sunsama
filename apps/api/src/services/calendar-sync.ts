/**
 * Calendar sync service for Open Sunsama API
 * Handles token refresh, calling provider APIs, and upserting events
 */
import {
  getDb,
  eq,
  and,
  inArray,
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
} from './calendar-providers/index.js';
import { listCalDavEvents } from './calendar-providers/icloud.js';
import { publishEvent } from '../lib/websocket/index.js';

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
 * One calendar's slice of a sync result. We keep events grouped by the
 * Open-Sunsama calendar id so `upsertEvents` can attribute each event to
 * the calendar that actually owns it. Concatenating into a flat array (the
 * old behaviour) loses calendar identity and leads to every event being
 * misattributed to whichever calendar happens to be first in the list.
 */
export interface PerCalendarSyncResult {
  /** Open-Sunsama calendar id this slice belongs to */
  calendarId: string;
  events: ExternalEvent[];
  /** Provider-side external ids of events that were removed */
  deleted: string[];
}

export interface AccountSyncResult {
  perCalendar: PerCalendarSyncResult[];
  /**
   * The sync token from the most recent calendar sync, surfaced so the
   * account-level status update can record it. Per-calendar sync tokens
   * are also written inside `syncOAuthAccount` directly.
   */
  nextSyncToken: string | null;
  /** Total event count across all calendars (for logging / WS payloads) */
  totalEvents: number;
  /** Total deleted count across all calendars */
  totalDeleted: number;
}

/**
 * Sync events for iCloud (CalDAV) account.
 * Keeps events grouped by calendarId so the upsert can attribute correctly.
 */
export async function syncICloudAccount(
  account: {
    email: string;
    caldavPasswordEncrypted: string | null;
    caldavUrl: string | null;
  },
  accountCalendars: Array<{ id: string; externalId: string }>,
  syncOptions: SyncOptions
): Promise<AccountSyncResult> {
  if (!account.caldavPasswordEncrypted) {
    throw new Error('CalDAV credentials missing');
  }

  const password = decrypt(account.caldavPasswordEncrypted);
  const credentials = {
    username: account.email,
    password,
    serverUrl: account.caldavUrl || undefined,
  };

  const perCalendar: PerCalendarSyncResult[] = [];
  let totalEvents = 0;
  let totalDeleted = 0;

  for (const calendar of accountCalendars) {
    const result = await listCalDavEvents(
      credentials,
      calendar.externalId,
      syncOptions
    );
    perCalendar.push({
      calendarId: calendar.id,
      events: result.events,
      deleted: result.deleted,
    });
    totalEvents += result.events.length;
    totalDeleted += result.deleted.length;
  }

  return { perCalendar, nextSyncToken: null, totalEvents, totalDeleted };
}

/**
 * Sync events for an OAuth provider (Google/Outlook).
 * Returns one slice per calendar so the upsert can attribute events to
 * the calendar that actually owns them.
 */
export async function syncOAuthAccount(
  accessToken: string,
  provider: CalendarProvider,
  accountCalendars: Array<{ id: string; externalId: string; syncToken: string | null }>,
  syncOptions: SyncOptions
): Promise<AccountSyncResult> {
  const db = getDb();
  const perCalendar: PerCalendarSyncResult[] = [];
  let nextSyncToken: string | null = null;
  let totalEvents = 0;
  let totalDeleted = 0;

  for (const calendar of accountCalendars) {
    let result;
    try {
      const options: SyncOptions = {
        ...syncOptions,
        syncToken: calendar.syncToken || undefined,
      };

      result = await provider.listEvents(
        accessToken,
        calendar.externalId,
        options
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message !== 'SYNC_TOKEN_INVALID') {
        throw err;
      }
      // Sync token expired — clear it and re-sync from scratch within
      // the time window.
      await db
        .update(calendars)
        .set({ syncToken: null, updatedAt: new Date() })
        .where(eq(calendars.id, calendar.id));

      result = await provider.listEvents(
        accessToken,
        calendar.externalId,
        { timeMin: syncOptions.timeMin, timeMax: syncOptions.timeMax }
      );
    }

    perCalendar.push({
      calendarId: calendar.id,
      events: result.events,
      deleted: result.deleted,
    });
    totalEvents += result.events.length;
    totalDeleted += result.deleted.length;

    if (result.nextSyncToken) {
      await db
        .update(calendars)
        .set({ syncToken: result.nextSyncToken, updatedAt: new Date() })
        .where(eq(calendars.id, calendar.id));
      nextSyncToken = result.nextSyncToken;
    }
  }

  return { perCalendar, nextSyncToken, totalEvents, totalDeleted };
}

/**
 * Delete events that were removed from the calendar
 */
export async function deleteRemovedEvents(
  userId: string,
  perCalendar: PerCalendarSyncResult[]
): Promise<void> {
  const db = getDb();
  for (const slice of perCalendar) {
    if (slice.deleted.length === 0) continue;
    // Scope deletes to the calendar the deletion came from, so an event
    // sharing an externalId across calendars (rare with most providers
    // but legal with CalDAV) can't be wiped from a sibling calendar.
    await db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          eq(calendarEvents.calendarId, slice.calendarId),
          inArray(calendarEvents.externalId, slice.deleted)
        )
      );
  }
}

/**
 * Upsert events to the database, attributing each one to the calendar
 * it actually came from.
 *
 * This used to take a flat `events: ExternalEvent[]` plus an
 * `accountCalendars` list and try to "match" each event back to its
 * calendar — but the matcher was broken (the predicate ignored its
 * argument), so every event got assigned to whichever calendar appeared
 * first in the list. With multiple calendars per account that meant
 * either silent data loss (events attributed to a disabled calendar) or
 * cross-contamination (events from "Personal" showing up under "Work").
 *
 * Take the per-calendar grouping directly so the source of truth is
 * preserved end-to-end.
 */
export async function upsertEvents(
  userId: string,
  perCalendar: PerCalendarSyncResult[]
): Promise<void> {
  const db = getDb();

  for (const slice of perCalendar) {
    for (const event of slice.events) {
      const [existing] = await db
        .select({ id: calendarEvents.id })
        .from(calendarEvents)
        .where(
          and(
            eq(calendarEvents.calendarId, slice.calendarId),
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
        await db.insert(calendarEvents).values({
          calendarId: slice.calendarId,
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
