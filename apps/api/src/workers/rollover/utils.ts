/**
 * Utility functions and constants for the rollover worker
 */
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { subDays, addDays } from 'date-fns';

// Constants
export const BATCH_SIZE = 100; // Users per batch

// Payload types for job handlers
export interface RolloverCheckPayload {
  // Empty - runs on schedule
}

export interface UserBatchRolloverPayload {
  timezone: string;
  targetDate: string; // YYYY-MM-DD - the "today" date in this timezone
  userIds: string[];
  batchNumber: number;
  totalBatches: number;
}

/**
 * Get UTC offset in minutes for a date in a specific timezone
 * Uses formatInTimeZone to get the actual offset, not server's local offset
 */
function getTimezoneOffsetMinutes(date: Date, timezone: string): number {
  // Format the offset as +HH:mm or -HH:mm
  const offsetStr = formatInTimeZone(date, timezone, 'xxx'); // e.g., "+05:30" or "-08:00"
  const match = offsetStr.match(/([+-])(\d{2}):(\d{2})/);
  if (!match || !match[1] || !match[2] || !match[3]) return 0;
  
  const sign = match[1] === '+' ? 1 : -1;
  const hours = parseInt(match[2], 10);
  const minutes = parseInt(match[3], 10);
  return sign * (hours * 60 + minutes);
}

/**
 * Check if a timezone is in a DST transition on the given date
 * Returns true if the UTC offset differs between adjacent days
 */
export function checkDSTTransition(timezone: string, date: Date): boolean {
  try {
    const yesterday = subDays(date, 1);
    const tomorrow = addDays(date, 1);

    // Get timezone offsets for each day using the correct method
    const offsetYesterday = getTimezoneOffsetMinutes(yesterday, timezone);
    const offsetNow = getTimezoneOffsetMinutes(date, timezone);
    const offsetTomorrow = getTimezoneOffsetMinutes(tomorrow, timezone);

    return offsetNow !== offsetYesterday || offsetNow !== offsetTomorrow;
  } catch {
    // If timezone is invalid, don't treat as DST transition
    return false;
  }
}

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
