import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  boolean,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./users";
import { taskExternalLinks } from "./task-external-links";

/**
 * Task-source providers. Calendars have their own accounts table
 * (`calendar_accounts`); this one holds the credential used to fetch a
 * single external task on demand when the user imports one.
 *
 * Nothing polls: there is no sync state here because there is no
 * background sync.
 */
/** Provider ids are owned by the API provider registry, not the database. */
export type IntegrationProvider = string;

export const integrationAccounts = pgTable(
  "integration_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 32 }).notNull(),

    /** The provider's own id for the authenticated user. */
    providerAccountId: varchar("provider_account_id", {
      length: 255,
    }).notNull(),

    /** Human-readable name shown on the settings card (workspace/team name). */
    label: varchar("label", { length: 255 }).notNull(),

    /**
     * AES-256-GCM blob holding a JSON credential object. Shaped per
      * provider (for example `{ token }`), which is what lets a
     * future OAuth strategy drop in beside token auth without a
     * migration. Never leaves the API — routes return `hasCredentials`.
     */
    credentialsEncrypted: text("credentials_encrypted").notNull(),

    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("integration_accounts_user_id_idx").on(table.userId),
    // Reconnecting the same provider user must update the existing row
    // rather than silently creating a second account that double-imports
    // every task.
    uniqueIndex("integration_accounts_user_provider_account_idx").on(
      table.userId,
      table.provider,
      table.providerAccountId
    ),
  ]
);

export const integrationAccountsRelations = relations(
  integrationAccounts,
  ({ one, many }) => ({
    user: one(users, {
      fields: [integrationAccounts.userId],
      references: [users.id],
    }),
    links: many(taskExternalLinks),
  })
);

export const insertIntegrationAccountSchema = createInsertSchema(
  integrationAccounts,
  {
    provider: z.string().min(1).max(32),
    providerAccountId: z.string().min(1).max(255),
    label: z.string().min(1).max(255),
    credentialsEncrypted: z.string().min(1),
    isActive: z.boolean().optional(),
  }
);

export const selectIntegrationAccountSchema =
  createSelectSchema(integrationAccounts);

export const updateIntegrationAccountSchema = insertIntegrationAccountSchema
  .partial()
  .omit({ userId: true });

export type IntegrationAccount = typeof integrationAccounts.$inferSelect;
export type NewIntegrationAccount = typeof integrationAccounts.$inferInsert;
export type UpdateIntegrationAccount = z.infer<
  typeof updateIntegrationAccountSchema
>;
