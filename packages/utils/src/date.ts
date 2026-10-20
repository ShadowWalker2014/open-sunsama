/**
 * Date utilities using date-fns
 */

import {
  addDays as addDaysDate,
  format,
  parse,
  isToday as dfIsToday,
  isSameDay as dfIsSameDay,
  addDays,
  addMinutes as dfAddMinutes,
  eachDayOfInterval,
  startOfDay,
  setHours,
  setMinutes,
} from 'date-fns';

import { DATE_FORMAT, TIME_FORMAT } from './constants.js';

/**
 * Format a date as YYYY-MM-DD
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date): string {
  return format(date, DATE_FORMAT);
}

/**
 * Parse a date string in YYYY-MM-DD format
 * @param dateStr - The date string to parse
 * @returns Parsed Date object
 * @throws Error if the date string is invalid
 */
export function parseDate(dateStr: string): Date {
  const parsed = parse(dateStr, DATE_FORMAT, new Date());
  if (isNaN(parsed.getTime())) {
    throw new Error(`Invalid date string: ${dateStr}`);
  }
  return parsed;
}

/**
 * Get an array of dates centered around a given date
 * @param centerDate - The center date
 * @param daysBack - Number of days before center date
 * @param daysForward - Number of days after center date
 * @returns Array of dates in the range
 */
export function getDateRange(centerDate: Date, daysBack: number, daysForward: number): Date[] {
  const start = addDays(startOfDay(centerDate), -daysBack);
  const end = addDays(startOfDay(centerDate), daysForward);
  
  return eachDayOfInterval({ start, end });
}

/**
 * Check if a date is today
 * @param date - The date to check
 * @returns True if the date is today
 */
export function isToday(date: Date): boolean {
  return dfIsToday(date);
}

/**
 * Check if two dates are the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if both dates are the same day
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return dfIsSameDay(date1, date2);
}

/**
 * Get all dates between two dates (inclusive)
 * @param start - Start date
 * @param end - End date
 * @returns Array of dates between start and end
 */
export function getDaysBetween(start: Date, end: Date): Date[] {
  return eachDayOfInterval({
    start: startOfDay(start),
    end: startOfDay(end),
  });
}

/**
 * Format a date's time as HH:mm
 * @param date - The date to format
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  return format(date, TIME_FORMAT);
}

/**
 * Parse a time string and apply it to a given date
 * @param timeStr - The time string in HH:mm format
 * @param date - The date to apply the time to
 * @returns Date object with the specified time
 * @throws Error if the time string is invalid
 */
export function parseTime(timeStr: string, date: Date): Date {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  const match = timeStr.match(timeRegex);
  
  if (!match) {
    throw new Error(`Invalid time string: ${timeStr}`);
  }
  
  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  
  return setMinutes(setHours(date, hours), minutes);
}

/**
 * Add minutes to a date
 * @param date - The date to add minutes to
 * @param minutes - Number of minutes to add (can be negative)
 * @returns New date with minutes added
 */
export function addMinutes(date: Date, minutes: number): Date {
  return dfAddMinutes(date, minutes);
}

/**
 * Get the start of day for a given date
 * @param date - The date
 * @returns Date object set to start of day
 */
export function getStartOfDay(date: Date): Date {
  return startOfDay(date);
}

/**
 * Create a date from a date string and time string
 * @param dateStr - Date string in YYYY-MM-DD format
 * @param timeStr - Time string in HH:mm format
 * @returns Combined Date object
 */
export function createDateTime(dateStr: string, timeStr: string): Date {
  const date = parseDate(dateStr);
  return parseTime(timeStr, date);
}

export interface ParsedTaskSchedule {
  title: string;
  scheduledDate?: string;
  time?: string;
}

const WEEKDAYS: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/** Extract simple natural-language scheduling cues from a task title. */
export function parseTaskSchedule(
  title: string,
  referenceDate = new Date()
): ParsedTaskSchedule {
  let remaining = title;
  let scheduledDate: Date | undefined;

  const relativeMatch = /\b(?:for\s+)?(today|tomorrow)\b/i.exec(remaining);
  if (relativeMatch) {
    scheduledDate = startOfDay(referenceDate);
    if (relativeMatch[1]!.toLowerCase() === 'tomorrow') {
      scheduledDate = addDaysDate(scheduledDate, 1);
    }
    remaining = remaining.replace(relativeMatch[0], ' ');
  } else {
    const weekdayMatch = /\b(?:(next)\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b/i.exec(remaining);
    if (weekdayMatch) {
      const targetDay = WEEKDAYS[weekdayMatch[2]!.toLowerCase()]!;
      let offset = (targetDay - referenceDate.getDay() + 7) % 7;
      if (offset === 0) offset = 7;
      scheduledDate = startOfDay(addDaysDate(referenceDate, offset));
      remaining = remaining.replace(weekdayMatch[0], ' ');
    }
  }

  const timeMatch = /\bat\s+(?:(2[0-3]|[01]?\d):([0-5]\d)|(1[0-2]|0?[1-9])(?::([0-5]\d))?\s*(am|pm)?)(?!\w)/i.exec(remaining);
  let time: string | undefined;
  if (timeMatch) {
    let hours: number;
    let minutes = 0;
    if (timeMatch[1] !== undefined) {
      hours = Number(timeMatch[1]);
      minutes = Number(timeMatch[2]);
    } else {
      hours = Number(timeMatch[3]);
      minutes = Number(timeMatch[4] ?? 0);
      const meridiem = timeMatch[5]?.toLowerCase();
      if (meridiem === 'pm' && hours !== 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;
    }
    time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    remaining = remaining.replace(timeMatch[0], ' ');
  }

  return {
    title: remaining.replace(/\s+/g, ' ').trim() || title.trim(),
    ...(scheduledDate ? { scheduledDate: formatDate(scheduledDate) } : {}),
    ...(time ? { time } : {}),
  };
}
