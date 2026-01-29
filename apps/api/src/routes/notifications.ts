/**
 * Notification preferences routes for Open Sunsama API
 * Handles getting and updating notification settings
 */

import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getDb, eq, notificationPreferences } from '@open-sunsama/database';
import type { NotificationPreferences, UpdateNotificationPreferencesInput } from '@open-sunsama/types';
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
  };
}

/**
 * GET /notifications/preferences
 * Get the current user's notification preferences
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

  // Return default preferences if none exist
  // Note: We create the record on first update, not on first read
  const defaults = getDefaultPreferences(userId);
  return c.json({
    success: true,
    data: {
      id: '',
      ...defaults,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as NotificationPreferences,
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

    const [updatedPrefs] = await db
      .update(notificationPreferences)
      .set(updateData)
      .where(eq(notificationPreferences.userId, userId))
      .returning();

    if (!updatedPrefs) {
      throw new Error('Failed to update notification preferences');
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
