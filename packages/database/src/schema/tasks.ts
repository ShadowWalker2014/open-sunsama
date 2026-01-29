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
  priority: varchar('priority', { length: 2 }).notNull().default('P2'),
  completedAt: timestamp('completed_at'),
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Import subtasks for relations (defined in separate file to avoid circular imports)
// The actual relation is defined in subtasks.ts using the tasks table

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  timeBlocks: many(timeBlocks),
}));

// Priority type
export const TASK_PRIORITIES = ['P0', 'P1', 'P2', 'P3'] as const;
export type TaskPriority = typeof TASK_PRIORITIES[number];

// Zod schemas for validation
export const insertTaskSchema = createInsertSchema(tasks, {
  title: z.string().min(1, 'Title is required').max(500),
  notes: z.string().optional(),
  scheduledDate: z.string().optional(),
  estimatedMins: z.number().int().positive().optional(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  position: z.number().int().nonnegative().optional(),
});

export const selectTaskSchema = createSelectSchema(tasks);

// Partial update schema (all fields optional)
export const updateTaskSchema = insertTaskSchema.partial().omit({ userId: true });

// Type exports
export type Task = typeof tasks.$inferSelect;
export type NewTask = typeof tasks.$inferInsert;
export type UpdateTask = z.infer<typeof updateTaskSchema>;
