/**
 * Task reminder check handler
 * Runs every minute to check for time blocks starting soon and queue reminder emails
 */
import type PgBoss from "pg-boss";
import { getDb, eq, and, gte, lte } from "@open-sunsama/database";
import {
  users,
  timeBlocks,
  notificationPreferences,
} from "@open-sunsama/database/schema";
import { toZonedTime } from "date-fns-tz";
import { format, addMinutes } from "date-fns";
import { getPgBoss, JOBS } from "../../lib/pgboss.js";

// Payload types
export interface TaskReminderCheckPayload {
  // Empty - runs on schedule
}

export interface SendTaskReminderPayload {
  timeBlockId: string;
  userId: string;
}

/**
 * Main job handler that checks for upcoming time blocks and queues reminder emails
 * Runs every minute to catch time blocks within each user's reminder window
 */
export async function processTaskReminderCheck(
  job: PgBoss.Job<TaskReminderCheckPayload>
): Promise<void> {
  const db = getDb();
  const boss = await getPgBoss();
  const now = new Date();

  // Find all users who have task reminders enabled
  // Group by reminderTiming to batch similar timing preferences
  const usersWithReminders = await db
    .select({
      userId: users.id,
      timezone: users.timezone,
      reminderTiming: notificationPreferences.reminderTiming,
    })
    .from(users)
    .innerJoin(
      notificationPreferences,
      eq(notificationPreferences.userId, users.id)
    )
    .where(
      and(
        eq(notificationPreferences.emailNotificationsEnabled, true),
        eq(notificationPreferences.taskRemindersEnabled, true)
      )
    );

  if (usersWithReminders.length === 0) {
    return;
  }

  let remindersQueued = 0;

  // Process each user individually since they may have different reminder timings
  for (const { userId, timezone, reminderTiming } of usersWithReminders) {
    const userTimezone = timezone || "UTC";

    try {
      // Get current time in user's timezone
      const userNow = toZonedTime(now, userTimezone);

      // Calculate the target time window for reminders
      // We want time blocks starting between now + reminderTiming and now + reminderTiming + 1 minute
      const targetTimeStart = addMinutes(userNow, reminderTiming);
      const targetTimeEnd = addMinutes(targetTimeStart, 1);

      const targetStartTimeStr = format(targetTimeStart, "HH:mm");
      const targetEndTimeStr = format(targetTimeEnd, "HH:mm");
      const targetDate = format(targetTimeStart, "yyyy-MM-dd");

      // Query time blocks that start within the target window
      // This catches blocks starting exactly when the reminder should fire
      const upcomingBlocks = await db
        .select({
          id: timeBlocks.id,
          title: timeBlocks.title,
          date: timeBlocks.date,
          startTime: timeBlocks.startTime,
        })
        .from(timeBlocks)
        .where(
          and(
            eq(timeBlocks.userId, userId),
            eq(timeBlocks.date, targetDate),
            gte(timeBlocks.startTime, targetStartTimeStr),
            lte(timeBlocks.startTime, targetEndTimeStr)
          )
        );

      // Queue reminder emails for each upcoming time block
      for (const block of upcomingBlocks) {
        // Use singletonKey to prevent duplicate reminders for the same time block
        // Include the date in the key in case the same block is rescheduled
        await boss.send(
          JOBS.SEND_TASK_REMINDER,
          {
            timeBlockId: block.id,
            userId,
          } as SendTaskReminderPayload,
          {
            singletonKey: `task-reminder-${block.id}-${block.date}`,
            // Prevent duplicate reminders for 24 hours - ensures only one reminder per time block per day
            // Without this, singletonKey only checks 'created'/'active' jobs, not 'completed'
            singletonSeconds: 86400,
            retryLimit: 3,
          }
        );
        remindersQueued++;
      }
    } catch (error) {
      console.error(`[Task Reminder] Error processing user ${userId}:`, error);
      // Continue with other users
    }
  }

  if (remindersQueued > 0) {
    console.log(
      `[Task Reminder Check] Queued ${remindersQueued} reminder emails`
    );
  }
}
