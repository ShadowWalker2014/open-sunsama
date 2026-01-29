/**
 * Zod schemas for validation
 */

import { z } from 'zod';
import {
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  DATE_FORMAT,
  TIME_FORMAT,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TIME_BLOCK_STATUSES,
} from './constants.js';

/**
 * Email validation schema
 */
export const emailSchema = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .max(255, 'Email must be less than 255 characters')
  .email('Invalid email address')
  .toLowerCase();

/**
 * Password validation schema
 * - Minimum 8 characters
 * - Maximum 128 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 */
export const passwordSchema = z
  .string()
  .min(MIN_PASSWORD_LENGTH, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
  .max(MAX_PASSWORD_LENGTH, `Password must be less than ${MAX_PASSWORD_LENGTH} characters`)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * UUID validation schema
 */
export const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Date validation schema (YYYY-MM-DD format)
 */
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, `Date must be in ${DATE_FORMAT} format`)
  .refine(
    (val) => {
      const date = new Date(val);
      return !isNaN(date.getTime());
    },
    { message: 'Invalid date' }
  );

/**
 * Time validation schema (HH:mm format)
 */
export const timeSchema = z
  .string()
  .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, `Time must be in ${TIME_FORMAT} format`);

/**
 * Task priority schema
 */
export const taskPrioritySchema = z.enum(TASK_PRIORITIES);

/**
 * Task status schema
 */
export const taskStatusSchema = z.enum(TASK_STATUSES);

/**
 * Time block status schema
 */
export const timeBlockStatusSchema = z.enum(TIME_BLOCK_STATUSES);

/**
 * Estimated minutes schema
 */
export const estimatedMinsSchema = z
  .number()
  .int('Estimated minutes must be a whole number')
  .min(1, 'Estimated minutes must be at least 1')
  .max(480, 'Estimated minutes cannot exceed 8 hours');

/**
 * Task schema for creating/updating tasks
 */
export const taskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(255, 'Title must be less than 255 characters')
    .trim(),
  description: z
    .string()
    .max(5000, 'Description must be less than 5000 characters')
    .optional()
    .nullable(),
  priority: taskPrioritySchema.default('medium'),
  status: taskStatusSchema.default('pending'),
  dueDate: dateSchema.optional().nullable(),
  estimatedMins: estimatedMinsSchema.optional().nullable(),
  projectId: uuidSchema.optional().nullable(),
  parentTaskId: uuidSchema.optional().nullable(),
  tags: z.array(z.string().max(50)).max(10, 'Maximum 10 tags allowed').optional().default([]),
});

/**
 * Task creation schema (subset of task schema)
 */
export const createTaskSchema = taskSchema.pick({
  title: true,
  description: true,
  priority: true,
  dueDate: true,
  estimatedMins: true,
  projectId: true,
  parentTaskId: true,
  tags: true,
});

/**
 * Task update schema (all fields optional)
 */
export const updateTaskSchema = taskSchema.partial();

/**
 * Time block schema for creating/updating time blocks
 */
export const timeBlockSchema = z
  .object({
    taskId: uuidSchema.optional().nullable(),
    date: dateSchema,
    startTime: timeSchema,
    endTime: timeSchema,
    status: timeBlockStatusSchema.default('scheduled'),
    notes: z
      .string()
      .max(1000, 'Notes must be less than 1000 characters')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Validate that end time is after start time
      const [startHour, startMin] = data.startTime.split(':').map(Number);
      const [endHour, endMin] = data.endTime.split(':').map(Number);
      const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
      const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);
      return endMinutes > startMinutes;
    },
    { message: 'End time must be after start time', path: ['endTime'] }
  );

/**
 * Time block creation schema
 */
export const createTimeBlockSchema = timeBlockSchema;

/**
 * Time block update schema
 */
export const updateTimeBlockSchema = z
  .object({
    taskId: uuidSchema.optional().nullable(),
    date: dateSchema.optional(),
    startTime: timeSchema.optional(),
    endTime: timeSchema.optional(),
    status: timeBlockStatusSchema.optional(),
    notes: z
      .string()
      .max(1000, 'Notes must be less than 1000 characters')
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      // Only validate if both times are provided
      if (data.startTime && data.endTime) {
        const [startHour, startMin] = data.startTime.split(':').map(Number);
        const [endHour, endMin] = data.endTime.split(':').map(Number);
        const startMinutes = (startHour ?? 0) * 60 + (startMin ?? 0);
        const endMinutes = (endHour ?? 0) * 60 + (endMin ?? 0);
        return endMinutes > startMinutes;
      }
      return true;
    },
    { message: 'End time must be after start time', path: ['endTime'] }
  );

/**
 * Pagination schema
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Type exports for the schemas
 */
export type Email = z.infer<typeof emailSchema>;
export type Password = z.infer<typeof passwordSchema>;
export type UUID = z.infer<typeof uuidSchema>;
export type DateString = z.infer<typeof dateSchema>;
export type TimeString = z.infer<typeof timeSchema>;
export type Task = z.infer<typeof taskSchema>;
export type CreateTask = z.infer<typeof createTaskSchema>;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
export type TimeBlock = z.infer<typeof timeBlockSchema>;
export type CreateTimeBlock = z.infer<typeof createTimeBlockSchema>;
export type UpdateTimeBlock = z.infer<typeof updateTimeBlockSchema>;
export type Pagination = z.infer<typeof paginationSchema>;
