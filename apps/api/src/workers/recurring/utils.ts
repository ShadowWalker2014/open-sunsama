/**
 * Utility types and functions for recurring task generation
 */
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
} from "date-fns";

export interface RecurrencePattern {
  recurrenceType: string;
  frequency: number;
  daysOfWeek: number[] | null;
  dayOfMonth: number | null;
  weekOfMonth: number | null;
  dayOfWeekMonthly: number | null;
}

/**
 * Payload for timezone-based recurring check job
 */
export interface RecurringCheckPayload {
  /** Timestamp when the check was triggered */
  triggeredAt?: string;
}

/**
 * Payload for generating recurring tasks for a single series
 */
export interface GenerateRecurringTaskPayload {
  /** Task series ID to generate from */
  seriesId: string;
  /** Target date for the new task instance (YYYY-MM-DD) */
  targetDate: string;
  /** Instance number for the new task */
  instanceNumber: number;
}

/**
 * Batch size for processing series
 */
export const BATCH_SIZE = 10;

/**
 * Split an array into chunks of specified size
 */
export function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

/**
 * Calculate the next occurrence date based on recurrence pattern
 */
export function calculateNextOccurrence(
  fromDateStr: string,
  series: RecurrencePattern
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
 * Return today's occurrence if the series has one due, else null.
 *
 * Occurrences before today are skipped rather than generated, so a series
 * that fell behind (worker down, or failing inserts) resumes from today
 * instead of backfilling one stale task per missed day.
 */
export function findDueOccurrence(
  lastGeneratedStr: string,
  series: RecurrencePattern,
  today: Date
): Date | null {
  let next = calculateNextOccurrence(lastGeneratedStr, series);
  while (isBefore(next, today)) {
    const following = calculateNextOccurrence(format(next, "yyyy-MM-dd"), series);
    // Guard against a pattern that doesn't advance (e.g. frequency 0)
    if (!isAfter(following, next)) return null;
    next = following;
  }
  return isEqual(next, today) ? next : null;
}
