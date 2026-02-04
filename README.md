<div align="center">

<img src="docs/images/logo.svg" alt="Open Sunsama Logo" width="120" height="120" />

# Open Sunsama

### The First AI-Native, Open-Source Task Manager

**Your AI assistant can finally manage your calendar.**

[![GitHub stars](https://img.shields.io/github/stars/ShadowWalker2014/open-sunsama?style=for-the-badge&logo=github&color=yellow)](https://github.com/ShadowWalker2014/open-sunsama/stargazers)
[![License](https://img.shields.io/badge/License-Non--Commercial-blue?style=for-the-badge)](LICENSE)

<br />

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Bun](https://img.shields.io/badge/Bun-1.2-fbf0df?style=flat-square&logo=bun&logoColor=black)](https://bun.sh/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Hono](https://img.shields.io/badge/Hono-4-E36002?style=flat-square&logo=hono&logoColor=white)](https://hono.dev/)
[![Tauri](https://img.shields.io/badge/Tauri-2-FFC131?style=flat-square&logo=tauri&logoColor=black)](https://tauri.app/)

<br />

[**Live Demo**](https://opensunsama.com) · [**Documentation**](https://opensunsama.com/docs) · [**API Reference**](https://api.opensunsama.com) · [**MCP Setup**](./mcp/README.md) · [**Download**](https://opensunsama.com/download)

<br />

</div>

---

## The Problem

You use AI assistants daily—Claude, ChatGPT, Copilot. They help you code, write, and think.

But when it comes to **managing your time**? They're useless. Your calendar and task manager are black boxes that AI can't touch.

**Until now.**

## The Solution

Open Sunsama is the **first task manager built for the AI era**:

- **MCP Protocol Support** — Claude Desktop, Cursor, and Windsurf can manage your tasks directly
- **Full REST API** — Build automations, integrations, and AI workflows
- **100% Open Source** — Self-host, customize, extend, contribute
- **Beautiful UX** — We didn't sacrifice design for openness

<br />

---

## Features

<table>
<tr>
<td width="50%">

### Task Management

- Priorities (P0-P3) with color coding
- Subtasks with progress tracking
- Rich text notes with Tiptap editor
- File attachments (images, videos, docs)
- Drag-and-drop reordering
- Task rollover at midnight

</td>
<td width="50%">

### Time Blocking

- Visual daily/weekly calendar
- Drag to create time blocks
- Resize blocks with snap-to-grid
- Link blocks to tasks
- Track actual vs. estimated time
- Focus mode with timer

</td>
</tr>
<tr>
<td width="50%">

### AI & Automation

- **24 MCP tools** for Claude/Cursor
- RESTful API with scoped API keys
- Background job processing (PG Boss)

</td>
<td width="50%">

### Multi-Platform

- Web app (React + Vite)
- Desktop apps (macOS, Windows, Linux)
- Mobile apps (iOS, Android)
- Dark/light/system themes

</td>
</tr>
</table>

---

## AI Integration

### Why AI-Native?

Traditional productivity apps are **closed systems**. Your AI can't:

- See your calendar to suggest meeting times
- Reschedule tasks when priorities change
- Create time blocks for deep work
- Track your progress across projects

Open Sunsama **opens the black box**.

### MCP Server (Model Context Protocol)

Connect your AI assistant in seconds:

```json
// Claude Desktop: ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "open-sunsama": {
      "command": "npx",
      "args": ["-y", "@open-sunsama/mcp"],
      "env": {
        "OPENSUNSAMA_API_KEY": "os_your_api_key_here"
      }
    }
  }
}
```

**24 Tools Available:**

| Category        | Tools                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Tasks**       | `list_tasks`, `create_task`, `update_task`, `complete_task`, `delete_task`, `schedule_task`, `reorder_tasks`                         |
| **Time Blocks** | `list_time_blocks`, `create_time_block`, `update_time_block`, `delete_time_block`, `link_task_to_time_block`, `get_schedule_for_day` |
| **Subtasks**    | `list_subtasks`, `create_subtask`, `toggle_subtask`, `update_subtask`, `delete_subtask`                                              |
| **User**        | `get_user_profile`, `update_user_profile`                                                                                            |

### Example Prompts

Once connected, try these with Claude:

> "Schedule my top 3 tasks for tomorrow with 2-hour focus blocks"

> "What's on my calendar today? Move anything non-urgent to next week"

> "Create a task to review the Q4 roadmap, P1 priority, due Friday"

> "I finished the design review—mark it complete and start my next task"

### REST API

For custom integrations:

```bash
# Create a task
curl -X POST https://api.opensunsama.com/tasks \
  -H "X-API-Key: os_your_key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Ship v2.0",
    "priority": "P0",
    "scheduledDate": "2026-02-03",
    "estimatedMins": 120
  }'

# Get today's schedule
curl https://api.opensunsama.com/time-blocks?date=2026-02-03 \
  -H "X-API-Key: os_your_key"
```

**Scopes:** `tasks:read`, `tasks:write`, `time-blocks:read`, `time-blocks:write`, `user:read`, `user:write`

---

## Quick Start

### Cloud (Recommended)

The fastest way to get started:

1. **Sign up** at [opensunsama.com](https://opensunsama.com)
2. **Generate an API key** in Settings → API Keys
3. **Connect your AI** using the MCP config above

### Self-Hosted

<details>
<summary><strong>Prerequisites</strong></summary>

- [Bun](https://bun.sh/) v1.0+ (or Node.js 20+)
- PostgreSQL 15+
- S3-compatible storage (optional, for file uploads)

</details>

```bash
# Clone the repository
git clone https://github.com/ShadowWalker2014/open-sunsama.git
cd open-sunsama

# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL

# Run database migrations
bun run db:push

# Start development servers
bun run dev
```

| Service        | URL                   |
| -------------- | --------------------- |
| Web App        | http://localhost:3000 |
| API            | http://localhost:3001 |
| Drizzle Studio | http://localhost:4983 |

### Docker

```bash
# Start all services
docker-compose up -d

# Or build and run individually
docker build -f Dockerfile.api -t open-sunsama-api .
docker build -f Dockerfile.web -t open-sunsama-web .
```

### Desktop Apps

Download from [opensunsama.com/download](https://opensunsama.com/download) or build from source:

```bash
cd apps/desktop
bun run tauri build
```

---

## Tech Stack

<table>
<tr>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
  <br>React 19
</td>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=typescript" width="48" height="48" alt="TypeScript" />
  <br>TypeScript
</td>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
  <br>Tailwind
</td>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=postgresql" width="48" height="48" alt="PostgreSQL" />
  <br>PostgreSQL
</td>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=bun" width="48" height="48" alt="Bun" />
  <br>Bun
</td>
<td align="center" width="96">
  <img src="https://skillicons.dev/icons?i=tauri" width="48" height="48" alt="Tauri" />
  <br>Tauri
</td>
</tr>
</table>

| Layer        | Technologies                                                                             |
| ------------ | ---------------------------------------------------------------------------------------- |
| **Frontend** | React 19, Vite 6, TanStack Router, TanStack Query, Tailwind CSS, Radix UI, Framer Motion |
| **Backend**  | Hono 4, Drizzle ORM, PostgreSQL 15, PG Boss (jobs), Zod                                  |
| **Desktop**  | Tauri 2 (Rust), system tray, global hotkeys, auto-launch                                 |
| **Mobile**   | Expo 52, React Native, Expo Router                                                       |
| **Editor**   | Tiptap (ProseMirror), syntax highlighting, file embeds                                   |
| **Infra**    | Turborepo, Bun workspaces, Docker, Railway                                               |

---

## Architecture

```
open-sunsama/
├── apps/
│   ├── api/           # Hono REST API (port 3001)
│   ├── web/           # React + Vite SPA (port 3000)
│   ├── desktop/       # Tauri v2 desktop wrapper
│   └── mobile/        # Expo React Native app
├── packages/
│   ├── database/      # Drizzle ORM, migrations, schema
│   ├── types/         # Shared TypeScript interfaces
│   ├── api-client/    # Type-safe HTTP client + React Query hooks
│   └── utils/         # Date utils, validation, errors
├── mcp/               # MCP server for AI assistants
└── docs/              # Documentation and images
```

---

## Roadmap

We ship fast. Here's what's coming:

- [x] Core task management with priorities
- [x] Time blocking calendar
- [x] MCP server for AI agents (24 tools)
- [x] Desktop apps (macOS, Windows, Linux)
- [x] Mobile apps (iOS, Android)
- [x] Rich text notes with file attachments
- [x] API key authentication with scopes
- [ ] **Calendar sync** (Google Calendar, Outlook) — Q1 2026
- [ ] **Recurring tasks** — Q1 2026
- [ ] **Team workspaces** — Q2 2026
- [ ] **Integrations** (Linear, GitHub, Jira, Notion) — Q2 2026
- [ ] **Analytics dashboard** — Q2 2026
- [ ] **AI auto-scheduling** — Q3 2026

---

## Contributing

We love contributions! Open Sunsama is built by the community, for the community.

### Ways to Contribute

- **Report bugs** — Found an issue? [Open a bug report](https://github.com/ShadowWalker2014/open-sunsama/issues/new?template=bug_report.md)
- **Request features** — Have an idea? [Start a discussion](https://github.com/ShadowWalker2014/open-sunsama/discussions/new?category=ideas)
- **Submit PRs** — Code contributions are always welcome
- **Improve docs** — Help others get started
- **Share** — Star the repo and spread the word!

### Development Setup

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/open-sunsama.git
cd open-sunsama

# Install dependencies
bun install

# Create a branch
git checkout -b feature/amazing-feature

# Make changes and test
bun run dev
bun run typecheck
bun run lint

# Commit with conventional commits
git commit -m "feat: add amazing feature"

# Push and open a PR
git push origin feature/amazing-feature
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## Community

<div align="center">

[![GitHub Discussions](https://img.shields.io/badge/GitHub-Discussions-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/ShadowWalker2014/open-sunsama/discussions)

</div>

---

## License

Open Sunsama is **free for non-commercial use** under a custom license.

**Permitted:**

- Personal use
- Educational use
- Non-profit organizations
- Open source projects
- Evaluation and testing

**Requires enterprise license:**

- Commercial use
- Use in products sold for profit
- Production use by for-profit companies

See [LICENSE](LICENSE) for full details.

---

## Acknowledgments

Built with love using these amazing open-source projects:

<table>
<tr>
<td align="center"><a href="https://hono.dev/"><img src="https://hono.dev/images/logo.png" width="40" /><br /><sub>Hono</sub></a></td>
<td align="center"><a href="https://orm.drizzle.team/"><img src="https://orm.drizzle.team/favicon.ico" width="40" /><br /><sub>Drizzle</sub></a></td>
<td align="center"><a href="https://tanstack.com/"><img src="https://tanstack.com/favicon.ico" width="40" /><br /><sub>TanStack</sub></a></td>
<td align="center"><a href="https://www.radix-ui.com/"><img src="https://www.radix-ui.com/favicon.ico" width="40" /><br /><sub>Radix UI</sub></a></td>
<td align="center"><a href="https://tiptap.dev/"><img src="https://tiptap.dev/favicon.ico" width="40" /><br /><sub>Tiptap</sub></a></td>
<td align="center"><a href="https://tauri.app/"><img src="https://tauri.app/favicon.ico" width="40" /><br /><sub>Tauri</sub></a></td>
<td align="center"><a href="https://expo.dev/"><img src="https://expo.dev/favicon.ico" width="40" /><br /><sub>Expo</sub></a></td>
</tr>
</table>

---

<div align="center">

<br />

**If Open Sunsama helps you ship faster, consider giving it a ⭐**

<br />

<a href="https://github.com/ShadowWalker2014/open-sunsama/stargazers">
  <img src="https://img.shields.io/github/stars/ShadowWalker2014/open-sunsama?style=for-the-badge&logo=github&color=yellow" alt="Stars" />
</a>

<br />
<br />

Made with ❤️ by [Circo](https://circo.so)

<sub>The future of productivity is open.</sub>

</div>
