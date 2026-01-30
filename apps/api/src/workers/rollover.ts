/**
 * Task Rollover Worker
 * Automatically moves incomplete tasks from past dates to today
 * Runs timezone-aware to handle midnight in each user's timezone
 */
import PgBoss from 'pg-boss';
import { getDb, eq, and, lt, isNull, isNotNull, inArray, sql } from '@open-sunsama/database';
import { users, tasks, rolloverLogs } from '@open-sunsama/database/schema';
import { toZonedTime } from 'date-fns-tz';
import { format, subDays, addDays } from 'date-fns';
import { getPgBoss, JOBS } from '../lib/pgboss.js';

// Payload types for job handlers
interface RolloverCheckPayload {
  // Empty - runs on schedule
}

interface UserBatchRolloverPayload {
  timezone: string;
  targetDate: string; // YYYY-MM-DD - the "today" date in this timezone
  userIds: string[];
  batchNumber: number;
  totalBatches: number;
}

const BATCH_SIZE = 100; // Users per batch

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

  // Schedule the timezone check to run every minute
  await boss.schedule(JOBS.TIMEZONE_ROLLOVER_CHECK, '* * * * *', {}, {
    tz: 'UTC',
  });

  // Register the timezone check handler
  // In PG Boss v10, work() handler receives an array of jobs
  await boss.work<RolloverCheckPayload>(
    JOBS.TIMEZONE_ROLLOVER_CHECK,
    async (jobs: PgBoss.Job<RolloverCheckPayload>[]) => {
      for (const job of jobs) {
        await processTimezoneRolloverCheck(job);
      }
    }
  );

  // Register the batch rollover handler with concurrency
  // batchSize controls how many jobs are fetched at once
  await boss.work<UserBatchRolloverPayload>(
    JOBS.USER_BATCH_ROLLOVER,
    { batchSize: 5 }, // Process 5 batches concurrently
    async (jobs: PgBoss.Job<UserBatchRolloverPayload>[]) => {
      // Process jobs concurrently within the batch
      await Promise.all(jobs.map(job => processUserBatchRollover(job)));
    }
  );

  console.log('[Rollover Worker] Registered and scheduled');
}

/**
 * Main job handler that checks all timezones and queues rollover batches
 * Runs every minute to catch timezone midnights
 */
async function processTimezoneRolloverCheck(
  job: PgBoss.Job<RolloverCheckPayload>
): Promise<void> {
  const db = getDb();
  const boss = await getPgBoss();
  const now = new Date();

  // Find all unique timezones from users
  const userTimezones = await db
    .selectDistinct({ timezone: users.timezone })
    .from(users)
    .where(isNotNull(users.timezone));

  let timezonesQueued = 0;

  for (const { timezone } of userTimezones) {
    if (!timezone) continue;

    try {
      // Get the current time in this timezone
      const zonedNow = toZonedTime(now, timezone);
      const currentHour = zonedNow.getHours();
      const currentMinute = zonedNow.getMinutes();

      // Check if this is a DST transition day (expand the window)
      const isDSTTransition = checkDSTTransition(timezone, now);
      
      // Normally trigger at midnight (00:00 - 00:01)
      // On DST days, use a wider window (23:00 - 01:00)
      const isMidnightWindow = isDSTTransition
        ? (currentHour === 23 || currentHour === 0 || currentHour === 1) && currentMinute <= 30
        : currentHour === 0 && currentMinute <= 1;

      if (!isMidnightWindow) continue;

      // Format dates in this timezone
      const todayInTz = format(zonedNow, 'yyyy-MM-dd');
      const yesterdayInTz = format(subDays(zonedNow, 1), 'yyyy-MM-dd');

      // Check if we already ran rollover for this timezone today
      const existingLog = await db.query.rolloverLogs.findFirst({
        where: and(
          eq(rolloverLogs.timezone, timezone),
          eq(rolloverLogs.rolloverDate, yesterdayInTz)
        ),
      });

      if (existingLog) {
        // Already processed this timezone for this date
        continue;
      }

      // Get all users in this timezone
      const tzUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.timezone, timezone));

      if (tzUsers.length === 0) continue;

      // Create batches
      const userIds = tzUsers.map(u => u.id);
      const batches = chunkArray(userIds, BATCH_SIZE);

      // Queue batch jobs
      for (let i = 0; i < batches.length; i++) {
        await boss.send(JOBS.USER_BATCH_ROLLOVER, {
          timezone,
          targetDate: todayInTz,
          userIds: batches[i],
          batchNumber: i + 1,
          totalBatches: batches.length,
        } as UserBatchRolloverPayload);
      }

      timezonesQueued++;
      console.log(`[Rollover] Queued ${batches.length} batches for timezone ${timezone} (${tzUsers.length} users)`);
    } catch (error) {
      console.error(`[Rollover] Error processing timezone ${timezone}:`, error);
      // Continue with other timezones
    }
  }

  if (timezonesQueued > 0) {
    console.log(`[Rollover Check] Queued rollover for ${timezonesQueued} timezones`);
  }
}

/**
 * Process a batch of users for task rollover
 * Updates all incomplete tasks scheduled before targetDate to targetDate
 */
async function processUserBatchRollover(
  job: PgBoss.Job<UserBatchRolloverPayload>
): Promise<void> {
  const { timezone, targetDate, userIds, batchNumber, totalBatches } = job.data;
  const db = getDb();
  const startTime = Date.now();

  try {
    // Update all incomplete tasks scheduled before targetDate for these users
    // Move them to targetDate (today in their timezone)
    const result = await db
      .update(tasks)
      .set({
        scheduledDate: targetDate,
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(tasks.userId, userIds),
          lt(tasks.scheduledDate, targetDate),
          isNull(tasks.completedAt),
          isNotNull(tasks.scheduledDate) // Don't touch backlog tasks (null scheduledDate)
        )
      )
      .returning({ id: tasks.id });

    const tasksRolledOver = result.length;
    const durationMs = Date.now() - startTime;

    // Calculate the rollover date (yesterday in the timezone)
    const rolloverFromDate = format(subDays(new Date(targetDate + 'T00:00:00'), 1), 'yyyy-MM-dd');

    // Log the rollover (use upsert to accumulate counts across batches)
    await db.insert(rolloverLogs).values({
      timezone,
      rolloverDate: rolloverFromDate,
      usersProcessed: userIds.length,
      tasksRolledOver,
      durationMs,
      status: 'completed',
    }).onConflictDoUpdate({
      target: [rolloverLogs.timezone, rolloverLogs.rolloverDate],
      set: {
        usersProcessed: sql`${rolloverLogs.usersProcessed} + ${userIds.length}`,
        tasksRolledOver: sql`${rolloverLogs.tasksRolledOver} + ${tasksRolledOver}`,
        durationMs: sql`${rolloverLogs.durationMs} + ${durationMs}`,
      },
    });

    console.log(
      `[Rollover] Batch ${batchNumber}/${totalBatches}: Rolled ${tasksRolledOver} tasks for ${userIds.length} users in ${timezone} (${durationMs}ms)`
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(`[Rollover] Batch ${batchNumber}/${totalBatches} failed for ${timezone}:`, error);

    // Log the failure
    const rolloverFromDate = format(subDays(new Date(targetDate + 'T00:00:00'), 1), 'yyyy-MM-dd');
    try {
      await db.insert(rolloverLogs).values({
        timezone,
        rolloverDate: rolloverFromDate,
        usersProcessed: 0,
        tasksRolledOver: 0,
        durationMs,
        status: 'failed',
        errorMessage,
      }).onConflictDoUpdate({
        target: [rolloverLogs.timezone, rolloverLogs.rolloverDate],
        set: {
          status: 'partial',
          errorMessage: sql`COALESCE(${rolloverLogs.errorMessage}, '') || '; Batch ${batchNumber} failed: ' || ${errorMessage}`,
        },
      });
    } catch (logError) {
      console.error('[Rollover] Failed to log error:', logError);
    }

    throw error; // PG Boss will retry
  }
}

/**
 * Check if a timezone is in a DST transition on the given date
 * Returns true if the UTC offset differs between adjacent days
 */
function checkDSTTransition(timezone: string, date: Date): boolean {
  try {
    const yesterday = subDays(date, 1);
    const tomorrow = addDays(date, 1);

    // Get timezone offsets for each day
    const getOffset = (d: Date): number => {
      const zonedDate = toZonedTime(d, timezone);
      return zonedDate.getTimezoneOffset();
    };

    const offsetYesterday = getOffset(yesterday);
    const offsetNow = getOffset(date);
    const offsetTomorrow = getOffset(tomorrow);

    return offsetNow !== offsetYesterday || offsetNow !== offsetTomorrow;
  } catch {
    // If timezone is invalid, don't treat as DST transition
    return false;
  }
}

/**
 * Split an array into chunks of specified size
 */
function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
