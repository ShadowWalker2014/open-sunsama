import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { tasks, TASK_PRIORITIES } from "./tasks";

/**
 * Ideas feature — a Trello-style "someday" space.
 *
 * Hierarchy: idea_boards → idea_columns → ideas. Everything is scoped to a
 * user and ordered with the same contiguous integer `position` strategy used
 * by tasks/subtasks. An idea can be "promoted" into a real task (the planner
 * backlog); `promotedTaskId` records that link so the card can show it.
 */

// ───────────────────────── idea_boards ─────────────────────────
export const ideaBoards = pgTable(
  "idea_boards",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    /** lucide-react icon name, e.g. "Film", "Rocket", "Compass" */
    icon: varchar("icon", { length: 64 }).notNull().default("Lightbulb"),
    /** hex color from the shared COLOR_OPTIONS palette */
    color: varchar("color", { length: 7 }).notNull().default("#6366F1"),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("idea_boards_user_idx").on(table.userId, table.position)]
);

// ───────────────────────── idea_columns ─────────────────────────
export const ideaColumns = pgTable(
  "idea_columns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    boardId: uuid("board_id")
      .notNull()
      .references(() => ideaBoards.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 120 }).notNull(),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("idea_columns_board_idx").on(table.boardId, table.position),
    index("idea_columns_user_idx").on(table.userId),
  ]
);

// ───────────────────────── ideas ─────────────────────────
export const ideas = pgTable(
  "ideas",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    boardId: uuid("board_id")
      .notNull()
      .references(() => ideaBoards.id, { onDelete: "cascade" }),
    columnId: uuid("column_id")
      .notNull()
      .references(() => ideaColumns.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    notes: text("notes"),
    /** rough time estimate in minutes; mirrors tasks.estimatedMins */
    estimatedMins: integer("estimated_mins"),
    /** P0–P3, same scale as tasks.priority */
    priority: varchar("priority", { length: 2 }).notNull().default("P2"),
    position: integer("position").notNull().default(0),
    /** set when the user checks the card off (e.g. "watched"/"done") */
    completedAt: timestamp("completed_at"),
    /**
     * Task created when this idea was promoted to the planner backlog.
     * Null until promoted. On task deletion the link is cleared (set null)
     * so the idea card simply stops showing the "in backlog" marker.
     */
    promotedTaskId: uuid("promoted_task_id").references(() => tasks.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("ideas_column_idx").on(table.columnId, table.position),
    index("ideas_board_idx").on(table.boardId),
    index("ideas_user_idx").on(table.userId),
  ]
);

// ───────────────────────── relations ─────────────────────────
export const ideaBoardsRelations = relations(ideaBoards, ({ one, many }) => ({
  user: one(users, {
    fields: [ideaBoards.userId],
    references: [users.id],
  }),
  columns: many(ideaColumns),
  ideas: many(ideas),
}));

export const ideaColumnsRelations = relations(ideaColumns, ({ one, many }) => ({
  board: one(ideaBoards, {
    fields: [ideaColumns.boardId],
    references: [ideaBoards.id],
  }),
  ideas: many(ideas),
}));

export const ideasRelations = relations(ideas, ({ one }) => ({
  board: one(ideaBoards, {
    fields: [ideas.boardId],
    references: [ideaBoards.id],
  }),
  column: one(ideaColumns, {
    fields: [ideas.columnId],
    references: [ideaColumns.id],
  }),
  promotedTask: one(tasks, {
    fields: [ideas.promotedTaskId],
    references: [tasks.id],
  }),
}));

// ───────────────────────── zod schemas ─────────────────────────
export const insertIdeaBoardSchema = createInsertSchema(ideaBoards, {
  name: z.string().min(1, "Name is required").max(120),
  icon: z.string().max(64).optional(),
  color: z.string().max(7).optional(),
  position: z.number().int().nonnegative().optional(),
});
export const selectIdeaBoardSchema = createSelectSchema(ideaBoards);
export const updateIdeaBoardSchema = insertIdeaBoardSchema
  .partial()
  .omit({ userId: true });

export const insertIdeaColumnSchema = createInsertSchema(ideaColumns, {
  name: z.string().min(1, "Name is required").max(120),
  position: z.number().int().nonnegative().optional(),
});
export const selectIdeaColumnSchema = createSelectSchema(ideaColumns);
export const updateIdeaColumnSchema = insertIdeaColumnSchema
  .partial()
  .omit({ userId: true, boardId: true });

export const insertIdeaSchema = createInsertSchema(ideas, {
  title: z.string().min(1, "Title is required").max(500),
  notes: z.string().optional().nullable(),
  estimatedMins: z.number().int().positive().optional().nullable(),
  priority: z.enum(TASK_PRIORITIES).optional(),
  position: z.number().int().nonnegative().optional(),
});
export const selectIdeaSchema = createSelectSchema(ideas);
export const updateIdeaSchema = insertIdeaSchema
  .partial()
  .omit({ userId: true });

// ───────────────────────── type exports ─────────────────────────
export type IdeaBoard = typeof ideaBoards.$inferSelect;
export type NewIdeaBoard = typeof ideaBoards.$inferInsert;
export type UpdateIdeaBoard = z.infer<typeof updateIdeaBoardSchema>;

export type IdeaColumn = typeof ideaColumns.$inferSelect;
export type NewIdeaColumn = typeof ideaColumns.$inferInsert;
export type UpdateIdeaColumn = z.infer<typeof updateIdeaColumnSchema>;

export type Idea = typeof ideas.$inferSelect;
export type NewIdea = typeof ideas.$inferInsert;
export type UpdateIdea = z.infer<typeof updateIdeaSchema>;
