import { pgTable, uuid, varchar, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * OAuth states table for CSRF protection during OAuth flows
 * Replaces in-memory state storage for production reliability
 */
export const oauthStates = pgTable(
  "oauth_states",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    state: varchar("state", { length: 64 }).notNull().unique(), // Random hex string
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    provider: varchar("provider", { length: 20 }).notNull(), // 'google' | 'outlook'
    createdAt: timestamp("created_at").defaultNow().notNull(),
    expiresAt: timestamp("expires_at").notNull(), // Auto-cleanup expired states
  },
  (table) => [
    index("oauth_states_state_idx").on(table.state),
    index("oauth_states_expires_at_idx").on(table.expiresAt),
  ]
);

// Type exports
export type OAuthState = typeof oauthStates.$inferSelect;
export type NewOAuthState = typeof oauthStates.$inferInsert;
