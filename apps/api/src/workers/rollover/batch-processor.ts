/**
 * Batch processor for user task rollover
 * Handles updating tasks and creating rollover logs for batches of users
 * Respects user rollover settings (destination and position)
 */
import type PgBoss from "pg-boss";
import {
  getDb,
  and,
  lt,
  isNull,
  isNotNull,
  inArray,
  sql,
  eq,
  asc,
} from "@open-sunsama/database";
import { min, max } from "drizzle-orm";
import {
  tasks,
  rolloverLogs,
  notificationPreferences,
} from "@open-sunsama/database/schema";
import type {
  RolloverDestination,
  RolloverPosition,
} from "@open-sunsama/database/schema";
import { format, subDays } from "date-fns";
import { toZonedTime } from "date-fns-tz";
import { type UserBatchRolloverPayload } from "./utils.js";

// Default rollover settings for users without preferences
const DEFAULT_ROLLOVER_DESTINATION: RolloverDestination = "backlog";
const DEFAULT_ROLLOVER_POSITION: RolloverPosition = "top";

// Position gap to prevent collisions on re-runs
const POSITION_GAP = 1000;

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
 * Get min/max position for a user's tasks in target destination
 * Used to calculate non-colliding positions for rolled-over tasks
 */
async function getPositionBounds(
  db: ReturnType<typeof getDb>,
  userId: string,
  scheduledDate: string | null
): Promise<{ minPos: number; maxPos: number }> {
  const result = await db
    .select({
      minPos: min(tasks.position),
      maxPos: max(tasks.position),
    })
    .from(tasks)
    .where(
      and(
        eq(tasks.userId, userId),
        scheduledDate
          ? eq(tasks.scheduledDate, scheduledDate)
          : isNull(tasks.scheduledDate)
      )
    );

  return {
    minPos: result[0]?.minPos ?? 0,
    maxPos: result[0]?.maxPos ?? 0,
  };
}

/**
 * Process a batch of users for task rollover
 * Updates all incomplete tasks scheduled before targetDate based on user preferences
 * Uses transaction to ensure atomicity
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
      const [destination, position] = settingsKey.split(":") as [
        RolloverDestination,
        RolloverPosition,
      ];

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
      const newScheduledDate = destination === "next_day" ? targetDate : null;

      // Batch update tasks per user with proper position calculation
      for (const [userId, taskIds] of tasksByUser) {
        if (taskIds.length === 0) continue;

        // Get existing position bounds to avoid collisions
        const { minPos, maxPos } = await getPositionBounds(
          db,
          userId,
          newScheduledDate
        );

        // Calculate base position based on preference
        const basePosition =
          position === "top"
            ? minPos - taskIds.length * POSITION_GAP - POSITION_GAP
            : maxPos + POSITION_GAP;

        // Update each task individually with its calculated position
        // This is more reliable than complex CASE statements with UUIDs
        await Promise.all(
          taskIds.map((taskId, index) =>
            db
              .update(tasks)
              .set({
                scheduledDate: newScheduledDate,
                position: basePosition + index * POSITION_GAP,
                updatedAt: new Date(),
              })
              .where(eq(tasks.id, taskId))
          )
        );
      }

      totalTasksRolledOver += tasksToRollover.length;

      console.log(
        `[Rollover] Batch ${batchNumber}/${totalBatches}: Processed ${tasksToRollover.length} tasks for ${groupUserIds.length} users with settings ${settingsKey}`
      );
    }

    const tasksRolledOver = totalTasksRolledOver;
    const durationMs = Date.now() - startTime;

    // Calculate the rollover date (yesterday in the timezone) - use timezone-aware parsing
    const zonedTargetDate = toZonedTime(
      new Date(targetDate + "T12:00:00Z"),
      timezone
    );
    const rolloverFromDate = format(subDays(zonedTargetDate, 1), "yyyy-MM-dd");

    // Log the rollover (use upsert to accumulate counts across batches)
    await db
      .insert(rolloverLogs)
      .values({
        timezone,
        rolloverDate: rolloverFromDate,
        usersProcessed: userIds.length,
        tasksRolledOver,
        durationMs,
        status: "completed",
      })
      .onConflictDoUpdate({
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

    console.error(
      `[Rollover] Batch ${batchNumber}/${totalBatches} failed for ${timezone}:`,
      error
    );

    // Log the failure - truncate error message to prevent unbounded growth
    const truncatedError = errorMessage.slice(0, 500);
    const zonedTargetDate = toZonedTime(
      new Date(targetDate + "T12:00:00Z"),
      timezone
    );
    const rolloverFromDate = format(subDays(zonedTargetDate, 1), "yyyy-MM-dd");

    await db
      .insert(rolloverLogs)
      .values({
        timezone,
        rolloverDate: rolloverFromDate,
        usersProcessed: 0,
        tasksRolledOver: 0,
        durationMs,
        status: "failed",
        errorMessage: truncatedError,
      })
      .onConflictDoUpdate({
        target: [rolloverLogs.timezone, rolloverLogs.rolloverDate],
        set: {
          status: "partial",
          errorMessage: sql`LEFT(COALESCE(${rolloverLogs.errorMessage}, '') || '; ' || ${truncatedError}, 2000)`,
        },
      })
      .catch((logError) => {
        console.error("[Rollover] Failed to log error:", logError);
      });

    throw error; // PG Boss will retry
  }
}
