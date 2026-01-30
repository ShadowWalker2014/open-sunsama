import { pgTable, uuid, varchar, text, timestamp, boolean, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { calendars } from './calendars';

// Event status types
export const EVENT_STATUS_OPTIONS = ['confirmed', 'tentative', 'cancelled'] as const;
export type EventStatus = (typeof EVENT_STATUS_OPTIONS)[number];

// Response status types
export const RESPONSE_STATUS_OPTIONS = ['accepted', 'declined', 'tentative', 'needsAction'] as const;
export type ResponseStatus = (typeof RESPONSE_STATUS_OPTIONS)[number];

export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  calendarId: uuid('calendar_id')
    .notNull()
    .references(() => calendars.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),

  externalId: varchar('external_id', { length: 500 }).notNull(), // Provider's event ID
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 500 }),

  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  isAllDay: boolean('is_all_day').notNull().default(false),
  timezone: varchar('timezone', { length: 50 }),

  // Recurrence
  recurrenceRule: varchar('recurrence_rule', { length: 500 }), // RRULE string
  recurringEventId: varchar('recurring_event_id', { length: 500 }), // Parent event ID

  // Status
  status: varchar('status', { length: 20 }).default('confirmed'), // 'confirmed' | 'tentative' | 'cancelled'
  responseStatus: varchar('response_status', { length: 20 }), // 'accepted' | 'declined' | 'tentative' | 'needsAction'

  // Metadata
  htmlLink: varchar('html_link', { length: 1000 }), // Link to event in provider's UI
  etag: varchar('etag', { length: 255 }), // For change detection

  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('calendar_events_user_time_idx').on(table.userId, table.startTime, table.endTime),
  index('calendar_events_calendar_external_idx').on(table.calendarId, table.externalId),
  index('calendar_events_calendar_idx').on(table.calendarId),
]);

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  user: one(users, {
    fields: [calendarEvents.userId],
    references: [users.id],
  }),
  calendar: one(calendars, {
    fields: [calendarEvents.calendarId],
    references: [calendars.id],
  }),
}));

// Zod schemas for validation
export const insertCalendarEventSchema = createInsertSchema(calendarEvents, {
  externalId: z.string().min(1).max(500),
  title: z.string().min(1, 'Event title is required').max(500),
  description: z.string().optional().nullable(),
  location: z.string().max(500).optional().nullable(),
  startTime: z.date(),
  endTime: z.date(),
  isAllDay: z.boolean().optional(),
  timezone: z.string().max(50).optional().nullable(),
  recurrenceRule: z.string().max(500).optional().nullable(),
  recurringEventId: z.string().max(500).optional().nullable(),
  status: z.enum(EVENT_STATUS_OPTIONS).optional(),
  responseStatus: z.enum(RESPONSE_STATUS_OPTIONS).optional().nullable(),
  htmlLink: z.string().url().max(1000).optional().nullable(),
  etag: z.string().max(255).optional().nullable(),
});

export const selectCalendarEventSchema = createSelectSchema(calendarEvents);

// Partial update schema (all fields optional except userId and calendarId)
export const updateCalendarEventSchema = insertCalendarEventSchema.partial().omit({ userId: true, calendarId: true });

// Type exports
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type NewCalendarEvent = typeof calendarEvents.$inferInsert;
export type UpdateCalendarEvent = z.infer<typeof updateCalendarEventSchema>;
