import { pgTable, uuid, varchar, text, timestamp, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { calendars } from './calendars';

// Calendar provider types
export const CALENDAR_PROVIDERS = ['google', 'outlook', 'icloud'] as const;
export type CalendarProvider = (typeof CALENDAR_PROVIDERS)[number];

// Sync status types
export const SYNC_STATUS_OPTIONS = ['idle', 'syncing', 'error'] as const;
export type SyncStatus = (typeof SYNC_STATUS_OPTIONS)[number];

export const calendarAccounts = pgTable('calendar_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 20 }).notNull(), // 'google' | 'outlook' | 'icloud'
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),

  // Encrypted OAuth tokens (AES-256-GCM)
  accessTokenEncrypted: text('access_token_encrypted'),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  tokenExpiresAt: timestamp('token_expires_at'),

  // CalDAV credentials (iCloud) - encrypted
  caldavPasswordEncrypted: text('caldav_password_encrypted'),
  caldavUrl: varchar('caldav_url', { length: 500 }),

  // Sync state
  syncToken: varchar('sync_token', { length: 500 }), // For incremental sync
  lastSyncedAt: timestamp('last_synced_at'),
  syncStatus: varchar('sync_status', { length: 20 }).default('idle'), // 'idle' | 'syncing' | 'error'
  syncError: text('sync_error'),

  // Webhook subscription tracking
  webhookSubscriptionId: varchar('webhook_subscription_id', { length: 500 }),
  webhookExpiresAt: timestamp('webhook_expires_at'),

  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const calendarAccountsRelations = relations(calendarAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [calendarAccounts.userId],
    references: [users.id],
  }),
  calendars: many(calendars),
}));

// Zod schemas for validation
export const insertCalendarAccountSchema = createInsertSchema(calendarAccounts, {
  provider: z.enum(CALENDAR_PROVIDERS),
  providerAccountId: z.string().min(1).max(255),
  email: z.string().email('Invalid email address').max(255),
  accessTokenEncrypted: z.string().optional(),
  refreshTokenEncrypted: z.string().optional(),
  tokenExpiresAt: z.date().optional(),
  caldavPasswordEncrypted: z.string().optional(),
  caldavUrl: z.string().url().max(500).optional(),
  syncToken: z.string().max(500).optional(),
  syncStatus: z.enum(SYNC_STATUS_OPTIONS).optional(),
  syncError: z.string().optional(),
  webhookSubscriptionId: z.string().max(500).optional(),
  webhookExpiresAt: z.date().optional(),
  isActive: z.boolean().optional(),
});

export const selectCalendarAccountSchema = createSelectSchema(calendarAccounts);

// Partial update schema (all fields optional except userId)
export const updateCalendarAccountSchema = insertCalendarAccountSchema.partial().omit({ userId: true });

// Type exports
export type CalendarAccount = typeof calendarAccounts.$inferSelect;
export type NewCalendarAccount = typeof calendarAccounts.$inferInsert;
export type UpdateCalendarAccount = z.infer<typeof updateCalendarAccountSchema>;
