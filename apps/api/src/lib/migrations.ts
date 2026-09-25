import path from "path";
import { runMigrations } from "@open-sunsama/database/migrate";

/**
 * Bring the database schema up to date. The Docker image ships the SQL files
 * at /app/drizzle; MIGRATIONS_DIR points elsewhere when running outside it.
 */
export async function migrateDatabase(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required to run migrations");
  }
  const folder = path.resolve(process.env.MIGRATIONS_DIR || "drizzle");
  console.log(`[Migrations] Applying migrations from ${folder}`);
  await runMigrations(databaseUrl, folder);
  console.log("[Migrations] Database schema is up to date");
}
