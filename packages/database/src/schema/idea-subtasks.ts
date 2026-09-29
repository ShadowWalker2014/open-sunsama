import {
  pgTable,
  uuid,
  varchar,
  boolean,
  integer,
  timestamp,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { ideas } from "./ideas";

/** Checklist items under an idea card — mirrors the task `subtasks` table. */
export const ideaSubtasks = pgTable(
  "idea_subtasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    ideaId: uuid("idea_id")
      .notNull()
      .references(() => ideas.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 500 }).notNull(),
    completed: boolean("completed").notNull().default(false),
    position: integer("position").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    ideaIdIdx: index("idea_subtasks_idea_id_idx").on(table.ideaId),
  })
);

export const ideaSubtasksRelations = relations(ideaSubtasks, ({ one }) => ({
  idea: one(ideas, {
    fields: [ideaSubtasks.ideaId],
    references: [ideas.id],
  }),
}));

export const insertIdeaSubtaskSchema = createInsertSchema(ideaSubtasks, {
  title: z.string().min(1, { error: "Title is required" }).max(500),
  completed: z.boolean().optional(),
  position: z.number().int().nonnegative().optional(),
});
export const selectIdeaSubtaskSchema = createSelectSchema(ideaSubtasks);
export const updateIdeaSubtaskSchema = insertIdeaSubtaskSchema
  .partial()
  .omit({ ideaId: true });

export type IdeaSubtask = typeof ideaSubtasks.$inferSelect;
export type NewIdeaSubtask = typeof ideaSubtasks.$inferInsert;
export type UpdateIdeaSubtask = z.infer<typeof updateIdeaSubtaskSchema>;
