/**
 * Utility types and functions for recurring task generation
 */

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
