/**
 * Validation schemas for subtasks routes
 */

import { z } from 'zod';
import { uuidSchema } from '@open-sunsama/utils';

/**
 * Schema for creating a subtask
 */
export const createSubtaskSchema = z.object({
  title: z.string().min(1, { error: 'Title is required' }).max(500),
  position: z.number().int().nonnegative().optional(),
});

/**
 * Schema for updating a subtask
 */
export const updateSubtaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  completed: z.boolean().optional(),
  position: z.number().int().nonnegative().optional(),
  /** Planned minutes, up to a day; null clears it. */
  estimatedMins: z.number().int().min(1).max(1440).nullable().optional(),
  /** Logged minutes, up to a day; null clears it. */
  actualMins: z.number().int().min(0).max(1440).nullable().optional(),
});

/**
 * Schema for reordering subtasks
 */
export const reorderSubtasksSchema = z.object({
  subtaskIds: z.array(uuidSchema).min(1),
});

/**
 * Schema for task ID parameter
 */
export const taskIdParamSchema = z.object({
  taskId: uuidSchema,
});

/**
 * Schema for subtask ID parameter
 */
export const subtaskIdParamSchema = z.object({
  taskId: uuidSchema,
  id: uuidSchema,
});
