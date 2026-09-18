import { pgTable, uuid, varchar, text, timestamp, index } from "drizzle-orm/pg-core";
import { users } from "./users";

/**
 * Tables backing Open Sunsama's own OAuth 2.1 authorization server, which
 * lets MCP clients (Claude, ChatGPT, Cursor, ...) connect to the remote MCP
 * endpoint without the user ever pasting an API key.
 *
 * Distinct from `oauth_states`, which tracks the outbound flows where Open
 * Sunsama is the *client* of Google/Microsoft calendars.
 */

/**
 * Registered OAuth clients. Rows come from two places:
 * - `dcr`: RFC 7591 dynamic client registration (random client_id)
 * - `cimd`: Client ID Metadata Documents, where client_id is an HTTPS URL we
 *   fetched and cached (Claude, ChatGPT, Claude Code)
 */
export const oauthClients = pgTable(
  "oauth_clients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clientId: varchar("client_id", { length: 512 }).notNull().unique(),
    clientSecretHash: varchar("client_secret_hash", { length: 64 }),
    clientName: varchar("client_name", { length: 255 }),
    clientUri: varchar("client_uri", { length: 1024 }),
    logoUri: varchar("logo_uri", { length: 1024 }),
    /** CIMD clients that authenticate with private_key_jwt (ChatGPT) publish keys here. */
    jwksUri: varchar("jwks_uri", { length: 1024 }),
    redirectUris: text("redirect_uris").array().notNull(),
    tokenEndpointAuthMethod: varchar("token_endpoint_auth_method", { length: 32 })
      .notNull()
      .default("none"),
    registrationType: varchar("registration_type", { length: 8 }).notNull(), // 'dcr' | 'cimd'
    metadataFetchedAt: timestamp("metadata_fetched_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  }
);

/** Single-use authorization codes (10 minute lifetime, PKCE-bound). */
export const oauthAuthorizationCodes = pgTable(
  "oauth_authorization_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    codeHash: varchar("code_hash", { length: 64 }).notNull().unique(),
    clientId: varchar("client_id", { length: 512 })
      .notNull()
      .references(() => oauthClients.clientId, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    redirectUri: text("redirect_uri").notNull(),
    codeChallenge: varchar("code_challenge", { length: 128 }).notNull(),
    scopes: text("scopes").array().notNull(),
    resource: varchar("resource", { length: 1024 }),
    expiresAt: timestamp("expires_at").notNull(),
    consumedAt: timestamp("consumed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("oauth_codes_expires_at_idx").on(table.expiresAt)]
);

/**
 * Issued access/refresh token pairs. Tokens are opaque random strings; only
 * their SHA-256 hashes are stored. Every pair descended from one
 * authorization shares a `familyId`, so replaying a rotated refresh token or
 * a spent code revokes the whole family.
 */
export const oauthTokens = pgTable(
  "oauth_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    familyId: uuid("family_id").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    clientId: varchar("client_id", { length: 512 })
      .notNull()
      .references(() => oauthClients.clientId, { onDelete: "cascade" }),
    accessTokenHash: varchar("access_token_hash", { length: 64 }).notNull().unique(),
    refreshTokenHash: varchar("refresh_token_hash", { length: 64 }).unique(),
    scopes: text("scopes").array().notNull(),
    resource: varchar("resource", { length: 1024 }),
    accessTokenExpiresAt: timestamp("access_token_expires_at").notNull(),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    rotatedAt: timestamp("rotated_at"),
    revokedAt: timestamp("revoked_at"),
    lastUsedAt: timestamp("last_used_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("oauth_tokens_user_id_idx").on(table.userId),
    index("oauth_tokens_family_id_idx").on(table.familyId),
  ]
);

export type OAuthClient = typeof oauthClients.$inferSelect;
export type NewOAuthClient = typeof oauthClients.$inferInsert;
export type OAuthAuthorizationCode = typeof oauthAuthorizationCodes.$inferSelect;
export type OAuthToken = typeof oauthTokens.$inferSelect;
