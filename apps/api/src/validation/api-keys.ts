/**
 * Validation schemas for api-keys routes
 */

import { z } from 'zod';
import { API_KEY_SCOPES } from '@chronoflow/database';

/**
 * Schema for creating an API key
 */
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  scopes: z.array(z.enum(API_KEY_SCOPES)).default(['tasks:read', 'time-blocks:read']),
  expiresAt: z.string().datetime().optional().nullable(),
});

/**
 * Schema for updating an API key
 */
export const updateApiKeySchema = z.object({
  name: z.string().min(1).max(255).optional(),
  scopes: z.array(z.enum(API_KEY_SCOPES)).optional(),
  isActive: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
});
