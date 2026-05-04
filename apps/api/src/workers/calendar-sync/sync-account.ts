/**
 * Calendar account sync handler
 * Syncs events for a single calendar account
 */
import type PgBoss from 'pg-boss';
import { getDb, eq } from '@open-sunsama/database';
import { calendarAccounts, calendars } from '@open-sunsama/database/schema';
import { subDays, addDays, startOfDay, endOfDay } from 'date-fns';
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
  type AccountSyncResult,
} from '../../services/calendar-sync.js';

// Payload type for the sync account job
export interface SyncAccountPayload {
  accountId: string;
  userId: string;
  provider: string;
}

// Default sync window: 7 days in past, 30 days in future
const SYNC_DAYS_PAST = 7;
const SYNC_DAYS_FUTURE = 30;

/**
 * Process a single calendar account sync job
 */
export async function processSyncAccount(
  job: PgBoss.Job<SyncAccountPayload>
): Promise<void> {
  const { accountId, userId, provider: providerName } = job.data;
  const db = getDb();

  console.log(`[Calendar Sync] Starting sync for account ${accountId} (${providerName})`);

  try {
    // Get the full account details
    const account = await db.query.calendarAccounts.findFirst({
      where: eq(calendarAccounts.id, accountId),
    });

    if (!account) {
      console.error(`[Calendar Sync] Account ${accountId} not found`);
      return;
    }

    if (!account.isActive) {
      console.log(`[Calendar Sync] Account ${accountId} is inactive, skipping`);
      await updateSyncStatus(accountId, 'idle', null);
      return;
    }

    // Get calendars for this account
    const accountCalendars = await db
      .select({
        id: calendars.id,
        externalId: calendars.externalId,
        syncToken: calendars.syncToken,
      })
      .from(calendars)
      .where(eq(calendars.accountId, accountId));

    if (accountCalendars.length === 0) {
      console.log(`[Calendar Sync] No calendars found for account ${accountId}`);
      await updateSyncStatus(accountId, 'idle', null);
      return;
    }

    // Calculate sync window
    const now = new Date();
    const syncOptions = {
      timeMin: startOfDay(subDays(now, SYNC_DAYS_PAST)),
      timeMax: endOfDay(addDays(now, SYNC_DAYS_FUTURE)),
    };

    let result: AccountSyncResult;

    if (providerName === 'icloud') {
      // Handle iCloud (CalDAV) sync
      result = await syncICloudAccount(
        {
          email: account.email,
          caldavPasswordEncrypted: account.caldavPasswordEncrypted,
          caldavUrl: account.caldavUrl,
        },
        accountCalendars,
        syncOptions
      );
    } else {
      // Handle OAuth providers (Google, Outlook)
      const provider = getProvider(providerName);
      if (!provider) {
        throw new Error(`Unknown provider: ${providerName}`);
      }

      // Refresh tokens if needed
      const accessToken = await refreshTokensIfNeeded(
        {
          id: accountId,
          provider: providerName,
          accessTokenEncrypted: account.accessTokenEncrypted,
          refreshTokenEncrypted: account.refreshTokenEncrypted,
          tokenExpiresAt: account.tokenExpiresAt,
        },
        provider
      );

      // Sync events
      result = await syncOAuthAccount(
        accessToken,
        provider,
        accountCalendars,
        syncOptions
      );

      // Register Google `events.watch` push channels for any
      // calendars that don't yet have one. Idempotent and best-
      // effort — failures don't affect the rest of the sync.
      if (providerName === 'google') {
        await ensureGoogleWatches(accountId, accessToken);
      }
    }

    // Delete removed events (per-calendar scoped)
    await deleteRemovedEvents(userId, result.perCalendar);

    // Upsert synced events (each event attributed to its source calendar)
    await upsertEvents(userId, result.perCalendar);

    // Update sync status
    await updateSyncStatus(accountId, 'idle', result.nextSyncToken);

    // Publish sync event via WebSocket
    publishSyncEvent(
      userId,
      accountId,
      result.totalEvents,
      result.totalDeleted
    );

    console.log(
      `[Calendar Sync] Completed sync for account ${accountId}: ${result.totalEvents} events, ${result.totalDeleted} deleted`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Calendar Sync] Error syncing account ${accountId}:`, error);

    // Update sync status with error
    await updateSyncStatus(accountId, 'error', null, errorMessage);
  }
}
