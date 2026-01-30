/**
 * Send task reminder email handler
 * Fetches time block details and sends the reminder email
 */
import type PgBoss from 'pg-boss';
import { getDb, eq } from '@open-sunsama/database';
import { users, timeBlocks } from '@open-sunsama/database/schema';
import type { SendTaskReminderPayload } from './task-reminder.js';
import { sendTaskReminderEmail, getThemeHexColor } from '../../lib/email/index.js';
import { toZonedTime } from 'date-fns-tz';
import { format } from 'date-fns';

/**
 * Format time from HH:mm to a human-readable format (e.g., "9:30 AM")
 */
function formatTimeForEmail(time: string, date: string, timezone: string): string {
  // Parse the date and time in the user's timezone
  const dateTimeStr = `${date}T${time}:00`;
  const utcDate = new Date(dateTimeStr);
  
  // Format with the user's timezone context
  const zonedDate = toZonedTime(utcDate, timezone);
  return format(zonedDate, 'h:mm a');
}

/**
 * Process a single task reminder email
 */
export async function processSendTaskReminder(
  job: PgBoss.Job<SendTaskReminderPayload>
): Promise<void> {
  const { timeBlockId, userId } = job.data;
  const db = getDb();
  const startTime = Date.now();

  try {
    // Fetch the user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      console.warn(`[Task Reminder] User ${userId} not found, skipping`);
      return;
    }

    // Fetch the time block with its associated task (if any)
    const timeBlock = await db.query.timeBlocks.findFirst({
      where: eq(timeBlocks.id, timeBlockId),
      with: {
        task: true,
      },
    });

    if (!timeBlock) {
      console.warn(`[Task Reminder] Time block ${timeBlockId} not found, skipping`);
      return;
    }

    // Get the task notes if a task is associated
    const taskNotes = timeBlock.task?.notes ?? timeBlock.description ?? undefined;
    const taskId = timeBlock.taskId ?? undefined;
    
    // Get theme color from user preferences or time block color
    const themeColor = timeBlock.color || getThemeHexColor(user.preferences?.colorTheme);

    // Format the start time for the email
    const userTimezone = user.timezone || 'UTC';
    const formattedStartTime = formatTimeForEmail(
      timeBlock.startTime,
      timeBlock.date,
      userTimezone
    );

    // Send the email
    await sendTaskReminderEmail({
      email: user.email,
      userName: user.name ?? undefined,
      taskTitle: timeBlock.title,
      taskNotes,
      startTime: formattedStartTime,
      themeColor,
      taskId,
    });

    const durationMs = Date.now() - startTime;
    console.log(
      `[Task Reminder] Sent reminder to ${user.email} for "${timeBlock.title}" at ${formattedStartTime} (${durationMs}ms)`
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error(
      `[Task Reminder] Failed to send reminder for time block ${timeBlockId} (${durationMs}ms):`,
      errorMessage
    );

    // Re-throw to trigger PG Boss retry
    throw error;
  }
}
