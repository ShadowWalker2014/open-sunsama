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
 * How long an account may sit in `syncing` before we assume the job died and
 * queue it again. Without this an interrupted worker (deploy, crash, lost
 * pg-boss job) leaves the account marked `syncing` forever, and the check —
 * which only looked at `idle`/null — skipped it for good: "connected but never
 * syncs".
 */
const STUCK_SYNCING_MINUTES = 30;

/**
 * How long to wait before retrying an account whose last sync errored. Errors
 * are usually transient (expired token, provider 5xx, network), but a status
 * of `error` used to be terminal for the same reason as above.
 */
const ERROR_RETRY_MINUTES = 30;

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

  // Find active accounts that need syncing. An account qualifies when it is:
  //  - idle (or has no status yet) and hasn't synced within the interval,
  //  - stuck in `syncing` past STUCK_SYNCING_MINUTES (dead job — self-heal),
  //  - or in `error` and untouched for ERROR_RETRY_MINUTES (transient failure).
  // The last two used to be excluded entirely, which is why an account could
  // read as connected while silently never syncing again.
  const syncThreshold = subMinutes(now, SYNC_INTERVAL_MINUTES);
  const stuckThreshold = subMinutes(now, STUCK_SYNCING_MINUTES);
  const errorRetryThreshold = subMinutes(now, ERROR_RETRY_MINUTES);

  const accountsNeedingSync = await db
    .select({
      id: calendarAccounts.id,
      userId: calendarAccounts.userId,
      provider: calendarAccounts.provider,
      email: calendarAccounts.email,
      syncStatus: calendarAccounts.syncStatus,
    })
    .from(calendarAccounts)
    .where(
      and(
        eq(calendarAccounts.isActive, true),
        or(
          // Normal path: idle / never-synced, due for a refresh.
          and(
            or(
              eq(calendarAccounts.syncStatus, 'idle'),
              isNull(calendarAccounts.syncStatus)
            ),
            or(
              lt(calendarAccounts.lastSyncedAt, syncThreshold),
              isNull(calendarAccounts.lastSyncedAt)
            )
          ),
          // Recovery: a sync that never reported back.
          and(
            eq(calendarAccounts.syncStatus, 'syncing'),
            lt(calendarAccounts.updatedAt, stuckThreshold)
          ),
          // Retry: a sync that failed a while ago.
          and(
            eq(calendarAccounts.syncStatus, 'error'),
            lt(calendarAccounts.updatedAt, errorRetryThreshold)
          )
        )
      )
    );

  if (accountsNeedingSync.length === 0) {
    return;
  }

  const recovered = accountsNeedingSync.filter(
    (a) => a.syncStatus === 'syncing' || a.syncStatus === 'error'
  ).length;
  console.log(
    `[Calendar Sync Check] Found ${accountsNeedingSync.length} accounts needing sync` +
      (recovered > 0 ? ` (${recovered} recovered from stuck/errored state)` : '')
  );

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
