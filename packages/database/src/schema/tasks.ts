import { pgTable, uuid, varchar, text, date, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { timeBlocks } from './time-blocks';

export const tasks = pgTable('tasks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 500 }).notNull(),
  notes: text('notes'),
  scheduledDate: date('scheduled_date'),
  estimatedMins: integer('estimated_mins'),
  completedAt: timestamp('completed_at'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  timeBlocks: many(timeBlocks),
}));

// Zod schemas for validation
export const insertTaskSchema = createInsertSchema(tasks, {
  title: z.string().min(1, 'Title is required').max(500),
  notes: z.string().optional(),
  scheduledDate: z.string().optional(),
  estimatedMins: z.number().int().positive().optional(),
  position: z.number().int().nonnegative().optional(),
});

export const selectTaskSchema = createSelectSchema(tasks);

// Partial update schema (all fields optional)
export const updateTaskSchema = insertTaskSchema.partial().omit({ userId: true });

// Type exports
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
