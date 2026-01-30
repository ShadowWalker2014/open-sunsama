import { pgTable, uuid, varchar, text, date, integer, timestamp, uniqueIndex } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

/**
 * Rollover logs table - tracks task rollover operations by timezone
 * Used for idempotency and monitoring
 */
export const rolloverLogs = pgTable('rollover_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  timezone: varchar('timezone', { length: 50 }).notNull(),
  rolloverDate: date('rollover_date').notNull(), // The date that was rolled over FROM
  usersProcessed: integer('users_processed').notNull().default(0),
  tasksRolledOver: integer('tasks_rolled_over').notNull().default(0),
  executedAt: timestamp('executed_at').defaultNow().notNull(),
  durationMs: integer('duration_ms'),
  status: varchar('status', { length: 20 }).notNull().default('completed'), // completed, failed, partial
  errorMessage: text('error_message'),
}, (table) => ({
  // Unique constraint to prevent duplicate rollover for same timezone+date
  timezoneIdx: uniqueIndex('rollover_logs_tz_date_idx').on(table.timezone, table.rolloverDate),
}));

// Zod schemas for validation
export const insertRolloverLogSchema = createInsertSchema(rolloverLogs);
export const selectRolloverLogSchema = createSelectSchema(rolloverLogs);

// Type exports
export type RolloverLog = typeof rolloverLogs.$inferSelect;
export type NewRolloverLog = typeof rolloverLogs.$inferInsert;
