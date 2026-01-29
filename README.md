# Open Sunsama

Open-source, AI agent friendly Sunsama alternative with direct API access.

## Overview

Open Sunsama is a free and open-source time blocking and task management application. Unlike traditional productivity apps, Open Sunsama provides direct API access that enables AI agents and assistants to help you manage your tasks and time effectively.

### AI Agent Compatible

Open Sunsama is designed to work seamlessly with AI assistants including:
- Clawdbot / Moltbot
- Claude Code / Claude Cowork / OpenWork
- And other AI agents that can interact with APIs

This means your AI assistant can:
- Create, update, and complete tasks on your behalf
- Schedule time blocks for focused work
- Help you plan your day
- Track your progress

## Features

- **Task Management**: Full CRUD operations with priorities (P0-P3), subtasks, and notes
- **Time Blocking**: Visual calendar with drag-and-drop scheduling
- **Kanban Board**: Infinite horizontal scroll with day columns
- **Rich Notes**: Tiptap-powered editor with file attachments (images, videos, documents)
- **Profile & Settings**: Customizable profile with avatar upload
- **Dark Mode**: Full dark/light theme support
- **API Access**: RESTful API with JWT authentication for AI agent integration
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
All API requests require a Bearer token:
```
Authorization: Bearer <your-jwt-token>
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
curl -X POST http://localhost:3001/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Review PR #123",
    "notes": "Check the new authentication flow",
    "scheduledDate": "2026-01-29",
    "estimatedMins": 30,
    "priority": "P1"
  }'
```

## License

This software is free for non-commercial use. See [LICENSE](LICENSE) for details.

For commercial or enterprise licensing, contact: **ceo@circo.so**

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

- Issues: GitHub Issues
- Enterprise: ceo@circo.so
