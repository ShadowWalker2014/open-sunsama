/**
 * Turns "these days in the user's timezone" into the rows to return from
 * calendar_events.
 *
 * Timed events are real instants, so they are matched against the UTC
 * window covering those local days. All-day events are stored as UTC
 * midnight of their date with an exclusive end date, so they are matched by
 * date instead: comparing them as instants would show a Tokyo user
 * yesterday's all-day event.
 */

import { fromZonedTime } from 'date-fns-tz';

export interface LocalDayWindow {
  /** First local day, YYYY-MM-DD. */
  fromDate: string;
  /** Last local day (inclusive), YYYY-MM-DD. */
  toDate: string;
  timezone: string;
  /** UTC instant of local midnight at the start of `fromDate`. */
  start: Date;
  /** UTC instant of local midnight after `toDate` (exclusive). */
  end: Date;
}

export function addDaysToDate(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

export function localDayWindow(fromDate: string, toDate: string, timezone: string): LocalDayWindow {
  const tz = isValidTimezone(timezone) ? timezone : 'UTC';
  return {
    fromDate,
    toDate,
    timezone: tz,
    start: fromZonedTime(`${fromDate}T00:00:00`, tz),
    end: fromZonedTime(`${addDaysToDate(toDate, 1)}T00:00:00`, tz),
  };
}

export function eventFallsInWindow(
  event: { startTime: Date; endTime: Date; isAllDay: boolean },
  window: LocalDayWindow
): boolean {
  if (event.isAllDay) {
    const startDay = event.startTime.toISOString().slice(0, 10);
    let endDay = event.endTime.toISOString().slice(0, 10);
    if (endDay <= startDay) endDay = addDaysToDate(startDay, 1);
    return startDay <= window.toDate && endDay > window.fromDate;
  }
  // Half-open overlap; a zero-length event counts when it starts inside.
  return (
    event.startTime < window.end &&
    (event.endTime > window.start || event.startTime >= window.start)
  );
}
