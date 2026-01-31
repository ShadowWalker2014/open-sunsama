/**
 * Validation schemas for releases routes
 */

import { z } from 'zod';
import { RELEASE_PLATFORMS } from '@open-sunsama/database';

/**
 * Platform schema for releases
 */
export const platformSchema = z.enum(RELEASE_PLATFORMS);

/**
 * Schema for creating a release
 */
export const createReleaseSchema = z.object({
  version: z
    .string()
    .min(1, 'Version is required')
    .regex(/^\d+\.\d+\.\d+/, 'Version must be in semver format (e.g., 1.0.0)'),
  platform: platformSchema,
  downloadUrl: z.string().url('Download URL must be a valid URL'),
  fileSize: z.number().int().positive('File size must be a positive integer'),
  fileName: z.string().min(1, 'File name is required'),
  sha256: z.string().length(64, 'SHA256 must be 64 characters').optional(),
  releaseNotes: z.string().optional(),
});

/**
 * Schema for filtering releases
 */
export const releaseFilterSchema = z.object({
  platform: platformSchema.optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

/**
 * Schema for platform param
 */
export const platformParamSchema = z.object({
  platform: platformSchema,
});
