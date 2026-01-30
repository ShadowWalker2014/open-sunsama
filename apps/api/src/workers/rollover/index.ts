/**
 * Task Rollover Worker
 * Automatically moves incomplete tasks from past dates to today
 * Runs timezone-aware to handle midnight in each user's timezone
 */
import type PgBoss from 'pg-boss';
import { getPgBoss, JOBS } from '../../lib/pgboss.js';
import { type RolloverCheckPayload, type UserBatchRolloverPayload } from './utils.js';
import { processTimezoneRolloverCheck } from './timezone-check.js';
import { processUserBatchRollover } from './batch-processor.js';

/**
 * Check if rollover feature is enabled via environment variable
 */
function isRolloverEnabled(): boolean {
  return process.env.ROLLOVER_ENABLED !== 'false';
}

/**
 * Register all rollover workers and schedule the periodic check
 */
export async function registerRolloverWorkers(): Promise<void> {
  if (!isRolloverEnabled()) {
    console.log('[Rollover Worker] Disabled via ROLLOVER_ENABLED=false');
    return;
  }

  const boss = await getPgBoss();

  // Create queues first (required in pg-boss v10+)
  await boss.createQueue(JOBS.TIMEZONE_ROLLOVER_CHECK);
  await boss.createQueue(JOBS.USER_BATCH_ROLLOVER);

  // Schedule the timezone check to run every minute
  // singletonKey prevents duplicate schedules on server restarts
  await boss.schedule(JOBS.TIMEZONE_ROLLOVER_CHECK, '* * * * *', {}, {
    tz: 'UTC',
    singletonKey: 'timezone-rollover-check-schedule',
  });

  // Register the timezone check handler
  // In PG Boss v10, work() handler receives an array of jobs
  await boss.work(
    JOBS.TIMEZONE_ROLLOVER_CHECK,
    async (jobs: PgBoss.Job<RolloverCheckPayload>[]) => {
      for (const job of jobs) {
        await processTimezoneRolloverCheck(job);
      }
    }
  );

  // Register the batch rollover handler with concurrency
  // batchSize controls how many jobs are fetched at once
  await boss.work(
    JOBS.USER_BATCH_ROLLOVER,
    { batchSize: 5 }, // Process 5 batches concurrently
    async (jobs: PgBoss.Job<UserBatchRolloverPayload>[]) => {
      // Process jobs concurrently within the batch
      await Promise.all(jobs.map(job => processUserBatchRollover(job)));
    }
  );

  console.log('[Rollover Worker] Registered and scheduled');
}

// Re-export types for convenience
export type { RolloverCheckPayload, UserBatchRolloverPayload } from './utils.js';
