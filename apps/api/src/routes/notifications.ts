/**
 * Notification preferences routes for Open Sunsama API
 * Handles getting and updating notification settings
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb, eq, notificationPreferences } from '@open-sunsama/database';
import type { NotificationPreferences, UpdateNotificationPreferencesInput, RolloverDestination, RolloverPosition } from '@open-sunsama/types';
import { InternalError, AuthenticationError } from '@open-sunsama/utils';
import { auth, type AuthVariables } from '../middleware/auth.js';

/**
 * Check if an error is a PostgreSQL error with a specific code
 */
function isPgError(error: unknown, code: string): boolean {
  return error instanceof Error && 'code' in error && (error as { code: string }).code === code;
}

const notificationsRouter = new Hono<{ Variables: AuthVariables }>();

// All routes require authentication
notificationsRouter.use('*', auth);

// Validation schema for updating notification preferences
const updatePreferencesSchema = z.object({
  taskRemindersEnabled: z.boolean().optional(),
  reminderTiming: z.number().int().min(5).max(120).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  dailySummaryEnabled: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional(),
  rolloverDestination: z.enum(['next_day', 'backlog']).optional(),
  rolloverPosition: z.enum(['top', 'bottom']).optional(),
});

/**
 * Format notification preferences for API response
 */
function formatPreferences(prefs: typeof notificationPreferences.$inferSelect): NotificationPreferences {
  return {
    id: prefs.id,
    userId: prefs.userId,
    taskRemindersEnabled: prefs.taskRemindersEnabled,
    reminderTiming: prefs.reminderTiming,
    emailNotificationsEnabled: prefs.emailNotificationsEnabled,
    dailySummaryEnabled: prefs.dailySummaryEnabled,
    pushNotificationsEnabled: prefs.pushNotificationsEnabled,
    rolloverDestination: prefs.rolloverDestination as RolloverDestination,
    rolloverPosition: prefs.rolloverPosition as RolloverPosition,
    createdAt: prefs.createdAt,
    updatedAt: prefs.updatedAt,
  };
}

/**
 * Get default notification preferences
 */
function getDefaultPreferences(userId: string): Omit<NotificationPreferences, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    userId,
    taskRemindersEnabled: true,
    reminderTiming: 15,
    emailNotificationsEnabled: false,
    dailySummaryEnabled: false,
    pushNotificationsEnabled: false,
    rolloverDestination: 'backlog',
    rolloverPosition: 'top',
  };
}

/**
 * GET /notifications/preferences
 * Get the current user's notification preferences
 * Creates default preferences lazily on first access
 */
notificationsRouter.get('/preferences', async (c) => {
  const userId = c.get('userId');
  const db = getDb();

  // Try to find existing preferences
  const [existingPrefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (existingPrefs) {
    return c.json({
      success: true,
      data: formatPreferences(existingPrefs),
    });
  }

  // Create default preferences lazily on first access
  // This ensures we always return a valid record with a real ID
  const defaults = getDefaultPreferences(userId);
  
  // Handle potential database errors
  let createdPrefs;
  try {
    [createdPrefs] = await db
      .insert(notificationPreferences)
      .values(defaults)
      .returning();
  } catch (error) {
    // Handle unique constraint violation (race condition - another request created it)
    // PostgreSQL error code 23505 = unique_violation
    if (isPgError(error, '23505')) {
      const [existingPrefs] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);
      
      if (existingPrefs) {
        return c.json({
          success: true,
          data: formatPreferences(existingPrefs),
        });
      }
    }
    
    // Handle foreign key violation (user doesn't exist in users table)
    // PostgreSQL error code 23503 = foreign_key_violation
    if (isPgError(error, '23503')) {
      throw new AuthenticationError('User account not found. Please log out and log in again.');
    }
    
    // Re-throw other errors
    throw error;
  }

  if (!createdPrefs) {
    throw new InternalError('Failed to create default notification preferences');
  }

  return c.json({
    success: true,
    data: formatPreferences(createdPrefs),
  });
});

/**
 * PUT /notifications/preferences
 * Update the current user's notification preferences
 */
notificationsRouter.put('/preferences', zValidator('json', updatePreferencesSchema), async (c) => {
  const userId = c.get('userId');
  const updates = c.req.valid('json') as UpdateNotificationPreferencesInput;
  const db = getDb();

  // Try to find existing preferences
  const [existingPrefs] = await db
    .select()
    .from(notificationPreferences)
    .where(eq(notificationPreferences.userId, userId))
    .limit(1);

  if (existingPrefs) {
    // Update existing preferences
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (updates.taskRemindersEnabled !== undefined) {
      updateData.taskRemindersEnabled = updates.taskRemindersEnabled;
    }
    if (updates.reminderTiming !== undefined) {
      updateData.reminderTiming = updates.reminderTiming;
    }
    if (updates.emailNotificationsEnabled !== undefined) {
      updateData.emailNotificationsEnabled = updates.emailNotificationsEnabled;
    }
    if (updates.dailySummaryEnabled !== undefined) {
      updateData.dailySummaryEnabled = updates.dailySummaryEnabled;
    }
    if (updates.pushNotificationsEnabled !== undefined) {
      updateData.pushNotificationsEnabled = updates.pushNotificationsEnabled;
    }
    if (updates.rolloverDestination !== undefined) {
      updateData.rolloverDestination = updates.rolloverDestination;
    }
    if (updates.rolloverPosition !== undefined) {
      updateData.rolloverPosition = updates.rolloverPosition;
    }

    const [updatedPrefs] = await db
      .update(notificationPreferences)
      .set(updateData)
      .where(eq(notificationPreferences.userId, userId))
      .returning();

    if (!updatedPrefs) {
      throw new InternalError('Failed to update notification preferences');
    }

    return c.json({
      success: true,
      data: formatPreferences(updatedPrefs),
    });
  }

  // Create new preferences if none exist
  const defaults = getDefaultPreferences(userId);
  const newPrefs = {
    ...defaults,
    ...updates,
  };

  let createdPrefs;
  try {
    [createdPrefs] = await db
      .insert(notificationPreferences)
      .values(newPrefs)
      .returning();
  } catch (error) {
    // Handle unique constraint violation (race condition - another request created it)
    if (isPgError(error, '23505')) {
      // Fetch the existing preferences and update them instead
      const [existingPrefs] = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, userId))
        .limit(1);
      
      if (existingPrefs) {
        const [updatedPrefs] = await db
          .update(notificationPreferences)
          .set({ ...updates, updatedAt: new Date() })
          .where(eq(notificationPreferences.userId, userId))
          .returning();
        
        if (updatedPrefs) {
          return c.json({
            success: true,
            data: formatPreferences(updatedPrefs),
          });
        }
      }
    }
    
    // Handle foreign key violation (user doesn't exist)
    if (isPgError(error, '23503')) {
      throw new AuthenticationError('User account not found. Please log out and log in again.');
    }
    
    throw error;
  }

  if (!createdPrefs) {
    throw new InternalError('Failed to create notification preferences');
  }

  return c.json({
    success: true,
    data: formatPreferences(createdPrefs),
  }, 201);
});

export { notificationsRouter };
