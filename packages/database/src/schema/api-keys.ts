import { pgTable, uuid, varchar, timestamp, boolean, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';
import { users } from './users';

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  keyHash: varchar('key_hash', { length: 255 }).notNull(),
  keyPrefix: varchar('key_prefix', { length: 12 }).notNull(), // First 8 chars for identification
  scopes: text('scopes').array(), // Array of permission scopes
  lastUsedAt: timestamp('last_used_at'),
  expiresAt: timestamp('expires_at'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  user: one(users, {
    fields: [apiKeys.userId],
    references: [users.id],
  }),
}));

// Available scopes for API keys
export const API_KEY_SCOPES = [
  'tasks:read',
  'tasks:write',
  'time-blocks:read',
  'time-blocks:write',
  'user:read',
  'user:write',
] as const;

export type ApiKeyScope = (typeof API_KEY_SCOPES)[number];

// Zod schemas for validation
export const insertApiKeySchema = createInsertSchema(apiKeys, {
  name: z.string().min(1, 'Name is required').max(255),
  scopes: z.array(z.enum(API_KEY_SCOPES)).optional(),
  expiresAt: z.date().optional(),
});

export const selectApiKeySchema = createSelectSchema(apiKeys);

// Schema for creating a new API key (without hash, which is generated server-side)
export const createApiKeySchema = z.object({
  name: z.string().min(1, 'Name is required').max(255),
  scopes: z.array(z.enum(API_KEY_SCOPES)).default(['tasks:read', 'time-blocks:read']),
  expiresAt: z.date().optional(),
});

// Type exports
export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
export type CreateApiKeyInput = z.infer<typeof createApiKeySchema>;
