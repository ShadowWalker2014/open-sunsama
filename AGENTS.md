# AGENTS.md - Open Sunsama Codebase Guide

This document provides a comprehensive overview of the Open Sunsama codebase for AI agents and developers.

## Project Overview

Open Sunsama is an **open-source, AI-agent-friendly Sunsama alternative** - a task management and time blocking application. It's designed with direct API access so AI assistants (Claude, etc.) can create tasks, schedule time blocks, and help plan your day programmatically.

**Tech Stack:** TypeScript, Bun workspaces, Turborepo, PostgreSQL, Drizzle ORM

---

## Monorepo Structure

```
opensunsama/
├── apps/
│   ├── api/          # Hono REST API (Node.js)
│   ├── web/          # React + Vite SPA
│   ├── desktop/      # Tauri v2 desktop wrapper
│   └── mobile/       # Expo React Native app
├── packages/
│   ├── database/     # Drizzle ORM + PostgreSQL schema
│   ├── types/        # Shared TypeScript types
│   ├── api-client/   # HTTP client with React Query hooks
│   └── utils/        # Shared utilities (date, validation, errors)
├── .todo/            # PRD documents for planned features
├── docs/             # Deployment documentation
└── turbo.json        # Turborepo configuration
```

---

## Apps

### 1. API (`apps/api`)

**Framework:** Hono v4 + @hono/node-server  
**Port:** 3001  
**Build:** tsup

#### Key Files
| Path | Purpose |
|------|---------|
| `src/index.ts` | Main entry point, route mounting |
| `src/routes/*.ts` | API route handlers |
| `src/middleware/auth.ts` | JWT + API Key authentication |
| `src/middleware/error.ts` | Global error handling |
| `src/lib/jwt.ts` | JWT sign/verify utilities |
| `src/lib/s3.ts` | S3 file upload utilities |
| `src/validation/*.ts` | Zod request validation schemas |

#### API Routes

| Route | Methods | Auth | Description |
|-------|---------|------|-------------|
| `/auth/*` | POST, GET, PATCH | Mixed | Authentication & user profile |
| `/tasks/*` | GET, POST, PATCH, DELETE | Yes | Task CRUD + reordering |
| `/tasks/:taskId/subtasks/*` | GET, POST, PATCH, DELETE | Yes | Subtask management |
| `/time-blocks/*` | GET, POST, PATCH, DELETE | Yes | Time block CRUD |
| `/api-keys/*` | GET, POST, PATCH, DELETE | JWT only | API key management |
| `/notifications/preferences` | GET, PUT | Yes | Notification settings |
| `/uploads/*` | POST, GET, DELETE | Yes | File uploads (S3) |
| `/attachments/*` | GET, DELETE | Yes | Attachment management |

#### Authentication Methods
1. **JWT Token:** `Authorization: Bearer <token>` - For web/mobile sessions
2. **API Key:** `X-API-Key: os_<key>` - For AI agents with scoped permissions

#### API Key Scopes
- `tasks:read`, `tasks:write`
- `time-blocks:read`, `time-blocks:write`
- `user:read`, `user:write`

---

### 2. Web (`apps/web`)

**Framework:** React 18 + Vite  
**Router:** TanStack Router  
**State:** TanStack Query (React Query)  
**UI:** Radix UI + Tailwind CSS + shadcn/ui  
**Port:** 3000

#### Key Directories
| Path | Purpose |
|------|---------|
| `src/routes/` | File-based routing (TanStack Router) |
| `src/components/` | UI components (shadcn-style) |
| `src/hooks/` | Custom React hooks (data fetching) |
| `src/lib/` | Utilities, API client setup |
| `src/features/` | Feature-specific components |

#### Features
- Kanban board with drag-and-drop (@dnd-kit)
- Rich text editor (Tiptap)
- Calendar/timeline view
- Dark/light theme
- Desktop integration via Tauri APIs

---

### 3. Desktop (`apps/desktop`)

**Framework:** Tauri v2 (Rust + WebView)  
**Frontend:** Loads web app's dist folder

#### Features
- System tray with quick actions
- Global hotkeys (Cmd+Shift+T for quick task)
- Native notifications
- Auto-launch on login
- Close-to-tray behavior

#### Key Files
| Path | Purpose |
|------|---------|
| `src-tauri/tauri.conf.json` | Tauri configuration |
| `src-tauri/src/main.rs` | Rust backend entry |
| `src/index.tsx` | Desktop-specific React entry |

---

### 4. Mobile (`apps/mobile`)

**Framework:** Expo 52 + React Native 0.76  
**Router:** Expo Router 4 (file-based)  
**Auth Storage:** expo-secure-store

#### Key Directories
| Path | Purpose |
|------|---------|
| `app/` | Expo Router file-based routes |
| `app/(auth)/` | Auth screens (login, register) |
| `app/(app)/` | Protected app screens (tabs) |
| `src/components/` | Reusable UI components |
| `src/hooks/` | Data fetching hooks |
| `src/lib/` | API client, auth context |

#### Navigation Structure
```
Root Layout (providers)
├── (auth) Stack
│   ├── login
│   └── register
└── (app) Tabs
    ├── index (Tasks)
    ├── calendar (Timeline)
    └── settings
```

---

## Packages

### 1. `@open-sunsama/database`

**ORM:** Drizzle ORM with PostgreSQL

#### Schema Tables
| Table | Purpose |
|-------|---------|
| `users` | User accounts |
| `tasks` | Task items with priority (P0-P3) |
| `subtasks` | Checklist items within tasks |
| `time_blocks` | Scheduled time slots |
| `api_keys` | API key credentials |
| `notification_preferences` | User notification settings |
| `attachments` | File attachments (S3) |

#### Key Exports
```typescript
import { getDb, eq, and, tasks, users } from '@open-sunsama/database';

const db = getDb();
const userTasks = await db.query.tasks.findMany({
  where: eq(tasks.userId, userId),
});
```

---

### 2. `@open-sunsama/types`

Pure TypeScript type definitions shared across all apps.

#### Key Types
```typescript
import type { 
  Task, TaskPriority, CreateTaskInput,
  TimeBlock, CreateTimeBlockInput,
  User, AuthResponse,
  ApiKey, ApiKeyScope,
  ApiError, PaginatedResponse,
} from '@open-sunsama/types';
```

#### Task Priority
`TaskPriority = 'P0' | 'P1' | 'P2' | 'P3'`

---

### 3. `@open-sunsama/api-client`

HTTP client with React Query hooks.

#### Usage
```typescript
import { createApi } from '@open-sunsama/api-client';

const api = createApi({
  baseUrl: 'https://api.example.com',
  token: 'jwt-token', // or apiKey: 'os_...'
});

// API methods
const tasks = await api.tasks.list({ completed: false });
const task = await api.tasks.create({ title: 'New Task' });
await api.tasks.complete(taskId);
```

#### React Query Hooks
```typescript
import { createReactHooks } from '@open-sunsama/api-client/react';

const hooks = createReactHooks(client);

// In components
const { data: tasks } = hooks.useTasks({ completed: false });
const createTask = hooks.useCreateTask();
```

---

### 4. `@open-sunsama/utils`

Shared utilities and error handling.

#### Key Exports
```typescript
import {
  // Date utilities
  formatDate, parseDate, isToday, addMinutes,
  // Validation schemas
  emailSchema, passwordSchema, taskSchema,
  // Error classes
  AppError, ValidationError, NotFoundError, AuthenticationError,
  // API key utilities
  generateApiKey, hashApiKey, verifyApiKey,
  // Constants
  API_KEY_PREFIX, TASK_PRIORITIES, DATE_FORMAT,
} from '@open-sunsama/utils';
```

---

## Database Schema (ERD)

```
users (1) ─────────────────┬──────────────────────┬─────────────────┐
                           │                      │                 │
                           ▼ (N)                  ▼ (N)             ▼ (N)
                        tasks (1) ────────► time_blocks       api_keys
                           │                      │
                           ▼ (N)                  │
                       subtasks                   │
                           │                      │
                           └──────────────────────┘
                                      │
                                      ▼ (N)
                                attachments

notification_preferences (1:1 with users)
```

---

## Commands

### Development
```bash
bun install          # Install dependencies
bun run dev          # Start all dev servers
bun run build        # Build all packages/apps
bun run typecheck    # TypeScript type checking
bun run lint         # Lint all code
bun run test         # Run tests
```

### Database
```bash
bun run db:generate  # Generate Drizzle migrations
bun run db:migrate   # Run migrations
bun run db:push      # Push schema to database
bun run db:studio    # Open Drizzle Studio
```

### Per-App Commands
```bash
# API
bun run --filter=@open-sunsama/api dev

# Web
bun run --filter=@open-sunsama/web dev

# Mobile
bun run --filter=@open-sunsama/mobile start
```

---

## Environment Variables

### API (`apps/api/.env`)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-min-32-chars
JWT_EXPIRES_IN=7d
API_PORT=3001
CORS_ORIGIN=http://localhost:3000

# S3 (optional)
AWS_ENDPOINT_URL=...
AWS_DEFAULT_REGION=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET_NAME=...
```

---

## API Response Format

### Success
```json
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "limit": 50, "total": 100 }
}
```

### Error
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "statusCode": 400,
    "errors": { "email": ["Invalid email"] }
  }
}
```

---

## Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         PACKAGES                                │
├─────────────────────────────────────────────────────────────────┤
│  @open-sunsama/types      Pure TypeScript types                 │
│  @open-sunsama/utils      Date, validation, errors              │
│  @open-sunsama/database   Drizzle ORM + schemas                 │
│  @open-sunsama/api-client HTTP client + React Query hooks       │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│   apps/web    │    │  apps/mobile  │    │   apps/api    │
│   (Vite)      │    │   (Expo)      │    │   (Hono)      │
│               │    │               │    │               │
│ api-client ◄──┴────┴── api-client │    │ database      │
│ types         │    │ types         │    │ types, utils  │
└───────────────┘    └───────────────┘    └───────────────┘
        │
        ▼
┌───────────────┐
│ apps/desktop  │
│  (Tauri v2)   │
│               │
│ Wraps web app │
└───────────────┘
```

---

## For AI Agents

### Getting an API Key
1. Log in to the web app
2. Go to Settings > API Keys
3. Create a new key with required scopes
4. Use `X-API-Key: os_<your-key>` header

### Common Operations
```bash
# List today's tasks
curl -H "X-API-Key: os_..." https://api.example.com/tasks?date=2024-01-15

# Create a task
curl -X POST -H "X-API-Key: os_..." -H "Content-Type: application/json" \
 -d '{"title":"Meeting prep","priority":"P1","scheduledDate":"2024-01-15"}' \
 https://api.example.com/tasks

# Complete a task
curl -X PATCH -H "X-API-Key: os_..." -H "Content-Type: application/json" \
 -d '{"completedAt":"2024-01-15T10:00:00Z"}' \
 https://api.example.com/tasks/{id}

# Create a time block
curl -X POST -H "X-API-Key: os_..." -H "Content-Type: application/json" \
 -d '{"title":"Deep work","date":"2024-01-15","startTime":"09:00","endTime":"11:00"}' \
 https://api.example.com/time-blocks
```

---

## Planned Features (`.todo/`)

| PRD | Status | Description |
|-----|--------|-------------|
| `desktop-app/PRD.md` | Implemented | Tauri v2 desktop wrapper |
| `mobile-app/PRD.md` | In Progress | Expo mobile app |
| `landing-page/PRD.md` | Planned | Public landing page |

---

## License

Non-Commercial License - Personal, educational, and non-profit use allowed. Commercial use requires enterprise license.
