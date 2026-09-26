#!/usr/bin/env node
// Local dev without Docker or a local Postgres: runs the API and web dev
// servers against the Postgres in the Railway "development" environment.
//
//   bun run dev:local            # API on :3001 + web on :3000
//   node scripts/dev-local.mjs api   # API only
//   node scripts/dev-local.mjs web   # web only
//
// Ports: API_PORT / WEB_PORT (defaults 3001 / 3000), so worktrees can run
// side by side. Database: DEV_DATABASE_URL, else read from Railway with
// `railway variables -e development -s dev-postgres`.
//
// Every variable the API needs is passed explicitly. The API loads
// apps/api/.env through dotenv, which never overrides a variable that is
// already set — so a production URL in that file can't leak in.

import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = fileURLToPath(new URL("..", import.meta.url));

const mode = process.argv[2] ?? "all";
if (!["all", "api", "web"].includes(mode)) {
  console.error(`Unknown mode "${mode}". Use: all | api | web`);
  process.exit(1);
}

const apiPort = process.env.API_PORT ?? "3001";
const webPort = process.env.WEB_PORT ?? "3000";
const apiUrl = `http://localhost:${apiPort}`;
const webUrl = `http://localhost:${webPort}`;

function devDatabaseUrl() {
  if (process.env.DEV_DATABASE_URL) return process.env.DEV_DATABASE_URL;
  let out;
  try {
    out = execFileSync(
      "railway",
      ["variables", "-e", "development", "-s", "dev-postgres", "--kv"],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }
    );
  } catch (err) {
    console.error(
      "Couldn't read the dev database URL from Railway. Run `railway login` and `railway link` (project: Open Sunsama), or set DEV_DATABASE_URL.\n",
      err.stderr?.toString() ?? err.message
    );
    process.exit(1);
  }
  const line = out.split("\n").find((l) => l.startsWith("DATABASE_PUBLIC_URL="));
  if (!line) {
    console.error("dev-postgres has no DATABASE_PUBLIC_URL in the Railway development environment.");
    process.exit(1);
  }
  return line.slice("DATABASE_PUBLIC_URL=".length).trim();
}

const children = [];
function run(name, dir, args, env) {
  const child = spawn("bun", args, {
    cwd: path.join(root, dir),
    stdio: "inherit",
    env: { ...process.env, ...env },
  });
  child.on("exit", (code) => {
    console.log(`[dev-local] ${name} exited (${code ?? "signal"})`);
    shutdown(code ?? 0);
  });
  children.push(child);
}

function shutdown(code) {
  for (const child of children) if (!child.killed) child.kill("SIGTERM");
  process.exit(code);
}
process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

if (mode === "all" || mode === "api") {
  const databaseUrl = devDatabaseUrl();
  if (/ballast\.proxy\.rlwy\.net/.test(databaseUrl)) {
    console.error("Refusing to start: that's the production database.");
    process.exit(1);
  }
  run("api", "apps/api/", ["run", "dev"], {
    NODE_ENV: "development",
    PORT: apiPort,
    API_URL: apiUrl,
    WEB_APP_URL: webUrl,
    CORS_ORIGIN: webUrl,
    DATABASE_URL: databaseUrl,
    // Creates or updates tables on start; migrations are idempotent.
    MIGRATE_ON_START: "true",
    MIGRATIONS_DIR: path.join(root, "packages/database/drizzle"),
    JWT_SECRET: process.env.JWT_SECRET ?? "local-dev-only-jwt-secret-not-for-production",
    // Nothing below may reach production services from a laptop.
    REDIS_URL: "",
    RESEND_API_KEY: "",
    ROLLOVER_ENABLED: "false",
    EMAIL_WORKERS_ENABLED: "false",
    CALENDAR_SYNC_ENABLED: "false",
    RECURRING_ENABLED: "false",
    AWS_ACCESS_KEY_ID: "",
    AWS_SECRET_ACCESS_KEY: "",
    AWS_ENDPOINT_URL: "",
    GOOGLE_CLIENT_ID: "",
    GOOGLE_CLIENT_SECRET: "",
    MICROSOFT_CLIENT_ID: "",
    MICROSOFT_CLIENT_SECRET: "",
    VAPID_PUBLIC_KEY: "",
    VAPID_PRIVATE_KEY: "",
  });
}

if (mode === "all" || mode === "web") {
  run("web", "apps/web/", ["x", "vite", "--port", webPort, "--strictPort"], {
    VITE_API_URL: apiUrl,
    VITE_WS_URL: apiUrl.replace(/^http/, "ws"),
  });
}
