/**
 * Validation schemas for time-blocks routes
 */

import { z } from 'zod';
import { uuidSchema, dateSchema, timeSchema } from '@chronoflow/utils';

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
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * Calculate duration in minutes from start and end times
 */
export function calculateDuration(startTime: string, endTime: string): number {
  return parseTimeToMinutes(endTime) - parseTimeToMinutes(startTime);
}
