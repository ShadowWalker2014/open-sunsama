/**
 * Validation schemas for auth routes
 */

import { z } from 'zod';
import { emailSchema, passwordSchema } from '@open-sunsama/utils';

/**
 * Schema for user registration
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(255).optional(),
});

/**
 * Schema for user login
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

/**
 * Schema for user preferences
 */
export const userPreferencesSchema = z.object({
  themeMode: z.enum(["light", "dark", "system"]),
  colorTheme: z.string().min(1).max(50),
  fontFamily: z.string().min(1).max(50),
  workStartHour: z.number().int().min(0).max(23).optional(),
  workEndHour: z.number().int().min(0).max(23).optional(),
});

/**
 * Schema for updating user profile
 */
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional().nullable(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
  timezone: z.string().max(50).optional(),
  preferences: userPreferencesSchema.optional(),
});

/**
 * Schema for changing password
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
});

/**
 * Schema for requesting password reset
 */
export const requestPasswordResetSchema = z.object({
  email: emailSchema,
});

/**
 * Schema for resetting password with token
 */
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  newPassword: passwordSchema,
});
