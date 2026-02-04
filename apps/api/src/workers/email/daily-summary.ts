/**
 * Daily summary check handler
 * Runs every minute to detect timezones hitting 6 AM and queue daily summary jobs
 */
import type PgBoss from "pg-boss";
import { getDb, eq, and, isNotNull } from "@open-sunsama/database";
import { users, notificationPreferences } from "@open-sunsama/database/schema";
import { toZonedTime } from "date-fns-tz";
import { format } from "date-fns";
import { getPgBoss, JOBS } from "../../lib/pgboss.js";

// Payload types
export interface DailySummaryCheckPayload {
  // Empty - runs on schedule
}

export interface SendDailySummaryPayload {
  userId: string;
  timezone: string;
  date: string; // YYYY-MM-DD - the "today" date in this timezone
}

/**
 * Main job handler that checks all timezones and queues daily summary emails
 * Runs every minute to catch 6 AM in each timezone
 */
export async function processDailySummaryCheck(
  job: PgBoss.Job<DailySummaryCheckPayload>
): Promise<void> {
  const db = getDb();
  const boss = await getPgBoss();
  const now = new Date();

  // Find all unique timezones from users who have daily summary enabled
  const usersWithSummaryEnabled = await db
    .select({
      userId: users.id,
      timezone: users.timezone,
    })
    .from(users)
    .innerJoin(
      notificationPreferences,
      eq(notificationPreferences.userId, users.id)
    )
    .where(
      and(
        isNotNull(users.timezone),
        eq(notificationPreferences.emailNotificationsEnabled, true),
        eq(notificationPreferences.dailySummaryEnabled, true)
      )
    );

  if (usersWithSummaryEnabled.length === 0) {
    return;
  }

  // Group users by timezone
  const usersByTimezone = new Map<string, string[]>();
  for (const { userId, timezone } of usersWithSummaryEnabled) {
    if (!timezone) continue;
    const existing = usersByTimezone.get(timezone) || [];
    existing.push(userId);
    usersByTimezone.set(timezone, existing);
  }

  let usersQueued = 0;

  for (const [timezone, userIds] of usersByTimezone) {
    try {
      // Get the current time in this timezone
      const zonedNow = toZonedTime(now, timezone);
      const currentHour = zonedNow.getHours();
      const currentMinute = zonedNow.getMinutes();

      // Trigger at 6 AM (06:00 - 06:10) - 10 minute window for reliability
      const is6AMWindow = currentHour === 6 && currentMinute <= 10;

      if (!is6AMWindow) continue;

      // Format today's date in this timezone
      const todayInTz = format(zonedNow, "yyyy-MM-dd");

      // Queue individual summary jobs for each user
      // Using singletonKey to prevent duplicate sends for the same user/date
      for (const userId of userIds) {
        await boss.send(
          JOBS.SEND_DAILY_SUMMARY,
          {
            userId,
            timezone,
            date: todayInTz,
          } as SendDailySummaryPayload,
          {
            singletonKey: `daily-summary-${userId}-${todayInTz}`,
            // Prevent duplicate emails for 24 hours - ensures only one email per user per day
            // Without this, singletonKey only checks 'created'/'active' jobs, not 'completed'
            singletonSeconds: 86400,
            retryLimit: 3,
          }
        );
        usersQueued++;
      }

      console.log(
        `[Daily Summary] Queued ${userIds.length} emails for timezone ${timezone}`
      );
    } catch (error) {
      console.error(
        `[Daily Summary] Error processing timezone ${timezone}:`,
        error
      );
      // Continue with other timezones
    }
  }

  if (usersQueued > 0) {
    console.log(
      `[Daily Summary Check] Queued ${usersQueued} daily summary emails`
    );
  }
}
