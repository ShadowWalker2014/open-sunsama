import { pgTable, uuid, varchar, boolean, integer, timestamp, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { tasks } from './tasks';

export const subtasks = pgTable(
  'subtasks',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    taskId: uuid('task_id')
      .notNull()
      .references(() => tasks.id, { onDelete: 'cascade' }),
    title: varchar('title', { length: 500 }).notNull(),
    completed: boolean('completed').notNull().default(false),
    position: integer('position').notNull().default(0),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (table) => ({
    // PostgreSQL doesn't auto-create indices for foreign keys. Without
    // this index, every `WHERE task_id = ?` (per-task subtasks fetch) and
    // every `WHERE task_id IN (...)` (subtasks-batch + the new
    // `?includeSubtasks=true` join in /tasks) does a sequential scan over
    // the entire subtasks table.
    taskIdIdx: index('subtasks_task_id_idx').on(table.taskId),
  })
);

export const subtasksRelations = relations(subtasks, ({ one }) => ({
  task: one(tasks, {
    fields: [subtasks.taskId],
    references: [tasks.id],
  }),
}));

// Zod schemas for validation
export const insertSubtaskSchema = createInsertSchema(subtasks, {
  title: z.string().min(1, 'Title is required').max(500),
  completed: z.boolean().optional(),
  position: z.number().int().nonnegative().optional(),
});

export const selectSubtaskSchema = createSelectSchema(subtasks);

// Partial update schema (all fields optional)
export const updateSubtaskSchema = insertSubtaskSchema.partial().omit({ taskId: true });

// Type exports
export type Subtask = typeof subtasks.$inferSelect;
export type NewSubtask = typeof subtasks.$inferInsert;
export type UpdateSubtask = z.infer<typeof updateSubtaskSchema>;
