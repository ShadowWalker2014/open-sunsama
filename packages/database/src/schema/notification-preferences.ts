import { pgTable, uuid, boolean, varchar, timestamp, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';

/**
 * Notification preferences schema
 * Stores user notification settings
 */
export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }).unique(),
  
  // Task reminders settings
  taskRemindersEnabled: boolean('task_reminders_enabled').default(true).notNull(),
  reminderTiming: integer('reminder_timing').default(15).notNull(), // minutes before task
  
  // Email notification settings
  emailNotificationsEnabled: boolean('email_notifications_enabled').default(false).notNull(),
  dailySummaryEnabled: boolean('daily_summary_enabled').default(false).notNull(),
  
  // Browser push notification settings
  pushNotificationsEnabled: boolean('push_notifications_enabled').default(false).notNull(),
  
  // Task rollover settings
  rolloverDestination: varchar('rollover_destination', { length: 20 }).default('backlog').notNull(),
  rolloverPosition: varchar('rollover_position', { length: 20 }).default('top').notNull(),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const notificationPreferencesRelations = relations(notificationPreferences, ({ one }) => ({
  user: one(users, {
    fields: [notificationPreferences.userId],
    references: [users.id],
  }),
}));

// Rollover setting enums
export const rolloverDestinationEnum = z.enum(['next_day', 'backlog']);
export const rolloverPositionEnum = z.enum(['top', 'bottom']);

// Zod schemas for validation
export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences, {
  reminderTiming: z.number().int().min(5).max(120),
  rolloverDestination: rolloverDestinationEnum,
  rolloverPosition: rolloverPositionEnum,
});

export const selectNotificationPreferencesSchema = createSelectSchema(notificationPreferences);

export const updateNotificationPreferencesSchema = z.object({
  taskRemindersEnabled: z.boolean().optional(),
  reminderTiming: z.number().int().min(5).max(120).optional(),
  emailNotificationsEnabled: z.boolean().optional(),
  dailySummaryEnabled: z.boolean().optional(),
  pushNotificationsEnabled: z.boolean().optional(),
  rolloverDestination: rolloverDestinationEnum.optional(),
  rolloverPosition: rolloverPositionEnum.optional(),
});

// Type exports
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type NewNotificationPreferences = typeof notificationPreferences.$inferInsert;
export type UpdateNotificationPreferences = z.infer<typeof updateNotificationPreferencesSchema>;
export type RolloverDestination = z.infer<typeof rolloverDestinationEnum>;
export type RolloverPosition = z.infer<typeof rolloverPositionEnum>;

// Reminder timing options
export const REMINDER_TIMING_OPTIONS = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
] as const;

// Rollover destination options
export const ROLLOVER_DESTINATION_OPTIONS = [
  { value: 'next_day', label: 'Next day' },
  { value: 'backlog', label: 'Backlog' },
] as const;

// Rollover position options
export const ROLLOVER_POSITION_OPTIONS = [
  { value: 'top', label: 'Top of list' },
  { value: 'bottom', label: 'Bottom of list' },
] as const;
