/**
 * Utility functions and constants for the rollover worker
 */
import { toZonedTime } from 'date-fns-tz';
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
 * Check if a timezone is in a DST transition on the given date
 * Returns true if the UTC offset differs between adjacent days
 */
export function checkDSTTransition(timezone: string, date: Date): boolean {
  try {
    const yesterday = subDays(date, 1);
    const tomorrow = addDays(date, 1);

    // Get timezone offsets for each day
    const getOffset = (d: Date): number => {
      const zonedDate = toZonedTime(d, timezone);
      return zonedDate.getTimezoneOffset();
    };

    const offsetYesterday = getOffset(yesterday);
    const offsetNow = getOffset(date);
    const offsetTomorrow = getOffset(tomorrow);

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
