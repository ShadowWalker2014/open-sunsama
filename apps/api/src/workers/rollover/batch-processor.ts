/**
 * Batch processor for user task rollover
 * Handles updating tasks and creating rollover logs for batches of users
 */
import PgBoss from 'pg-boss';
import { getDb, and, lt, isNull, isNotNull, inArray, sql } from '@open-sunsama/database';
import { tasks, rolloverLogs } from '@open-sunsama/database/schema';
import { format, subDays } from 'date-fns';
import { type UserBatchRolloverPayload } from './utils.js';

/**
 * Process a batch of users for task rollover
 * Updates all incomplete tasks scheduled before targetDate to targetDate
 */
export async function processUserBatchRollover(
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
