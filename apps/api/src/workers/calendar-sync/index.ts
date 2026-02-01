/**
 * Calendar Sync Worker
 * Periodically syncs calendar events from connected accounts
 * Runs every 5 minutes to check for accounts needing sync
 */
import type PgBoss from 'pg-boss';
import { getPgBoss, JOBS } from '../../lib/pgboss.js';
import { type CalendarSyncCheckPayload, processCalendarSyncCheck } from './sync-check.js';
import { type SyncAccountPayload, processSyncAccount } from './sync-account.js';

/**
 * Check if calendar sync is enabled via environment variable
 */
function isCalendarSyncEnabled(): boolean {
  return process.env.CALENDAR_SYNC_ENABLED !== 'false';
}

/**
 * Register all calendar sync workers and schedule the periodic check
 */
export async function registerCalendarSyncWorkers(): Promise<void> {
  if (!isCalendarSyncEnabled()) {
    console.log('[Calendar Sync Worker] Disabled via CALENDAR_SYNC_ENABLED=false');
    return;
  }

  const boss = await getPgBoss();

  // Create queues first (required in pg-boss v10+)
  await boss.createQueue(JOBS.CALENDAR_SYNC_CHECK);
  await boss.createQueue(JOBS.SYNC_CALENDAR_ACCOUNT);

  // Schedule the calendar sync check to run every 5 minutes
  // singletonKey prevents duplicate schedules on server restarts
  await boss.schedule(JOBS.CALENDAR_SYNC_CHECK, '*/5 * * * *', {}, {
    tz: 'UTC',
    singletonKey: 'calendar-sync-check-schedule',
  });

  // Register the sync check handler
  await boss.work(
    JOBS.CALENDAR_SYNC_CHECK,
    async (jobs: PgBoss.Job<CalendarSyncCheckPayload>[]) => {
      for (const job of jobs) {
        await processCalendarSyncCheck(job);
      }
    }
  );

  // Register the sync account handler with concurrency
  // batchSize controls how many accounts are synced at once
  await boss.work(
    JOBS.SYNC_CALENDAR_ACCOUNT,
    { batchSize: 5 }, // Process 5 accounts concurrently
    async (jobs: PgBoss.Job<SyncAccountPayload>[]) => {
      // Process jobs concurrently within the batch
      await Promise.all(jobs.map(job => processSyncAccount(job)));
    }
  );

  console.log('[Calendar Sync Worker] Registered and scheduled');
}

// Re-export types for convenience
export type { CalendarSyncCheckPayload } from './sync-check.js';
export type { SyncAccountPayload } from './sync-account.js';
