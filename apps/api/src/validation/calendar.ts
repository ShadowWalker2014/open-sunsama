/**
 * Validation schemas for calendar routes
 */

import { z } from 'zod';
import { uuidSchema, dateSchema } from '@open-sunsama/utils';

/**
 * Calendar provider enum
 */
export const calendarProviderSchema = z.enum(['google', 'outlook', 'icloud']);

/**
 * Schema for OAuth initiate route params
 */
export const oauthInitiateParamsSchema = z.object({
  provider: z.enum(['google', 'outlook']),
});

/**
 * Schema for OAuth callback query params
 */
export const oauthCallbackQuerySchema = z.object({
  code: z.string().min(1, 'Authorization code is required'),
  state: z.string().min(1, 'State parameter is required'),
  error: z.string().optional(),
  error_description: z.string().optional(),
});

/**
 * Schema for CalDAV connect body
 */
export const caldavConnectSchema = z.object({
  email: z.string().email('Invalid email address').max(255),
  appPassword: z.string().min(1, 'App password is required').max(255),
  caldavUrl: z.string().url().max(500).optional(),
});

/**
 * Schema for calendar account ID param
 */
export const calendarAccountIdParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Schema for calendar ID param
 */
export const calendarIdParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Schema for updating calendar settings
 */
export const updateCalendarSettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  isDefaultForEvents: z.boolean().optional(),
  isDefaultForTasks: z.boolean().optional(),
});

/**
 * Schema for calendar events query params
 */
export const calendarEventsQuerySchema = z.object({
  from: z.string().datetime({ offset: true }).or(dateSchema),
  to: z.string().datetime({ offset: true }).or(dateSchema),
  calendarIds: z.string().optional(), // Comma-separated UUIDs
});

/**
 * Parse comma-separated calendar IDs
 */
export function parseCalendarIds(calendarIdsParam?: string): string[] | undefined {
  if (!calendarIdsParam) return undefined;
  return calendarIdsParam.split(',').filter(id => id.trim().length > 0);
}
