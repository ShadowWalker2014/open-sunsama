import { pgTable, uuid, varchar, timestamp, integer, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { tasks } from './tasks';

export const timeBlocks = pgTable('time_blocks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'set null' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: varchar('description', { length: 1000 }),
  date: date('date').notNull(),
  startTime: varchar('start_time', { length: 5 }).notNull(), // HH:MM format
  endTime: varchar('end_time', { length: 5 }).notNull(), // HH:MM format
  durationMins: integer('duration_mins').notNull(),
  color: varchar('color', { length: 7 }).default('#3B82F6'), // Hex color
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const timeBlocksRelations = relations(timeBlocks, ({ one }) => ({
  user: one(users, {
    fields: [timeBlocks.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [timeBlocks.taskId],
    references: [tasks.id],
  }),
}));

// Time format regex (HH:MM in 24-hour format)
const timeFormatRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

// Zod schemas for validation
export const insertTimeBlockSchema = createInsertSchema(timeBlocks, {
  title: z.string().min(1, 'Title is required').max(255),
  description: z.string().max(1000).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  startTime: z.string().regex(timeFormatRegex, 'Invalid time format (HH:MM)'),
  endTime: z.string().regex(timeFormatRegex, 'Invalid time format (HH:MM)'),
  durationMins: z.number().int().positive('Duration must be positive'),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid hex color')
    .optional(),
  position: z.number().int().nonnegative().optional(),
});

export const selectTimeBlockSchema = createSelectSchema(timeBlocks);

// Partial update schema (all fields optional except userId)
export const updateTimeBlockSchema = insertTimeBlockSchema.partial().omit({ userId: true });

// Type exports
export type TimeBlock = typeof timeBlocks.$inferSelect;
export type NewTimeBlock = typeof timeBlocks.$inferInsert;
export type UpdateTimeBlock = z.infer<typeof updateTimeBlockSchema>;
