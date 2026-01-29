import { pgTable, uuid, varchar, integer, timestamp } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';
import { tasks } from './tasks';

export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  url: varchar('url', { length: 500 }).notNull(),
  filename: varchar('filename', { length: 255 }).notNull(),
  contentType: varchar('content_type', { length: 100 }).notNull(),
  size: integer('size').notNull(),
  s3Key: varchar('s3_key', { length: 500 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const attachmentsRelations = relations(attachments, ({ one }) => ({
  user: one(users, {
    fields: [attachments.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [attachments.taskId],
    references: [tasks.id],
  }),
}));

// Zod schemas for validation
export const insertAttachmentSchema = createInsertSchema(attachments, {
  url: z.string().min(1, 'URL is required').max(500),
  filename: z.string().min(1, 'Filename is required').max(255),
  contentType: z.string().min(1, 'Content type is required').max(100),
  size: z.number().int().positive('Size must be a positive integer'),
  s3Key: z.string().min(1, 'S3 key is required').max(500),
});

export const selectAttachmentSchema = createSelectSchema(attachments);

// Type exports
export type Attachment = typeof attachments.$inferSelect;
export type NewAttachment = typeof attachments.$inferInsert;
