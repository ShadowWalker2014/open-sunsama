import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

/**
 * Apply the SQL migrations in `migrationsFolder` (packages/database/drizzle).
 * Migrations already recorded in drizzle.__drizzle_migrations are skipped,
 * so this is safe to run on every start.
 */
export async function runMigrations(databaseUrl: string, migrationsFolder: string): Promise<void> {
  // The baseline uses IF NOT EXISTS; silence Postgres's "already exists, skipping" notices
  const client = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  try {
    await migrate(drizzle(client), { migrationsFolder });
  } finally {
    await client.end();
  }
}
