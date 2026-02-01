/**
 * Calendar sync check handler
 * Runs every 5 minutes to find accounts needing sync and queue sync jobs
 */
import type PgBoss from 'pg-boss';
import { getDb, and, lt, eq, or, isNull } from '@open-sunsama/database';
import { calendarAccounts } from '@open-sunsama/database/schema';
import { subMinutes } from 'date-fns';
import { getPgBoss, JOBS } from '../../lib/pgboss.js';
import { type SyncAccountPayload } from './sync-account.js';

// Payload type for the scheduled check job
export interface CalendarSyncCheckPayload {
  // Empty - runs on schedule
}

// Sync interval in minutes - accounts not synced in this time will be queued
const SYNC_INTERVAL_MINUTES = 15;

/**
 * Main job handler that finds accounts needing sync and queues sync jobs
 * Runs every 5 minutes
 */
export async function processCalendarSyncCheck(
  _job: PgBoss.Job<CalendarSyncCheckPayload>
): Promise<void> {
  const db = getDb();
  const boss = await getPgBoss();
  const now = new Date();

  // Find accounts that need syncing:
  // 1. Active accounts
  // 2. Not currently syncing
  // 3. Last synced more than 15 minutes ago OR never synced
  const syncThreshold = subMinutes(now, SYNC_INTERVAL_MINUTES);

  const accountsNeedingSync = await db
    .select({
      id: calendarAccounts.id,
      userId: calendarAccounts.userId,
      provider: calendarAccounts.provider,
      email: calendarAccounts.email,
    })
    .from(calendarAccounts)
    .where(
      and(
        eq(calendarAccounts.isActive, true),
        or(
          eq(calendarAccounts.syncStatus, 'idle'),
          isNull(calendarAccounts.syncStatus)
        ),
        or(
          lt(calendarAccounts.lastSyncedAt, syncThreshold),
          isNull(calendarAccounts.lastSyncedAt)
        )
      )
    );

  if (accountsNeedingSync.length === 0) {
    return;
  }

  console.log(`[Calendar Sync Check] Found ${accountsNeedingSync.length} accounts needing sync`);

  // Queue sync jobs for each account
  let jobsQueued = 0;
  for (const account of accountsNeedingSync) {
    try {
      // Mark account as syncing before queuing to prevent duplicate syncs
      await db
        .update(calendarAccounts)
        .set({
          syncStatus: 'syncing',
          updatedAt: new Date(),
        })
        .where(eq(calendarAccounts.id, account.id));

      await boss.send(JOBS.SYNC_CALENDAR_ACCOUNT, {
        accountId: account.id,
        userId: account.userId,
        provider: account.provider,
      } as SyncAccountPayload);

      jobsQueued++;
    } catch (error) {
      console.error(`[Calendar Sync Check] Error queuing sync for account ${account.id}:`, error);
      
      // Reset sync status if queueing failed
      await db
        .update(calendarAccounts)
        .set({
          syncStatus: 'error',
          syncError: error instanceof Error ? error.message : 'Failed to queue sync job',
          updatedAt: new Date(),
        })
        .where(eq(calendarAccounts.id, account.id));
    }
  }

  if (jobsQueued > 0) {
    console.log(`[Calendar Sync Check] Queued ${jobsQueued} sync jobs`);
  }
}
