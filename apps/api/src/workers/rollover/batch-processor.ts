/**
 * Batch processor for user task rollover
 * Handles updating tasks and creating rollover logs for batches of users
 * Respects user rollover settings (destination and position)
 */
import type PgBoss from 'pg-boss';
import { getDb, and, lt, isNull, isNotNull, inArray, sql, eq } from '@open-sunsama/database';
import { tasks, rolloverLogs, notificationPreferences } from '@open-sunsama/database/schema';
import type { RolloverDestination, RolloverPosition } from '@open-sunsama/database/schema';
import { format, subDays } from 'date-fns';
import { type UserBatchRolloverPayload } from './utils.js';

// Default rollover settings for users without preferences
const DEFAULT_ROLLOVER_DESTINATION: RolloverDestination = 'backlog';
const DEFAULT_ROLLOVER_POSITION: RolloverPosition = 'top';

// Position constants for top/bottom placement
const TOP_POSITION_BASE = -1000000;
const BOTTOM_POSITION_BASE = 1000000;

interface UserRolloverSettings {
  userId: string;
  rolloverDestination: RolloverDestination;
  rolloverPosition: RolloverPosition;
}

/**
 * Fetch rollover settings for a batch of users
 * Returns settings keyed by userId, with defaults for users without preferences
 */
async function getUserRolloverSettings(
  db: ReturnType<typeof getDb>,
  userIds: string[]
): Promise<Map<string, UserRolloverSettings>> {
  const preferences = await db
    .select({
      userId: notificationPreferences.userId,
      rolloverDestination: notificationPreferences.rolloverDestination,
      rolloverPosition: notificationPreferences.rolloverPosition,
    })
    .from(notificationPreferences)
    .where(inArray(notificationPreferences.userId, userIds));

  const settingsMap = new Map<string, UserRolloverSettings>();

  // First, set defaults for all users
  for (const userId of userIds) {
    settingsMap.set(userId, {
      userId,
      rolloverDestination: DEFAULT_ROLLOVER_DESTINATION,
      rolloverPosition: DEFAULT_ROLLOVER_POSITION,
    });
  }

  // Override with actual preferences where they exist
  for (const pref of preferences) {
    settingsMap.set(pref.userId, {
      userId: pref.userId,
      rolloverDestination: pref.rolloverDestination as RolloverDestination,
      rolloverPosition: pref.rolloverPosition as RolloverPosition,
    });
  }

  return settingsMap;
}

/**
 * Group users by their rollover settings for efficient batch updates
 */
function groupUsersBySettings(
  settings: Map<string, UserRolloverSettings>
): Map<string, string[]> {
  const groups = new Map<string, string[]>();

  for (const [userId, userSettings] of settings) {
    const key = `${userSettings.rolloverDestination}:${userSettings.rolloverPosition}`;
    const group = groups.get(key) || [];
    group.push(userId);
    groups.set(key, group);
  }

  return groups;
}

/**
 * Process a batch of users for task rollover
 * Updates all incomplete tasks scheduled before targetDate based on user preferences
 */
export async function processUserBatchRollover(
  job: PgBoss.Job<UserBatchRolloverPayload>
): Promise<void> {
  const { timezone, targetDate, userIds, batchNumber, totalBatches } = job.data;
  const db = getDb();
  const startTime = Date.now();

  try {
    // Fetch user rollover settings
    const userSettings = await getUserRolloverSettings(db, userIds);
    const settingsGroups = groupUsersBySettings(userSettings);

    let totalTasksRolledOver = 0;

    // Process each settings group separately
    for (const [settingsKey, groupUserIds] of settingsGroups) {
      const [destination, position] = settingsKey.split(':') as [RolloverDestination, RolloverPosition];

      // Get tasks that need to be rolled over for this group
      const tasksToRollover = await db
        .select({ id: tasks.id, userId: tasks.userId })
        .from(tasks)
        .where(
          and(
            inArray(tasks.userId, groupUserIds),
            lt(tasks.scheduledDate, targetDate),
            isNull(tasks.completedAt),
            isNotNull(tasks.scheduledDate) // Don't touch backlog tasks (null scheduledDate)
          )
        );

      if (tasksToRollover.length === 0) {
        continue;
      }

      // Group tasks by user for position calculation
      const tasksByUser = new Map<string, string[]>();
      for (const task of tasksToRollover) {
        const userTasks = tasksByUser.get(task.userId) || [];
        userTasks.push(task.id);
        tasksByUser.set(task.userId, userTasks);
      }

      // Determine the scheduled date based on destination
      const newScheduledDate = destination === 'next_day' ? targetDate : null;

      // Update tasks with appropriate position
      for (const [, taskIds] of tasksByUser) {
        // Calculate positions for each task
        for (let i = 0; i < taskIds.length; i++) {
          const taskId = taskIds[i]!;
          const newPosition = position === 'top'
            ? TOP_POSITION_BASE - i  // -1000000, -1000001, -1000002, etc.
            : BOTTOM_POSITION_BASE + i; // 1000000, 1000001, 1000002, etc.

          await db
            .update(tasks)
            .set({
              scheduledDate: newScheduledDate,
              position: newPosition,
              updatedAt: new Date(),
            })
            .where(eq(tasks.id, taskId));
        }
      }

      totalTasksRolledOver += tasksToRollover.length;

      console.log(
        `[Rollover] Batch ${batchNumber}/${totalBatches}: Processed ${tasksToRollover.length} tasks for ${groupUserIds.length} users with settings ${settingsKey}`
      );
    }

    const tasksRolledOver = totalTasksRolledOver;
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
