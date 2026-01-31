# AGENTS.md - Open Sunsama

AI-agent-friendly task management + time blocking app. TypeScript monorepo with Bun, Turborepo, PostgreSQL, Drizzle ORM.

## Testing

**Use Cursor browser tool for UI testing.**

| Environment | Web | API | Prerequisites |
|-------------|-----|-----|---------------|
| Local | http://localhost:3000 | http://localhost:3001 | `bun dev` running for both web and api |
| Production | https://opensunsama.com | https://api.opensunsama.com | None |

**Login credentials:** `.env.local` in project root (gitignored, real user account - NEVER commit).

**MCP Tool:** Use `open-sunsama` MCP server to create/update tasks, time blocks, subtasks programmatically.

---

## Structure

```
opensunsama/
├── apps/
│   ├── api/        # Hono REST API (port 3001)
│   ├── web/        # React + Vite SPA (port 3000)
│   ├── desktop/    # Tauri v2 wrapper
│   └── mobile/     # Expo React Native
├── packages/
│   ├── database/   # Drizzle ORM + PostgreSQL
│   ├── types/      # Shared TypeScript types
│   ├── api-client/ # HTTP client + React Query hooks
│   └── utils/      # Date, validation, errors
├── mcp/            # MCP server for AI agents
└── .todo/          # PRD documents
```

---

## Apps

### API (`apps/api`)
**Hono v4** | Port 3001 | tsup build

| Route | Auth | Description |
|-------|------|-------------|
| `/auth/*` | Mixed | Login, register, profile |
| `/tasks/*` | Yes | Task CRUD + reorder |
| `/tasks/:id/subtasks/*` | Yes | Subtask CRUD |
| `/time-blocks/*` | Yes | Time block CRUD + cascade resize |
| `/api-keys/*` | JWT | API key management |
| `/uploads/*` | Yes | S3 file uploads |

**Auth:** JWT (`Bearer <token>`) or API Key (`X-API-Key: os_<key>`)  
**Scopes:** `tasks:read`, `tasks:write`, `time-blocks:read`, `time-blocks:write`, `user:read`, `user:write`

### Web (`apps/web`)
**React 19 + Vite** | TanStack Router + Query | Radix UI + Tailwind | Port 3000

| Route | Description |
|-------|-------------|
| `/app` | Main kanban board |
| `/app/calendar` | Timeline view |
| `/app/focus/$taskId` | Focus mode |
| `/app/settings` | User settings |

**Features:** Kanban drag-drop (@dnd-kit), time blocking, focus mode with timer, command palette (Cmd+K), rich text (Tiptap), file attachments, WebSocket sync.

### Desktop (`apps/desktop`)
**Tauri v2** | System tray, global hotkeys (Cmd+Shift+T), notifications, auto-launch.

### Mobile (`apps/mobile`)
**Expo 52** | Expo Router | Tab navigation (Tasks, Calendar, Settings).

---

## Database

**PostgreSQL + Drizzle ORM**

| Table | Purpose |
|-------|---------|
| `users` | Accounts with preferences (JSONB) |
| `tasks` | Title, notes, scheduledDate, priority (P0-P3), position |
| `subtasks` | Checklist items per task |
| `time_blocks` | Scheduled blocks linked to tasks |
| `api_keys` | Hashed keys with scopes |
| `attachments` | S3 file metadata |
| `notification_preferences` | Reminders, rollover settings |

**Relations:** Users → Tasks → Subtasks (CASCADE), Tasks ↔ TimeBlocks (SET NULL), Tasks → Attachments (CASCADE)

---

## MCP Tools (24)

Configure in Cursor/Claude with `OPENSUNSAMA_API_KEY` env var.

| Category | Tools |
|----------|-------|
| Tasks | `list_tasks`, `get_task`, `create_task`, `update_task`, `complete_task`, `uncomplete_task`, `delete_task`, `schedule_task`, `reorder_tasks` |
| Time Blocks | `list_time_blocks`, `get_time_block`, `create_time_block`, `update_time_block`, `delete_time_block`, `link_task_to_time_block`, `get_schedule_for_day` |
| Subtasks | `list_subtasks`, `create_subtask`, `toggle_subtask`, `update_subtask`, `delete_subtask` |
| User | `get_user_profile`, `update_user_profile` |

---

## Commands

```bash
bun install          # Install deps
bun dev              # Start all dev servers
bun run build        # Build all
bun run typecheck    # Type check
bun run lint         # Lint
bun run test         # Tests

# Database
bun run db:generate  # Generate migrations
bun run db:migrate   # Run migrations
bun run db:push      # Push schema
bun run db:studio    # Drizzle Studio

# Per-app
bun run --filter=@open-sunsama/api dev
bun run --filter=@open-sunsama/web dev
```

---

## API Response Format

```json
// Success
{ "success": true, "data": {...}, "meta": { "page": 1, "total": 100 } }

// Error
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "...", "statusCode": 400 } }
```

---

## Environment

**API** (`apps/api/.env`): `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, S3 vars, VAPID keys, `RESEND_API_KEY`

**Web** (`apps/web/.env`): `VITE_API_URL`

**Root** (`.env.local`): Test credentials (gitignored)

---

## Versioning

**See [`.skills/versioning/SKILL.md`](.skills/versioning/SKILL.md) for complete versioning guide.**

Quick reference:
- **Source of truth:** `package.json` (root)
- **Sync command:** `bun run version:sync`
- **Current version:** v1.0.0

---

## Desktop Releases

**See [`.skills/desktop-releases/SKILL.md`](.skills/desktop-releases/SKILL.md) for complete release guide.**

Quick reference:
- **Trigger release:** `git tag v1.x.x && git push origin v1.x.x`
- **Manual trigger:** GitHub → Actions → Desktop Release → Run workflow
- **Downloads page:** https://opensunsama.com/download
- **Platforms:** macOS (arm64/x64), Windows, Linux

---

## Railway Debugging

**Railway CLI** is installed. Use it to check services, environment variables, and logs.

### Quick Commands

```bash
# Check login status
railway whoami

# Check current project/service
railway status

# List environment variables for a service
railway variables --service api
railway variables --service Postgres

# View logs (streams live)
railway logs --service api
```

### Database Access

The Postgres MCP tool points to a different project. To query the Open Sunsama database directly:

```bash
# Get public DATABASE_URL
railway variables --service Postgres | grep DATABASE_PUBLIC_URL

# Run queries using the public URL
DATABASE_URL="postgresql://postgres:PASSWORD@ballast.proxy.rlwy.net:29435/railway" node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
// ... your query
"
```

---

## PG Boss (Background Jobs)

Task rollover, daily summaries, and task reminders use PG Boss for job scheduling.

### Health Check

```bash
curl https://api.opensunsama.com/health
# Should show: "pgBossRunning": true
```

### Debugging PG Boss Issues

1. **Check health endpoint** - shows `pgBossRunning` status and any initialization errors
2. **Check pgboss.schedule table** - should have `timezone-rollover-check`, `daily-summary-check`, `task-reminder-check`
3. **Check pgboss.job table** - recent jobs and their states
4. **Check rollover_logs table** - rollover history and errors

```bash
# Check PG Boss state in database
DATABASE_URL="..." node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
async function check() {
  const client = await pool.connect();
  const schedules = await client.query('SELECT name, cron FROM pgboss.schedule');
  console.log('Scheduled jobs:', schedules.rows);
  const jobs = await client.query('SELECT name, state, created_on FROM pgboss.job ORDER BY created_on DESC LIMIT 10');
  console.log('Recent jobs:', jobs.rows);
  const logs = await client.query('SELECT * FROM rollover_logs ORDER BY executed_at DESC LIMIT 5');
  console.log('Rollover logs:', logs.rows);
  client.release();
  await pool.end();
}
check();
"
```

### Manual Rollover

If PG Boss isn't running, use the manual rollover endpoint:

```bash
curl -X POST https://api.opensunsama.com/tasks/rollover \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| `pgBossRunning: false` | PG Boss failed to start | Check logs for initialization error, verify DATABASE_URL is set |
| Jobs not running | Worker crashed/stopped | Redeploy API service to restart workers |
| Rollover not happening | Check rollover_logs for errors | Fix error, delete failed log entry, redeploy |

---

## License

Non-Commercial License. Commercial use requires enterprise license.
