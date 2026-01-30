/**
 * Validation schemas for time-blocks routes
 */

import { z } from 'zod';
import { uuidSchema, dateSchema, timeSchema } from '@open-sunsama/utils';

/**
 * Helper function to validate time ordering
 */
function parseTimeToMinutes(time: string): number {
  const [hour, min] = time.split(':').map(Number);
  return (hour ?? 0) * 60 + (min ?? 0);
}

/**
 * Schema for creating a time block
 */
export const createTimeBlockSchema = z.object({
  taskId: uuidSchema.optional().nullable(),
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional().nullable(),
  date: dateSchema,
  startTime: timeSchema,
  endTime: timeSchema,
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional().default('#3B82F6'),
  position: z.number().int().nonnegative().optional(),
}).refine(
  (data) => {
    const startMinutes = parseTimeToMinutes(data.startTime);
    const endMinutes = parseTimeToMinutes(data.endTime);
    return endMinutes > startMinutes;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

/**
 * Schema for updating a time block
 */
export const updateTimeBlockSchema = z.object({
  taskId: uuidSchema.optional().nullable(),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional().nullable(),
  date: dateSchema.optional(),
  startTime: timeSchema.optional(),
  endTime: timeSchema.optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional().nullable(),
  position: z.number().int().nonnegative().optional(),
}).refine(
  (data) => {
    // Only validate if both times are provided
    if (data.startTime && data.endTime) {
      const startMinutes = parseTimeToMinutes(data.startTime);
      const endMinutes = parseTimeToMinutes(data.endTime);
      return endMinutes > startMinutes;
    }
    return true;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

/**
 * Schema for filtering time blocks
 */
export const timeBlockFilterSchema = z.object({
  date: dateSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  taskId: uuidSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

/**
 * Calculate duration in minutes from start and end times
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
}

/**
 * Schema for quick scheduling a task as a time block
 */
export const quickScheduleSchema = z.object({
  taskId: uuidSchema,
  date: dateSchema,
  startTime: timeSchema,
  durationMins: z.number().int().min(5, 'Duration must be at least 5 minutes').max(480, 'Duration cannot exceed 8 hours').optional().default(30),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color').optional(),
});

/**
 * Calculate end time from start time and duration in minutes
 */
export function calculateEndTime(startTime: string, durationMins: number): string {
  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = startMinutes + durationMins;
  const hours = Math.floor(endMinutes / 60) % 24; // Handle overflow past midnight
  const minutes = endMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
}

/**
 * Schema for cascade resize - resize a block and shift subsequent blocks
 */
export const cascadeResizeSchema = z.object({
  startTime: timeSchema,
  endTime: timeSchema,
}).refine(
  (data) => {
    const startMinutes = parseTimeToMinutes(data.startTime);
    const endMinutes = parseTimeToMinutes(data.endTime);
    return endMinutes > startMinutes;
  },
  { message: 'End time must be after start time', path: ['endTime'] }
);

/**
 * Convert time string (HH:MM) to minutes since midnight
 */
export function timeToMinutes(time: string): number {
  return parseTimeToMinutes(time);
}

/**
 * Convert minutes since midnight to time string (HH:MM)
 */
export function minutesToTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}
