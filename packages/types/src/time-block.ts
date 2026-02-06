/**
 * Time block-related type definitions for Open Sunsama
 * @module @open-sunsama/types/time-block
 */

import type { Task } from './task.js';

/**
 * Represents a time block in the Open Sunsama system.
 * Time blocks are scheduled periods of time allocated for specific tasks.
 */
export interface TimeBlock {
  /** Unique identifier for the time block (UUID format) */
  id: string;

  /** ID of the user who owns this time block */
  userId: string;

  /** ID of the task associated with this time block (optional) */
  taskId: string | null;

  /** Title/label for the time block */
  title: string;

  /** 
   * Start time of the time block.
   * Stored as ISO 8601 datetime string in UTC.
   */
  startTime: Date;

  /** 
   * End time of the time block.
   * Stored as ISO 8601 datetime string in UTC.
   */
  endTime: Date;

  /** 
   * Color code for visual distinction (hex format, e.g., "#FF5733").
   * Used in calendar UI for categorization.
   */
  color: string | null;

  /** Additional notes or details about the time block */
  notes: string | null;

  /** Timestamp when the time block was created */
  createdAt: Date;

  /** Timestamp when the time block was last updated */
  updatedAt: Date;
}

/**
 * Input data required to create a new time block.
 */
export interface CreateTimeBlockInput {
  /** ID of the task to associate with this time block (optional) */
  taskId?: string;

  /** Title/label for the time block */
  title: string;

  /** 
   * Start time of the time block.
   * Can be Date object or ISO 8601 string.
   */
  startTime: Date | string;

  /** 
   * End time of the time block.
   * Can be Date object or ISO 8601 string.
   */
  endTime: Date | string;

  /** Color code for visual distinction (hex format) */
  color?: string;

  /** Additional notes or details */
  notes?: string;
}

/**
 * Input data for updating an existing time block.
 * All fields are optional; only provided fields will be updated.
 */
export interface UpdateTimeBlockInput {
  /** Updated associated task ID (use null to disassociate) */
  taskId?: string | null;

  /** Updated title/label */
  title?: string;

  /** Updated start time */
  startTime?: Date | string;

  /** Updated end time */
  endTime?: Date | string;

  /** Updated color code (use null to remove) */
  color?: string | null;

  /** Updated notes (use null to clear) */
  notes?: string | null;
}

/**
 * Filter options for querying time blocks.
 * All fields are optional and combined with AND logic.
 */
export interface TimeBlockFilterInput {
  /** Filter by date (returns all time blocks that overlap with this date) */
  date?: string;

  /** Filter time blocks starting on or after this datetime */
  startTimeFrom?: Date | string;

  /** Filter time blocks starting on or before this datetime */
  startTimeTo?: Date | string;

  /** Filter by associated task ID */
  taskId?: string;

  /** Filter to only unassigned time blocks (no associated task) */
  unassignedOnly?: boolean;
}

/**
 * Time block with its associated task data.
 * Used when displaying time blocks in the calendar view.
 */
export interface TimeBlockWithTask extends TimeBlock {
  /** The associated task data (null if no task is associated) */
  task: Task | null;
}

/**
 * Input for quickly scheduling a task as a time block.
 * Convenience type for drag-and-drop scheduling.
 */
export interface QuickScheduleInput {
  /** ID of the task to schedule */
  taskId: string;

  /** Start time for the time block */
  startTime: Date | string;

  /** 
   * Duration in minutes.
   * If omitted, uses the task's estimated minutes or a default value.
   */
  durationMins?: number;

  /** Color code for the time block */
  color?: string;
}

/**
 * Input for auto-scheduling a task to the next available time slot.
 * The API automatically determines the best time based on existing blocks and working hours.
 */
export interface AutoScheduleInput {
  /** ID of the task to schedule */
  taskId: string;
  /** Current time in HH:mm format - used as earliest start time for scheduling */
  currentTime?: string;
}

/**
 * Summary of time blocks for a specific period.
 * Useful for daily/weekly overviews.
 */
export interface TimeBlockSummary {
  /** Start of the summary period */
  periodStart: Date;

  /** End of the summary period */
  periodEnd: Date;

  /** Total number of time blocks in the period */
  totalBlocks: number;

  /** Total scheduled time in minutes */
  totalMinutes: number;

  /** Number of time blocks with associated tasks */
  blocksWithTasks: number;

  /** Number of unassigned time blocks */
  unassignedBlocks: number;
}

/**
 * Represents a conflict between two overlapping time blocks.
 */
export interface TimeBlockConflict {
  /** First conflicting time block */
  blockA: TimeBlock;

  /** Second conflicting time block */
  blockB: TimeBlock;

  /** Start of the overlapping period */
  overlapStart: Date;

  /** End of the overlapping period */
  overlapEnd: Date;

  /** Duration of overlap in minutes */
  overlapMinutes: number;
}

/**
 * Result of a time block validation check.
 */
export interface TimeBlockValidation {
  /** Whether the time block is valid */
  isValid: boolean;

  /** List of validation errors (empty if valid) */
  errors: string[];

  /** List of conflicting time blocks (if any) */
  conflicts: TimeBlockConflict[];
}
