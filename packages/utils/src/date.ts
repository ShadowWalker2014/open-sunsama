/**
 * Date utilities using date-fns
 */

import {
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
