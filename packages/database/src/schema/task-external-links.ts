import {
  pgTable,
  uuid,
  varchar,
  text,
  jsonb,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { tasks } from "./tasks";
import { integrationAccounts } from "./integration-accounts";

/**
 * What the external object *is*. A task may carry several links of
 * different kinds at once — the external task it came from plus the
 * Gitea pull request that closes it.
 */
/** Providers may use their own object taxonomy, such as a ticket or incident. */
export type ExternalLinkKind = string;

/**
 * `source` — this link created the task and owns its synced fields.
 * At most one per task (enforced by a partial unique index).
 * `reference` — an artifact attached to the task. Display only; it
 * never writes to the task row.
 */
export const EXTERNAL_LINK_ROLES = ["source", "reference"] as const;
export type ExternalLinkRole = (typeof EXTERNAL_LINK_ROLES)[number];

/**
 * `orphaned` means a refresh found the remote object gone (404). The
 * local task is left completely alone — only the chip changes — because
 * by then it carries the user's own notes, scheduling and tracked time.
 */
export const EXTERNAL_LINK_STATUSES = ["active", "orphaned"] as const;
export type ExternalLinkStatus = (typeof EXTERNAL_LINK_STATUSES)[number];

/**
 * Display-only snapshot of remote fields that have no home on the task
 * row. Refreshed whenever the user pulls the task again.
 */
export interface ExternalLinkMeta {
  /** External project or repository, rendered on the card's source chip. */
  containerName?: string | null;
  /** Remote status label, e.g. "in progress". */
  statusName?: string | null;
  /** Remote due date, ISO date string. Display only — never sets scheduledDate. */
  dueDate?: string | null;
}

export const taskExternalLinks = pgTable(
  "task_external_links",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),

    /**
     * Null for manually attached links (paste a Gitea PR URL onto a
     * task with no connected account), and for links left behind when
     * an account is disconnected.
     */
    accountId: uuid("account_id").references(() => integrationAccounts.id, {
      onDelete: "set null",
    }),

    provider: varchar("provider", { length: 32 }).notNull(),
    externalId: varchar("external_id", { length: 255 }).notNull(),
    externalUrl: text("external_url"),

    kind: varchar("kind", { length: 32 }).notNull().default("task"),
    role: varchar("role", { length: 16 }).notNull().default("reference"),
    status: varchar("status", { length: 16 }).notNull().default("active"),

    remoteUpdatedAt: timestamp("remote_updated_at"),

    remoteMeta: jsonb("remote_meta").$type<ExternalLinkMeta>(),

    /** When the user last pulled fresh values from the provider. */
    lastRefreshedAt: timestamp("last_refreshed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    // The idempotent upsert key: one link per remote object per account.
    uniqueIndex("task_external_links_account_external_idx")
      .on(table.accountId, table.provider, table.externalId)
      .where(sql`${table.accountId} IS NOT NULL`),
    // A task has at most one owning source.
    uniqueIndex("task_external_links_single_source_idx")
      .on(table.taskId)
      .where(sql`${table.role} = 'source'`),
    index("task_external_links_task_idx").on(table.taskId),
    index("task_external_links_user_provider_idx").on(
      table.userId,
      table.provider,
      table.status
    ),
  ]
);

export const taskExternalLinksRelations = relations(
  taskExternalLinks,
  ({ one }) => ({
    user: one(users, {
      fields: [taskExternalLinks.userId],
      references: [users.id],
    }),
    task: one(tasks, {
      fields: [taskExternalLinks.taskId],
      references: [tasks.id],
    }),
    account: one(integrationAccounts, {
      fields: [taskExternalLinks.accountId],
      references: [integrationAccounts.id],
    }),
  })
);

export const insertTaskExternalLinkSchema = createInsertSchema(
  taskExternalLinks,
  {
    provider: z.string().min(1).max(32),
    externalId: z.string().min(1).max(255),
    externalUrl: z.string().url().optional(),
    kind: z.string().min(1).max(32).optional(),
    role: z.enum(EXTERNAL_LINK_ROLES).optional(),
    status: z.enum(EXTERNAL_LINK_STATUSES).optional(),
  }
);

export const selectTaskExternalLinkSchema =
  createSelectSchema(taskExternalLinks);

export const updateTaskExternalLinkSchema = insertTaskExternalLinkSchema
  .partial()
  .omit({ userId: true, taskId: true });

export type TaskExternalLink = typeof taskExternalLinks.$inferSelect;
export type NewTaskExternalLink = typeof taskExternalLinks.$inferInsert;
export type UpdateTaskExternalLink = z.infer<
  typeof updateTaskExternalLinkSchema
>;
