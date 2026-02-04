/**
 * Timezone check handler for recurring tasks
 * Runs every minute to detect series that need new instances generated
 */
import type PgBoss from "pg-boss";
import { getDb, eq, and, lt, lte, isNull, sql } from "@open-sunsama/database";
import { taskSeries, tasks, users } from "@open-sunsama/database/schema";
import { toZonedTime } from "date-fns-tz";
import {
  format,
  addDays,
  addWeeks,
  addMonths,
  addYears,
  setDate,
  getDay,
  parseISO,
  isAfter,
  isBefore,
  isEqual,
  startOfDay,
} from "date-fns";
import { getPgBoss, JOBS } from "../../lib/pgboss.js";
import type {
  RecurringCheckPayload,
  GenerateRecurringTaskPayload,
} from "./utils.js";

/**
 * Calculate the next occurrence date based on recurrence pattern
 */
function calculateNextOccurrence(
  fromDateStr: string,
  series: {
    recurrenceType: string;
    frequency: number;
    daysOfWeek: number[] | null;
    dayOfMonth: number | null;
    weekOfMonth: number | null;
    dayOfWeekMonthly: number | null;
  }
): Date {
  const fromDate = parseISO(fromDateStr);
  const {
    recurrenceType,
    frequency,
    daysOfWeek,
    dayOfMonth,
    weekOfMonth,
    dayOfWeekMonthly,
  } = series;

  switch (recurrenceType) {
    case "daily":
      return addDays(fromDate, frequency);

    case "weekdays": {
      let nextDate = addDays(fromDate, 1);
      // Skip weekends
      while (getDay(nextDate) === 0 || getDay(nextDate) === 6) {
        nextDate = addDays(nextDate, 1);
      }
      return nextDate;
    }

    case "weekly": {
      if (daysOfWeek && daysOfWeek.length > 0) {
        const currentDow = getDay(fromDate);
        const sortedDays = [...daysOfWeek].sort((a, b) => a - b);

        // Look for next day this week
        const nextDayThisWeek = sortedDays.find((d) => d > currentDow);
        if (nextDayThisWeek !== undefined) {
          return addDays(fromDate, nextDayThisWeek - currentDow);
        }

        // Go to next week (or N weeks based on frequency) and get first day
        const firstDay = sortedDays[0] ?? 0;
        const daysUntilNextWeek = 7 - currentDow + firstDay;
        const weeksToAdd = frequency - 1;
        return addDays(fromDate, daysUntilNextWeek + weeksToAdd * 7);
      }
      return addWeeks(fromDate, frequency);
    }

    case "monthly_date": {
      if (dayOfMonth) {
        let nextDate = addMonths(fromDate, frequency);
        // Set the day of month, handling months with fewer days
        const maxDays = new Date(
          nextDate.getFullYear(),
          nextDate.getMonth() + 1,
          0
        ).getDate();
        nextDate = setDate(nextDate, Math.min(dayOfMonth, maxDays));
        return nextDate;
      }
      return addMonths(fromDate, frequency);
    }

    case "monthly_weekday": {
      if (weekOfMonth && dayOfWeekMonthly !== null) {
        let nextDate = addMonths(fromDate, frequency);
        nextDate = getNthWeekdayOfMonth(
          nextDate,
          weekOfMonth,
          dayOfWeekMonthly
        );
        return nextDate;
      }
      return addMonths(fromDate, frequency);
    }

    case "yearly":
      return addYears(fromDate, frequency);

    default:
      return addDays(fromDate, 1);
  }
}

/**
 * Get the Nth weekday of a given month
 */
function getNthWeekdayOfMonth(
  date: Date,
  weekOfMonth: number,
  dayOfWeek: number
): Date {
  const year = date.getFullYear();
  const month = date.getMonth();

  if (weekOfMonth === 5) {
    // "Last" occurrence - start from end of month
    const lastDay = new Date(year, month + 1, 0);
    let current = lastDay;
    while (getDay(current) !== dayOfWeek) {
      current = addDays(current, -1);
    }
    return current;
  }

  // Find first occurrence of the weekday
  let first = new Date(year, month, 1);
  while (getDay(first) !== dayOfWeek) {
    first = addDays(first, 1);
  }

  // Add weeks to get to Nth occurrence
  return addDays(first, (weekOfMonth - 1) * 7);
}

/**
 * Main job handler that checks for series needing new instances
 * Runs every minute to catch timezone-based generation
 */
export async function processRecurringTaskCheck(
  job: PgBoss.Job<RecurringCheckPayload>
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

      // Calculate next occurrence from last generated date
      const lastGeneratedStr = series.lastGeneratedDate || series.startDate;
      const nextOccurrence = calculateNextOccurrence(lastGeneratedStr, series);
      const nextOccurrenceStr = format(nextOccurrence, "yyyy-MM-dd");

      // Check if we should generate a task for today or past dates
      if (
        isBefore(nextOccurrence, today) ||
        isEqual(startOfDay(nextOccurrence), startOfDay(today))
      ) {
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
