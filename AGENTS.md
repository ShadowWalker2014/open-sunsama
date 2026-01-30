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

**Semantic Versioning (SemVer):** `MAJOR.MINOR.PATCH`

| Component | When to Increment |
|-----------|-------------------|
| **MAJOR** | Breaking changes (API, data format, major UI overhaul) |
| **MINOR** | New features, backwards compatible |
| **PATCH** | Bug fixes, small improvements |

### Version Sources

| File | Purpose |
|------|---------|
| `package.json` (root) | **Source of truth** for monorepo version |
| `apps/desktop/package.json` | Desktop app version (synced) |
| `apps/desktop/src-tauri/tauri.conf.json` | Tauri bundle version (synced) |

### Release Process

```bash
# 1. Update version in root package.json
# 2. Sync versions across all apps
bun run version:sync

# 3. Build desktop app
cd apps/desktop && bun run build

# 4. Commit with version tag
git add -A && git commit -m "release: v1.2.3"
git tag -a v1.2.3 -m "Release v1.2.3"
git push && git push --tags
```

### Version History

| Version | Date | Highlights |
|---------|------|------------|
| v1.0.0 | 2026-01-30 | Initial release - Kanban, time blocking, desktop app, focus mode |

---

## License

Non-Commercial License. Commercial use requires enterprise license.
