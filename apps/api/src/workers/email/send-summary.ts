/**
 * Send daily summary email handler
 * Fetches user's tasks and sends the daily summary email
 */
import type PgBoss from 'pg-boss';
import { getDb, eq, and, isNull } from '@open-sunsama/database';
import { users, tasks } from '@open-sunsama/database/schema';
import type { SendDailySummaryPayload } from './daily-summary.js';
import { 
  sendDailySummaryEmail, 
  getThemeHexColor,
  type EmailTaskItem 
} from '../../lib/email/index.js';

/**
 * Process a single user's daily summary email
 */
export async function processSendDailySummary(
  job: PgBoss.Job<SendDailySummaryPayload>
): Promise<void> {
  const { userId, timezone, date } = job.data;
  const db = getDb();
  const startTime = Date.now();

  try {
    // Fetch the user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!user) {
      console.warn(`[Daily Summary] User ${userId} not found, skipping`);
      return;
    }

    // Fetch tasks for today
    const userTasks = await db
      .select({
        title: tasks.title,
        priority: tasks.priority,
        estimatedMins: tasks.estimatedMins,
        completedAt: tasks.completedAt,
      })
      .from(tasks)
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.scheduledDate, date)
        )
      )
      .orderBy(tasks.position);

    // Convert to email task items
    const emailTasks: EmailTaskItem[] = userTasks.map((task) => ({
      title: task.title,
      priority: task.priority as EmailTaskItem['priority'],
      estimatedMins: task.estimatedMins ?? undefined,
      isCompleted: task.completedAt !== null,
    }));

    // Get theme color from user preferences
    const themeColor = getThemeHexColor(user.preferences?.colorTheme);

    // Parse the date string to a Date object
    const taskDate = new Date(date + 'T06:00:00'); // Use 6 AM as reference time

    // Send the email
    await sendDailySummaryEmail({
      email: user.email,
      userName: user.name ?? undefined,
      tasks: emailTasks,
      themeColor,
      date: taskDate,
      timezone,
    });

    const durationMs = Date.now() - startTime;
    console.log(
      `[Daily Summary] Sent email to ${user.email} with ${emailTasks.length} tasks (${durationMs}ms)`
    );
  } catch (error) {
    const durationMs = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    console.error(
      `[Daily Summary] Failed to send email for user ${userId} (${durationMs}ms):`,
      errorMessage
    );

    // Re-throw to trigger PG Boss retry
    throw error;
  }
}
