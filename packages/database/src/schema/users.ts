import { pgTable, uuid, varchar, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

/** User's display preferences for theme and font settings */
export interface UserPreferences {
  themeMode: "light" | "dark" | "system";
  colorTheme: string;
  fontFamily: string;
}

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  avatarUrl: varchar('avatar_url', { length: 500 }),
  timezone: varchar('timezone', { length: 50 }).default('UTC'),
  passwordResetToken: varchar('password_reset_token', { length: 255 }),
  passwordResetExpires: timestamp('password_reset_expires'),
  preferences: jsonb('preferences').$type<UserPreferences>(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ many, one }) => ({
  tasks: many(tasks),
  timeBlocks: many(timeBlocks),
  apiKeys: many(apiKeys),
  notificationPreferences: one(notificationPreferences),
  attachments: many(attachments),
  pushSubscriptions: many(pushSubscriptions),
}));

// Import types for relations (will be defined in their respective files)
import { tasks } from './tasks';
import { timeBlocks } from './time-blocks';
import { apiKeys } from './api-keys';
import { notificationPreferences } from './notification-preferences';
import { attachments } from './attachments';
import { pushSubscriptions } from './push-subscriptions';

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email('Invalid email address'),
  name: z.string().min(1).max(255).optional(),
  timezone: z.string().max(50).optional(),
});

export const selectUserSchema = createSelectSchema(users);

// Type exports
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
