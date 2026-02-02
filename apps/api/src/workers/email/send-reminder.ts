/**
 * Send task reminder email handler
 * Fetches time block details and sends the reminder email
 */
import type PgBoss from 'pg-boss';
import { getDb, eq } from '@open-sunsama/database';
import { users, timeBlocks } from '@open-sunsama/database/schema';
import type { SendTaskReminderPayload } from './task-reminder.js';
import { sendTaskReminderEmail, getThemeHexColor } from '../../lib/email/index.js';

/**
 * Format time from HH:mm to a human-readable format (e.g., "9:30 AM")
 * Note: The time stored in the database is already in the user's local timezone,
 * so we just need to parse and format it without any timezone conversion.
 */
function formatTimeForEmail(time: string): string {
  // Parse the HH:mm time string
  const parts = time.split(':');
  const hours = parseInt(parts[0] ?? '0', 10);
  const minutes = parseInt(parts[1] ?? '0', 10);
  
  // Format to 12-hour format with AM/PM
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for midnight, and 13-23 to 1-11
  
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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
    // Note: startTime is already stored in the user's local timezone
    const formattedStartTime = formatTimeForEmail(timeBlock.startTime);

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
