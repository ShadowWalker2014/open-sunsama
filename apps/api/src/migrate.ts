/**
 * One-off migration runner: `node dist/migrate.js`
 * (in Docker: `docker compose run --rm api node dist/migrate.js`).
 */

import "dotenv/config";
import { migrateDatabase } from "./lib/migrations.js";

migrateDatabase()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[Migrations] Failed:", error);
    process.exit(1);
  });
