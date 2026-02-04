/**
 * Recurring Task Worker
 * Automatically generates task instances from recurring task series
 * Runs timezone-aware to handle scheduling in each user's timezone
 */
import type PgBoss from "pg-boss";
import { getPgBoss, JOBS } from "../../lib/pgboss.js";
import type {
  RecurringCheckPayload,
  GenerateRecurringTaskPayload,
} from "./utils.js";
import { processRecurringTaskCheck } from "./timezone-check.js";
import { processGenerateRecurringTask } from "./task-generator.js";

/**
 * Check if recurring tasks feature is enabled via environment variable
 */
function isRecurringEnabled(): boolean {
  return process.env.RECURRING_ENABLED !== "false";
}

/**
 * Register all recurring task workers and schedule the periodic check
 */
export async function registerRecurringWorkers(): Promise<void> {
  if (!isRecurringEnabled()) {
    console.log("[Recurring Worker] Disabled via RECURRING_ENABLED=false");
    return;
  }

  const boss = await getPgBoss();

  // Create queues first (required in pg-boss v10+)
  await boss.createQueue(JOBS.RECURRING_TASK_CHECK);
  await boss.createQueue(JOBS.GENERATE_RECURRING_TASK);

  // Schedule the recurring check to run every minute
  // This checks all active series and queues task generation as needed
  await boss.schedule(
    JOBS.RECURRING_TASK_CHECK,
    "* * * * *",
    {},
    {
      tz: "UTC",
      singletonKey: "recurring-task-check-schedule",
    }
  );

  // Register the recurring check handler
  await boss.work(
    JOBS.RECURRING_TASK_CHECK,
    async (jobs: PgBoss.Job<RecurringCheckPayload>[]) => {
      for (const job of jobs) {
        await processRecurringTaskCheck(job);
      }
    }
  );

  // Register the task generator handler with concurrency
  await boss.work(
    JOBS.GENERATE_RECURRING_TASK,
    { batchSize: 10 }, // Process 10 tasks concurrently
    async (jobs: PgBoss.Job<GenerateRecurringTaskPayload>[]) => {
      await Promise.all(jobs.map((job) => processGenerateRecurringTask(job)));
    }
  );

  console.log("[Recurring Worker] Registered and scheduled");
}

// Re-export types for convenience
export type {
  RecurringCheckPayload,
  GenerateRecurringTaskPayload,
} from "./utils.js";
