import { pgTable, uuid, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { tasks } from "./tasks";

/**
 * One stretch of time a task's timer ran: from start to stop. Shown on the
 * calendar as "actual" time next to the planned time blocks. The task's
 * `actualMins` stays the running total.
 */
export const workSessions = pgTable(
  "work_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").notNull(),
    endedAt: timestamp("ended_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // The calendar lists a user's sessions by time range.
    userStartedIdx: index("work_sessions_user_started_idx").on(
      table.userId,
      table.startedAt
    ),
  })
);

export const workSessionsRelations = relations(workSessions, ({ one }) => ({
  user: one(users, {
    fields: [workSessions.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [workSessions.taskId],
    references: [tasks.id],
  }),
}));

export type WorkSession = typeof workSessions.$inferSelect;
export type NewWorkSession = typeof workSessions.$inferInsert;
