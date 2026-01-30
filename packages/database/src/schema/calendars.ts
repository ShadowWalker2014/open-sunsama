import { pgTable, uuid, varchar, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { calendarAccounts } from './calendar-accounts';
import { calendarEvents } from './calendar-events';

export const calendars = pgTable('calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => calendarAccounts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  externalId: varchar('external_id', { length: 500 }).notNull(), // Provider's calendar ID
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }), // Hex color from provider

  isEnabled: boolean('is_enabled').notNull().default(true), // Show on timeline
  isDefaultForEvents: boolean('is_default_for_events').notNull().default(false),
  isDefaultForTasks: boolean('is_default_for_tasks').notNull().default(false),
  isReadOnly: boolean('is_read_only').notNull().default(false), // Provider-level permission

  syncToken: varchar('sync_token', { length: 500 }), // Calendar-level sync token
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('calendars_user_idx').on(table.userId),
  index('calendars_account_idx').on(table.accountId),
  index('calendars_account_external_idx').on(table.accountId, table.externalId),
]);

export const calendarsRelations = relations(calendars, ({ one, many }) => ({
  user: one(users, {
    fields: [calendars.userId],
    references: [users.id],
  }),
  account: one(calendarAccounts, {
    fields: [calendars.accountId],
    references: [calendarAccounts.id],
  }),
  events: many(calendarEvents),
}));

// Hex color regex
const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

// Zod schemas for validation
export const insertCalendarSchema = createInsertSchema(calendars, {
  externalId: z.string().min(1).max(500),
  name: z.string().min(1, 'Calendar name is required').max(255),
  color: z.string().regex(hexColorRegex, 'Invalid hex color').optional().nullable(),
  isEnabled: z.boolean().optional(),
  isDefaultForEvents: z.boolean().optional(),
  isDefaultForTasks: z.boolean().optional(),
  isReadOnly: z.boolean().optional(),
  syncToken: z.string().max(500).optional(),
});

export const selectCalendarSchema = createSelectSchema(calendars);

// Partial update schema (all fields optional except userId and accountId)
export const updateCalendarSchema = insertCalendarSchema.partial().omit({ userId: true, accountId: true });

// Type exports
export type Calendar = typeof calendars.$inferSelect;
export type NewCalendar = typeof calendars.$inferInsert;
export type UpdateCalendar = z.infer<typeof updateCalendarSchema>;
