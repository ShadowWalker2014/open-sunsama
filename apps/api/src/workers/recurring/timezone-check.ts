/**
 * Timezone check handler for recurring tasks
 * Runs every minute to detect series that need new instances generated
 */
import type PgBoss from "pg-boss";
import { getDb, eq, and, sql } from "@open-sunsama/database";
import { taskSeries, tasks, users } from "@open-sunsama/database/schema";
import { toZonedTime } from "date-fns-tz";
import { format, parseISO, isAfter, isBefore, isEqual } from "date-fns";
import { getPgBoss, JOBS } from "../../lib/pgboss.js";
import {
  findDueOccurrence,
  type RecurringCheckPayload,
  type GenerateRecurringTaskPayload,
} from "./utils.js";

/**
 * Main job handler that checks for series needing new instances
 * Runs every minute to catch timezone-based generation
 */
export async function processRecurringTaskCheck(
  _job: PgBoss.Job<RecurringCheckPayload>
): Promise<void> {
  const db = getDb();
  const boss = await getPgBoss();
  const now = new Date();

  // Find all active series
  const activeSeries = await db
    .select({
      series: taskSeries,
      userTimezone: users.timezone,
    })
    .from(taskSeries)
    .innerJoin(users, eq(taskSeries.userId, users.id))
    .where(eq(taskSeries.isActive, true));

  let seriesProcessed = 0;

  for (const { series, userTimezone } of activeSeries) {
    try {
      const timezone = userTimezone || "UTC";

      // Get current date in user's timezone
      const zonedNow = toZonedTime(now, timezone);
      const todayStr = format(zonedNow, "yyyy-MM-dd");
      const today = parseISO(todayStr);

      // Skip if end date has passed
      if (
        series.endDate &&
        isBefore(today, parseISO(series.endDate)) === false &&
        !isEqual(today, parseISO(series.endDate))
      ) {
        if (isAfter(today, parseISO(series.endDate))) {
          // End date passed, deactivate series
          await db
            .update(taskSeries)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(taskSeries.id, series.id));
          continue;
        }
      }

      const lastGeneratedStr = series.lastGeneratedDate || series.startDate;
      const dueOccurrence = findDueOccurrence(lastGeneratedStr, series, today);

      if (dueOccurrence) {
        const nextOccurrenceStr = format(dueOccurrence, "yyyy-MM-dd");
        // Check if a task already exists for this date
        const existingTask = await db
          .select({ id: tasks.id })
          .from(tasks)
          .where(
            and(
              eq(tasks.seriesId, series.id),
              eq(tasks.scheduledDate, nextOccurrenceStr)
            )
          )
          .limit(1);

        if (existingTask.length === 0) {
          // Get current instance count
          const [countResult] = await db
            .select({ count: sql<number>`count(*)::int` })
            .from(tasks)
            .where(eq(tasks.seriesId, series.id));
          const instanceNumber = (countResult?.count ?? 0) + 1;

          // Queue job to generate the task
          await boss.send(JOBS.GENERATE_RECURRING_TASK, {
            seriesId: series.id,
            targetDate: nextOccurrenceStr,
            instanceNumber,
          } as GenerateRecurringTaskPayload);

          seriesProcessed++;
        }
      }
    } catch (error) {
      console.error(`[Recurring] Error processing series ${series.id}:`, error);
    }
  }

  if (seriesProcessed > 0) {
    console.log(`[Recurring Check] Queued ${seriesProcessed} task generations`);
  }
}
