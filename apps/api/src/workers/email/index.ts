/**
 * Email Workers
 * Handles scheduled email notifications (daily summary, task reminders, etc.)
 */
import type PgBoss from 'pg-boss';
import { getPgBoss, JOBS } from '../../lib/pgboss.js';
import { 
  type DailySummaryCheckPayload, 
  type SendDailySummaryPayload,
  processDailySummaryCheck 
} from './daily-summary.js';
import { processSendDailySummary } from './send-summary.js';
import {
  type TaskReminderCheckPayload,
  type SendTaskReminderPayload,
  processTaskReminderCheck,
} from './task-reminder.js';
import { processSendTaskReminder } from './send-reminder.js';

/**
 * Check if email notifications are enabled via environment variable
 */
function isEmailWorkersEnabled(): boolean {
  return process.env.EMAIL_WORKERS_ENABLED !== 'false';
}

/**
 * Register all email workers and schedule the periodic checks
 */
export async function registerEmailWorkers(): Promise<void> {
  if (!isEmailWorkersEnabled()) {
    console.log('[Email Workers] Disabled via EMAIL_WORKERS_ENABLED=false');
    return;
  }

  const boss = await getPgBoss();

  // Create queues first (required in pg-boss v10+)
  await boss.createQueue(JOBS.DAILY_SUMMARY_CHECK);
  await boss.createQueue(JOBS.SEND_DAILY_SUMMARY);
  await boss.createQueue(JOBS.TASK_REMINDER_CHECK);
  await boss.createQueue(JOBS.SEND_TASK_REMINDER);

  // Schedule the daily summary check to run every minute
  // singletonKey prevents duplicate schedules on server restarts
  await boss.schedule(JOBS.DAILY_SUMMARY_CHECK, '* * * * *', {}, {
    tz: 'UTC',
    singletonKey: 'daily-summary-check-schedule',
  });

  // Schedule the task reminder check to run every minute
  await boss.schedule(JOBS.TASK_REMINDER_CHECK, '* * * * *', {}, {
    tz: 'UTC',
    singletonKey: 'task-reminder-check-schedule',
  });

  // Register the daily summary check handler
  await boss.work(
    JOBS.DAILY_SUMMARY_CHECK,
    async (jobs: PgBoss.Job<DailySummaryCheckPayload>[]) => {
      for (const job of jobs) {
        await processDailySummaryCheck(job);
      }
    }
  );

  // Register the send daily summary handler with concurrency
  // batchSize controls how many jobs are fetched at once
  await boss.work(
    JOBS.SEND_DAILY_SUMMARY,
    { batchSize: 10 }, // Process 10 emails concurrently
    async (jobs: PgBoss.Job<SendDailySummaryPayload>[]) => {
      // Process jobs concurrently within the batch
      await Promise.all(jobs.map(job => processSendDailySummary(job)));
    }
  );

  // Register the task reminder check handler
  await boss.work(
    JOBS.TASK_REMINDER_CHECK,
    async (jobs: PgBoss.Job<TaskReminderCheckPayload>[]) => {
      for (const job of jobs) {
        await processTaskReminderCheck(job);
      }
    }
  );

  // Register the send task reminder handler with concurrency
  await boss.work(
    JOBS.SEND_TASK_REMINDER,
    { batchSize: 10 }, // Process 10 reminders concurrently
    async (jobs: PgBoss.Job<SendTaskReminderPayload>[]) => {
      await Promise.all(jobs.map(job => processSendTaskReminder(job)));
    }
  );

  console.log('[Email Workers] Registered and scheduled');
}

// Re-export types for convenience
export type { DailySummaryCheckPayload, SendDailySummaryPayload } from './daily-summary.js';
export type { TaskReminderCheckPayload, SendTaskReminderPayload } from './task-reminder.js';
