import { pgTable, uuid, text, bigint, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

export const passkeys = pgTable("passkeys", {
  id: text("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  publicKey: text("public_key").notNull(),
  counter: bigint("counter", { mode: "number" }).notNull(),
  transports: text("transports").array().notNull().default([]),
  backedUp: boolean("backed_up").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
}, (table) => [index("passkeys_user_id_idx").on(table.userId)]);

// Persisted so verification works across API replicas and restarts. A challenge
// is deleted atomically before verification, making each ceremony single-use.
export const passkeyChallenges = pgTable("passkey_challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  challenge: text("challenge").notNull(),
  purpose: text("purpose").notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  origin: text("origin").notNull(),
  rpId: text("rp_id").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
}, (table) => [index("passkey_challenges_expires_at_idx").on(table.expiresAt)]);
