import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

/**
 * Get the database URL from environment variables
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      'Database URL not found. Please set DATABASE_URL environment variable.'
    );
  }

  return url;
}

/**
 * Create a database client with postgres-js driver
 * Works with standard PostgreSQL databases (Railway, Supabase, etc.)
 */
export function createDbClient(databaseUrl?: string) {
  const url = databaseUrl || getDatabaseUrl();
  const client = postgres(url);

  return drizzle(client, { schema });
}

// Type for the database client
export type DbClient = ReturnType<typeof createDbClient>;

// Singleton instance for server-side usage
let dbInstance: DbClient | null = null;

/**
 * Get or create the database client singleton
 * Use this in server environments where you want to reuse the connection
 */
export function getDb(): DbClient {
  if (!dbInstance) {
    dbInstance = createDbClient();
  }
  return dbInstance;
}

/**
 * Reset the database instance (useful for testing)
 */
export function resetDbInstance(): void {
  dbInstance = null;
}

// Re-export drizzle-orm utilities
export { sql, eq, and, or, desc, asc, isNull, isNotNull, inArray, notInArray, lt, gt, lte, gte, ne, like, ilike } from 'drizzle-orm';
