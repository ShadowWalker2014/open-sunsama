/**
 * Timezone rollover check handler
 * Runs every minute to detect timezones hitting midnight and queue batch jobs
 */
import type PgBoss from 'pg-boss';
import { getDb, eq, and, isNotNull } from '@open-sunsama/database';
import { users, rolloverLogs } from '@open-sunsama/database/schema';
import { toZonedTime } from 'date-fns-tz';
import { format, subDays } from 'date-fns';
import { getPgBoss, JOBS } from '../../lib/pgboss.js';
import { 
  type RolloverCheckPayload, 
  type UserBatchRolloverPayload,
  BATCH_SIZE, 
  checkDSTTransition, 
  chunkArray 
} from './utils.js';

/**
 * Main job handler that checks all timezones and queues rollover batches
 * Runs every minute to catch timezone midnights
 */
export async function processTimezoneRolloverCheck(
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
      
      // Normally trigger at midnight (00:00 - 00:10) - 10 minute window for reliability
      // On DST days, use a wider window (23:00 - 01:30) to catch edge cases
      const isMidnightWindow = isDSTTransition
        ? (currentHour === 23 || currentHour === 0 || currentHour === 1) && currentMinute <= 30
        : currentHour === 0 && currentMinute <= 10;

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
