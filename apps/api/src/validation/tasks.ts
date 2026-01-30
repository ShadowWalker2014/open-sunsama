/**
 * Validation schemas for tasks routes
 */

import { z } from 'zod';
import { uuidSchema, dateSchema } from '@open-sunsama/utils';

/**
 * Priority levels for tasks
 */
export const prioritySchema = z.enum(['P0', 'P1', 'P2', 'P3']);

/**
 * Sort by options for tasks
 */
export const sortBySchema = z.enum(['priority', 'position', 'createdAt']);

/**
 * Schema for creating a task
 */
export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  notes: z.string().max(5000).optional().nullable(),
  scheduledDate: dateSchema.optional().nullable(),
  estimatedMins: z.number().int().positive().max(480).optional().nullable(),
  priority: prioritySchema.optional(),
  position: z.number().int().nonnegative().optional(),
});

/**
 * Schema for updating a task
 */
export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  notes: z.string().max(5000).optional().nullable(),
  scheduledDate: dateSchema.optional().nullable(),
  estimatedMins: z.number().int().positive().max(480).optional().nullable(),
  priority: prioritySchema.optional(),
  completedAt: z.string().datetime().optional().nullable(),
  position: z.number().int().nonnegative().optional(),
});

/**
 * Schema for filtering tasks
 */
export const taskFilterSchema = z.object({
  date: dateSchema.optional(),
  from: dateSchema.optional(),
  to: dateSchema.optional(),
  completed: z.enum(['true', 'false']).optional(),
  backlog: z.enum(['true', 'false']).optional(),
  priority: prioritySchema.optional(),
  sortBy: sortBySchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(50),
});

/**
 * Schema for reordering tasks
 */
export const reorderTasksSchema = z.object({
  date: z.union([dateSchema, z.literal('backlog')]),
  taskIds: z.array(uuidSchema).min(1),
});
