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
} from '../../services/calendar-sync.js';
import { type ExternalEvent } from '../../services/calendar-providers/index.js';

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

    let events: ExternalEvent[] = [];
    let deleted: string[] = [];
    let nextSyncToken: string | null = null;

    if (providerName === 'icloud') {
      // Handle iCloud (CalDAV) sync
      const result = await syncICloudAccount(
        {
          email: account.email,
          caldavPasswordEncrypted: account.caldavPasswordEncrypted,
          caldavUrl: account.caldavUrl,
        },
        accountCalendars,
        syncOptions
      );
      events = result.events;
      deleted = result.deleted;
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
      const result = await syncOAuthAccount(
        accessToken,
        provider,
        accountCalendars,
        syncOptions
      );
      events = result.events;
      deleted = result.deleted;
      nextSyncToken = result.nextSyncToken;
    }

    // Delete removed events
    await deleteRemovedEvents(userId, deleted);

    // Upsert synced events
    await upsertEvents(userId, events, accountCalendars);

    // Update sync status
    await updateSyncStatus(accountId, 'idle', nextSyncToken);

    // Publish sync event via WebSocket
    publishSyncEvent(userId, accountId, events.length, deleted.length);

    console.log(
      `[Calendar Sync] Completed sync for account ${accountId}: ${events.length} events, ${deleted.length} deleted`
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[Calendar Sync] Error syncing account ${accountId}:`, error);

    // Update sync status with error
    await updateSyncStatus(accountId, 'error', null, errorMessage);
  }
}
