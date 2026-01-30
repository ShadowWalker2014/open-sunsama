/**
 * Notification preferences routes for Open Sunsama API
 * Handles getting and updating notification settings
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb, eq, notificationPreferences } from '@open-sunsama/database';
import type { NotificationPreferences, UpdateNotificationPreferencesInput, RolloverDestination, RolloverPosition } from '@open-sunsama/types';
import { InternalError } from '@open-sunsama/utils';
import { auth, type AuthVariables } from '../middleware/auth.js';

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
  const [createdPrefs] = await db
    .insert(notificationPreferences)
    .values(defaults)
    .returning();

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

  const [createdPrefs] = await db
    .insert(notificationPreferences)
    .values(newPrefs)
    .returning();

  if (!createdPrefs) {
    throw new Error('Failed to create notification preferences');
  }

  return c.json({
    success: true,
    data: formatPreferences(createdPrefs),
  }, 201);
});

export { notificationsRouter };
