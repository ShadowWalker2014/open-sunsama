# Open Sunsama

Open-source, AI agent friendly Sunsama alternative with direct API access.

## Overview

Open Sunsama is a free and open-source time blocking and task management application. Unlike traditional productivity apps, Open Sunsama provides direct API access that enables AI agents and assistants to help you manage your tasks and time effectively.

### AI Agent Compatible

Open Sunsama is designed to work seamlessly with AI assistants including:
- Claude Desktop, Cursor, Windsurf, and other MCP-compatible tools
- Any AI agent that can interact with REST APIs

This means your AI assistant can:
- Create, update, and complete tasks on your behalf
- Schedule time blocks for focused work
- Help you plan your day
- Track your progress

### MCP Server (Model Context Protocol)

Open Sunsama includes a built-in MCP server that enables AI assistants like Claude Desktop and Cursor to manage your tasks and calendar directly.

**[→ See MCP Setup Instructions](./mcp/README.md)**

The MCP server provides 23 tools for:
- **Task Management**: Create, update, complete, delete, and schedule tasks
- **Subtasks**: Break down tasks into smaller actionable items
- **Time Blocking**: Schedule focused work sessions on your calendar
- **User Profile**: Access and update preferences

## Features

- **Task Management**: Full CRUD operations with priorities (P0-P3), subtasks, and notes
- **Time Blocking**: Visual calendar with drag-and-drop scheduling
- **Kanban Board**: Infinite horizontal scroll with day columns
- **Rich Notes**: Tiptap-powered editor with file attachments (images, videos, documents)
- **Profile & Settings**: Customizable profile with avatar upload
- **Dark Mode**: Full dark/light theme support
- **API Access**: RESTful API with API Key authentication for AI agent integration
- **Mobile Responsive**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, Vite, TanStack Router, TanStack Query, Tailwind CSS, Radix UI
- **Backend**: Hono, Drizzle ORM, PostgreSQL
- **Editor**: Tiptap (rich text)
- **Storage**: S3-compatible (Railway)
- **Monorepo**: Turborepo with Bun

## Getting Started

### Prerequisites

- [Bun](https://bun.sh/) v1.0+
- PostgreSQL database
- S3-compatible storage (optional, for file uploads)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-org/open-sunsama.git
cd open-sunsama
```

2. Install dependencies:
```bash
bun install
```

3. Set up environment variables:
```bash
# Copy example env files
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# Edit with your database and API credentials
```

4. Run database migrations:
```bash
cd packages/database
bun run db:push
```

5. Start development servers:
```bash
bun run dev
```

The web app will be available at http://localhost:3000 and the API at http://localhost:3001.

## API Documentation

Open Sunsama provides a RESTful API for AI agent integration:

### Authentication

The API supports two authentication methods:

#### 1. API Key (Recommended for AI Agents / Integrations)

API keys can be created in **Settings → API Keys** and are the recommended method for programmatic access:

```
X-API-Key: os_<your-api-key>
```

API keys can be scoped to specific permissions:
- `tasks:read` / `tasks:write` - Task management
- `time-blocks:read` / `time-blocks:write` - Time block scheduling
- `user:read` / `user:write` - User profile access

**Note:** API keys are shown only once at creation. The key is stored as a SHA-256 hash and cannot be recovered.

#### 2. JWT Token (Web Sessions)

Used internally by the web app, obtained via login:

```
Authorization: Bearer <jwt-token>
```

### Key Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Create account |
| POST | /auth/login | Get JWT token |
| GET | /tasks | List all tasks |
| POST | /tasks | Create task |
| PATCH | /tasks/:id | Update task |
| DELETE | /tasks/:id | Delete task |
| GET | /time-blocks | List time blocks |
| POST | /time-blocks | Create time block |
| GET | /attachments | List attachments |
| POST | /uploads/attachments | Upload file |

### Example: Create a Task (for AI agents)

```bash
curl -X POST https://api.opensunsama.com/tasks \
  -H "X-API-Key: os_your-api-key-here" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review PR #123",
    "notes": "Check the new authentication flow",
    "scheduledDate": "2026-01-29",
    "estimatedMins": 30,
    "priority": "P1"
  }'
```

> **Self-hosted/Local**: Replace `https://api.opensunsama.com` with your API URL (e.g., `http://localhost:3001`)

### Managing API Keys

1. Navigate to **Settings → API Keys** in the web app
2. Click **"Generate New Key"**
3. Configure the key:
   - **Name**: A descriptive name (e.g., "Claude Assistant")
   - **Expiration**: Optional expiration date
   - **Scopes**: Select which permissions the key should have
4. **Copy the key immediately** - it will only be shown once
5. Use the key in your API requests with the `X-API-Key` header

## License

This software is free for non-commercial use. See [LICENSE](LICENSE) for details.

For commercial or enterprise licensing, contact: **ceo@circo.so**

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

- Issues: GitHub Issues
- Enterprise: ceo@circo.so
