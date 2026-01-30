import { pgTable, uuid, varchar, timestamp, text, bigint } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';

/**
 * Push subscriptions schema
 * Stores web push notification subscription data for users
 */
export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  // Push subscription data from the browser
  endpoint: text('endpoint').notNull().unique(),
  p256dhKey: text('p256dh_key').notNull(),
  authKey: text('auth_key').notNull(),
  
  // Optional expiration time from the browser
  expirationTime: bigint('expiration_time', { mode: 'number' }),
  
  // User agent info for debugging
  userAgent: varchar('user_agent', { length: 500 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const pushSubscriptionsRelations = relations(pushSubscriptions, ({ one }) => ({
  user: one(users, {
    fields: [pushSubscriptions.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions, {
  endpoint: z.string().url('Invalid endpoint URL'),
  p256dhKey: z.string().min(1, 'p256dh key is required'),
  authKey: z.string().min(1, 'Auth key is required'),
});

export const selectPushSubscriptionSchema = createSelectSchema(pushSubscriptions);

// Type exports
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type NewPushSubscription = typeof pushSubscriptions.$inferInsert;
