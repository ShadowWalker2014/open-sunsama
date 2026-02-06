import { pgTable, text, integer, timestamp } from 'drizzle-orm/pg-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Available platforms for desktop releases
export const RELEASE_PLATFORMS = ['windows', 'macos-arm64', 'macos-x64', 'linux'] as const;
export type ReleasePlatform = (typeof RELEASE_PLATFORMS)[number];

export const releases = pgTable('releases', {
  id: text('id').primaryKey(), // Format: rel_<nanoid>
  version: text('version').notNull(), // Semver format, e.g., "1.0.0"
  platform: text('platform').notNull(), // windows, macos-arm64, macos-x64, linux
  downloadUrl: text('download_url').notNull(), // S3 URL
  fileSize: integer('file_size').notNull(), // Size in bytes
  fileName: text('file_name').notNull(),
  sha256: text('sha256'), // Optional, for verification
  signature: text('signature'), // Ed25519 signature for Tauri updater
  updaterUrl: text('updater_url'), // URL for Tauri updater artifact (.tar.gz/.nsis.zip/.AppImage)
  releaseNotes: text('release_notes'), // Optional
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Zod schemas for validation
export const insertReleaseSchema = createInsertSchema(releases, {
  id: z.string().regex(/^rel_/, 'ID must start with rel_'),
  version: z
    .string()
    .min(1, 'Version is required')
    .regex(/^\d+\.\d+\.\d+/, 'Version must be in semver format (e.g., 1.0.0)'),
  platform: z.enum(RELEASE_PLATFORMS),
  downloadUrl: z.string().url('Download URL must be a valid URL'),
  fileSize: z.number().int().positive('File size must be a positive integer'),
  fileName: z.string().min(1, 'File name is required'),
  sha256: z.string().length(64, 'SHA256 must be 64 characters').optional(),
  releaseNotes: z.string().optional(),
});

export const selectReleaseSchema = createSelectSchema(releases);

// Partial update schema (all fields optional except id)
export const updateReleaseSchema = insertReleaseSchema.partial().omit({ id: true });

// Type exports
export type Release = typeof releases.$inferSelect;
export type NewRelease = typeof releases.$inferInsert;
export type UpdateRelease = z.infer<typeof updateReleaseSchema>;
