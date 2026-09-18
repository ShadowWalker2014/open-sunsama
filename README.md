<div align="center">

<a href="https://opensunsama.com"><img src="docs/images/logo.png" alt="Open Sunsama logo" width="96" height="96" /></a>

# Open Sunsama

### Daily planning, done right.

The open-source daily planner for time-blocking, focused work, and seamless AI integration.<br />
**AI native:** control it from any agent, including **Claude**, **ChatGPT**, Cursor, Claude Code, or any MCP client, with one URL and no API key.

<br />

[![Open the app](https://img.shields.io/badge/Open_the_app-opensunsama.com-F97316?style=for-the-badge)](https://opensunsama.com)
[![Connect Claude](https://img.shields.io/badge/Claude-Add_connector-D97757?style=for-the-badge&logo=claude&logoColor=white)](#-connect-claude-or-chatgpt-in-30-seconds)
[![Connect ChatGPT](https://img.shields.io/badge/ChatGPT-Add_app-10A37F?style=for-the-badge)](#-connect-claude-or-chatgpt-in-30-seconds)
[![GitHub stars](https://img.shields.io/github/stars/ShadowWalker2014/open-sunsama?style=for-the-badge&logo=github&color=yellow)](https://github.com/ShadowWalker2014/open-sunsama/stargazers)

[**Website**](https://opensunsama.com) · [**Docs**](https://opensunsama.com/docs) · [**Connect your AI**](https://opensunsama.com/docs/mcp/overview) · [**Self-host**](#-get-started) · [**Download apps**](https://opensunsama.com/download)

<br />

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="docs/images/readme/board-dark.png" />
  <img src="docs/images/readme/board.png" alt="Open Sunsama board: today's prioritized tasks in columns by day, with a time-blocked schedule on the right" width="100%" />
</picture>

<sub>A real Tuesday for a Head of Product: a prioritized board, subtasks, estimates, and a time-blocked schedule. The backlog is tucked away on the left.</sub>

</div>

<br />

## ✨ Why Open Sunsama

Most planners are closed boxes that your AI assistant can't see into. Open Sunsama is built to be driven by AI as much as by you:

- **🤖 Your AI plans with you.** Claude and ChatGPT can read your schedule, create and prioritize tasks, time-block your day, and close things out through a secure one-click connector.
- **🗓️ Sunsama-style daily planning.** A kanban board of days, drag-and-drop time blocking, focus mode with a timer, and rollover of unfinished work.
- **🔓 Open source and self-hostable.** Run it on your own server, read every line, and extend it through a full REST API.
- **🖥️ Everywhere you work.** Web, desktop (macOS, Windows, Linux), and mobile, with light and dark themes and keyboard-first navigation.

<br />

## 🔌 Connect Claude or ChatGPT in 30 seconds

Paste one URL into your AI assistant, sign in, and click **Allow access**. That's it: no API keys and no config files.

```
https://api.opensunsama.com/mcp
```

<table>
<tr>
<td width="50%" valign="top">

**Claude** (web, Desktop, and mobile)

1. **Settings → Customize → Connectors → Add**
2. Name it *Open Sunsama* and paste the URL
3. **Continue → Add → Connect**, then **Allow access**

[Claude setup guide →](https://opensunsama.com/docs/mcp/claude)

</td>
<td width="50%" valign="top">

**ChatGPT** (paid plans, developer mode)

1. **Settings → Security and login → Developer mode**
2. [chatgpt.com/plugins](https://chatgpt.com/plugins) → **+** → paste the URL
3. **Create**, then **Allow access**

[ChatGPT setup guide →](https://opensunsama.com/docs/mcp/chatgpt)

</td>
</tr>
<tr>
<td width="50%" align="center"><img src="docs/images/readme/consent-claude.png" alt="Open Sunsama consent screen: Claude wants to access your Open Sunsama account, verified app from claude.ai" width="88%" /></td>
<td width="50%" align="center"><img src="docs/images/readme/consent-chatgpt.png" alt="Open Sunsama consent screen: ChatGPT wants to access your Open Sunsama account, verified app from chatgpt.com" width="88%" /></td>
</tr>
</table>

**Coding assistants** connect the same way:

| Client | Install |
| --- | --- |
| **Claude Code** | `claude mcp add --transport http open-sunsama https://api.opensunsama.com/mcp`, then run `/mcp` → Authenticate |
| **Cursor** | [![Add to Cursor](https://cursor.com/deeplink/mcp-install-dark.svg)](https://cursor.com/en/install-mcp?name=open-sunsama&config=eyJ1cmwiOiJodHRwczovL2FwaS5vcGVuc3Vuc2FtYS5jb20vbWNwIn0=) |
| **VS Code** | [![Add to VS Code](https://img.shields.io/badge/VS_Code-Add_MCP_server-0098FF?style=flat-square&logo=visualstudiocode&logoColor=white)](https://vscode.dev/redirect/mcp/install?name=open-sunsama&config=%7B%22type%22%3A%22http%22%2C%22url%22%3A%22https%3A//api.opensunsama.com/mcp%22%7D) |
| **Any MCP client** | Add the URL as a Streamable HTTP server with OAuth |

Then just ask:

> *"What's on my plate today? Move anything that isn't a P0 or P1 to tomorrow."*<br />
> *"Block 9–11am tomorrow for deep work on the launch plan and link it to that task."*<br />
> *"Add subtasks to 'Board deck': metrics slide, roadmap slide, asks."*

<details>
<summary><b>How the connection stays secure</b></summary>

<br />

- **Standard OAuth 2.1 with PKCE.** Claude and ChatGPT are identified by their published client metadata (CIMD), so the consent screen shows a **verified** badge. Other clients register with dynamic client registration.
- **Scoped, short-lived tokens.** Access tokens expire hourly and refresh automatically. Refresh tokens rotate, and replaying an old one revokes the whole grant.
- **Least privilege.** Connector tokens only reach tasks, time blocks, and your profile. They can't touch API keys, passwords, uploads, or calendar accounts.
- **Annotated tools.** Every tool is marked read-only or destructive, so assistants ask before deleting anything.
- **One-click disconnect** under **Settings → MCP → Connected apps**.

<p align="center"><img src="docs/images/readme/mcp-settings.png" alt="Settings → MCP: connector URL, step-by-step setup per assistant, and connected apps list showing Claude and ChatGPT" width="70%" /></p>

</details>

<details>
<summary><b>Prefer an API key? The local server still works</b></summary>

<br />

```json
{
  "mcpServers": {
    "open-sunsama": {
      "command": "npx",
      "args": ["-y", "@open-sunsama/mcp"],
      "env": { "OPENSUNSAMA_API_KEY": "os_your_api_key_here" }
    }
  }
}
```

You can also send a key to the hosted server as an `X-API-Key` header. See [Local server & API keys](https://opensunsama.com/docs/mcp/local-server).

</details>

<br />

## 🎬 See it in action

<p align="center">
  <img src="docs/images/readme/demo.gif" alt="Demo: adding a task, opening task details, switching to the week calendar, tasks list, ideas board, and connecting an AI assistant" width="100%" />
</p>

<p align="center"><sub><a href="docs/images/readme/demo.mp4">▶ Watch the full-quality video (MP4)</a></sub></p>

<br />

## 🧭 Everything you need to plan a focused day

<table>
<tr>
<td width="50%" valign="top">

### Time-block your week

Drag tasks onto the calendar and see your whole week at a glance. Blocks link back to their tasks, so estimates meet reality.

<img src="docs/images/readme/calendar-week.png" alt="Week calendar full of color-coded time blocks from Monday to Friday" width="100%" />

</td>
<td width="50%" valign="top">

### Dig into any task

Subtasks, rich-text notes, attachments, priority, estimate, and a timer, all in one keyboard-friendly modal.

<img src="docs/images/readme/task-detail.png" alt="Task detail modal with subtasks, notes, P0 priority, and a running focus timer" width="100%" />

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Focus mode

One task, one timer. Track actual time against your estimate while everything else fades away.

<img src="docs/images/readme/focus.png" alt="Focus mode with a running timer at 23 minutes out of a 90-minute estimate" width="100%" />

</td>
<td width="50%" valign="top">

### ⌘K for everything

Jump to any task, idea, or setting in a keystroke. Search spans tasks, ideas, and events.

<img src="docs/images/readme/command-palette.png" alt="Command palette searching 'review' across tasks and ideas" width="100%" />

</td>
</tr>
<tr>
<td width="50%" valign="top">

### Every task, one list

Filter active, completed, or everything, grouped by day with subtask progress.

<img src="docs/images/readme/tasks.png" alt="Tasks list grouped by Today, Tomorrow, and upcoming days with priority dots and subtask counts" width="100%" />

</td>
<td width="50%" valign="top">

### Ideas: your someday boards

Trello-style boards for bets and side projects. Promote an idea to a real task when it's time.

<img src="docs/images/readme/ideas.png" alt="Ideas board with Someday, Exploring, and Ready to build columns" width="100%" />

</td>
</tr>
</table>

<table>
<tr>
<td width="32%" align="center" valign="top">
<img src="docs/images/readme/mobile-tasks.png" alt="Open Sunsama on a phone: today's tasks with priorities and completed items" width="100%" />
</td>
<td width="68%" valign="top">

### Works on every screen

- **Web app** at [opensunsama.com](https://opensunsama.com)
- **Desktop** for macOS, Windows, and Linux, with a system tray, a global quick-add hotkey, and notifications ([download](https://opensunsama.com/download))
- **Mobile** for iOS and Android
- **Calendar sync** with Google Calendar, Outlook, and iCloud
- **Recurring routines**, task rollover, reminders, and push notifications
- **Keyboard-first**: press `?` anywhere for shortcuts
- **Themes**: light, dark, or system, with multiple color palettes and fonts

</td>
</tr>
</table>

<br />

## 🆚 How it compares

| | **Open Sunsama** | Typical closed planners |
| --- | :---: | :---: |
| Open source & self-hostable | ✅ | ❌ |
| AI native: control it from any agent over MCP | ✅ | ❌ |
| One-click Claude & ChatGPT connector (OAuth) | ✅ | Rare |
| Full REST API with scoped keys | ✅ | Limited |
| Daily planning board + time blocking | ✅ | ✅ |
| Focus timer, routines, rollover | ✅ | Varies |
| Web, desktop, and mobile apps | ✅ | ✅ |

Switching from another tool? Read the comparisons: [Sunsama](https://opensunsama.com/alternative/sunsama) · [Motion](https://opensunsama.com/alternative/motion) · [Akiflow](https://opensunsama.com/alternative/akiflow) · [Reclaim](https://opensunsama.com/alternative/reclaim) · [Todoist](https://opensunsama.com/alternative/todoist)

<br />

## 👥 Built for people who plan their day

- **Founders and managers** juggling roadmaps, 1:1s, hiring, and customer calls, who want one place to decide what matters today.
- **Engineers** who live in [Cursor, Claude Code, and the terminal](https://opensunsama.com/for/developers) and want their planner reachable from there.
- **Remote and async teams** [time-blocking across time zones](https://opensunsama.com/for/remote-workers).
- **ADHD and neurodivergent planners** who need [structure, visual time, and gentle rollover](https://opensunsama.com/for/adhd) instead of guilt.
- **Privacy-minded teams** who want to self-host their planner and keep data on their own servers.

<br />

## 🛠️ MCP tools

23 tools, available through the hosted connector and the local server:

| Category | Tools |
| --- | --- |
| **Tasks** | `list_tasks` `get_task` `create_task` `update_task` `complete_task` `uncomplete_task` `delete_task` `schedule_task` `reorder_tasks` |
| **Time blocks** | `list_time_blocks` `get_time_block` `create_time_block` `update_time_block` `delete_time_block` `link_task_to_time_block` `get_schedule_for_day` |
| **Subtasks** | `list_subtasks` `create_subtask` `toggle_subtask` `update_subtask` `delete_subtask` |
| **Profile** | `get_user_profile` `update_user_profile` |

## 🧩 REST API

Everything in the app is available over HTTP, with JWT or scoped API keys:

```bash
curl -X POST https://api.opensunsama.com/tasks \
  -H "X-API-Key: os_your_key" -H "Content-Type: application/json" \
  -d '{"title": "Ship v2.0", "priority": "P0", "scheduledDate": "2026-10-01", "estimatedMins": 120}'
```

Scopes: `tasks:read` `tasks:write` `time-blocks:read` `time-blocks:write` `ideas:read` `ideas:write` `user:read` `user:write`. See the [API reference](https://opensunsama.com/docs/api/authentication).

<br />

## 🚀 Get started

**Cloud:** create an account at [opensunsama.com](https://opensunsama.com), then [connect your AI](#-connect-claude-or-chatgpt-in-30-seconds).

**Self-host with Docker:**

```bash
git clone https://github.com/ShadowWalker2014/open-sunsama.git
cd open-sunsama
docker-compose up -d        # PostgreSQL + API on :3001 (MCP connector at /mcp)
docker build -f Dockerfile.web --build-arg VITE_API_URL=https://api.your-domain.com -t open-sunsama-web .
```

The [self-hosting guide](https://opensunsama.com/docs/self-hosting/docker) covers environment variables, the web container, and production setup.

<details>
<summary><b>Run from source</b></summary>

<br />

Prerequisites: [Bun](https://bun.sh) 1.2+ and PostgreSQL 15+. S3-compatible storage is optional, for file uploads.

```bash
git clone https://github.com/ShadowWalker2014/open-sunsama.git
cd open-sunsama
bun install

# Configure environment (root + API)
cp .env.example .env
cp apps/api/.env.example apps/api/.env
#   JWT_SECRET              → openssl rand -base64 32
#   CALENDAR_ENCRYPTION_KEY → openssl rand -hex 32
#   API_URL / WEB_APP_URL   → your public URLs (the MCP connector uses them for OAuth)

bun run db:push
bun run dev
```

| Service | URL |
| --- | --- |
| Web app | http://localhost:3000 |
| API | http://localhost:3001 |
| MCP connector | http://localhost:3001/mcp |
| Drizzle Studio | http://localhost:4983 |

For calendar sync, follow the [Google Calendar setup guide](docs/calendar/google-calendar-setup.md).

</details>

<details>
<summary><b>Seed a demo workspace</b></summary>

<br />

`scripts/readme-media/seed-demo.ts` fills an account with a realistic week (tasks, subtasks, time blocks, and ideas) through the REST API. It's the same data behind these screenshots:

```bash
DEMO_API_URL=http://localhost:3001 DEMO_PASSWORD='Choose-a-strong-1' bun run scripts/readme-media/seed-demo.ts
```

</details>

<br />

## 🏗️ Tech stack

| Layer | Technologies |
| --- | --- |
| **Frontend** | React 19, Vite, TanStack Router + Query, Tailwind CSS, Radix UI, Tiptap |
| **Backend** | Hono 4, Drizzle ORM, PostgreSQL, PG Boss jobs, Zod, OAuth 2.1 authorization server |
| **AI** | Model Context Protocol (Streamable HTTP + stdio), 23 annotated tools |
| **Desktop / mobile** | Tauri 2, Expo |
| **Infra** | Bun workspaces, Turborepo, Docker, Railway |

```
open-sunsama/
├── apps/
│   ├── api/        # Hono REST API, OAuth server, and the /mcp endpoint
│   ├── web/        # React + Vite app, docs, and marketing site
│   ├── desktop/    # Tauri v2 desktop app
│   └── mobile/     # Mobile apps
├── packages/       # database (Drizzle), types, api-client, utils
└── mcp/            # MCP tools + the npx stdio server
```

<br />

## 🗺️ Roadmap

- [x] Daily planning board, priorities, subtasks, and rich notes
- [x] Time-blocking calendar with day, 3-day, week, and month views
- [x] Focus mode, routines (recurring tasks), and rollover
- [x] Calendar sync: Google Calendar, Outlook, and iCloud
- [x] Ideas boards and a ⌘K command palette
- [x] Desktop and mobile apps
- [x] MCP server (local stdio) and REST API with scoped keys
- [x] **One-click Claude & ChatGPT connector** (hosted MCP + OAuth)
- [ ] Team workspaces
- [ ] Integrations (Linear, GitHub, Jira, Notion)
- [ ] Analytics dashboard
- [ ] AI auto-scheduling

Have an idea? [Start a discussion](https://github.com/ShadowWalker2014/open-sunsama/discussions/new?category=ideas).

<br />

## ❓ FAQ

<details>
<summary><b>What is Open Sunsama?</b></summary>
<br />
An open-source daily planner and task manager inspired by Sunsama. You plan each day on a kanban board, time-block tasks on a calendar, and work through them in focus mode. It's also an MCP server, so AI assistants like Claude and ChatGPT can manage your tasks and schedule for you.
</details>

<details>
<summary><b>Is it an open-source Sunsama alternative?</b></summary>
<br />
Yes. It covers Sunsama's daily-planning loop (a kanban board, time blocking, focus mode, and calendar sync), the code is on GitHub, and you can self-host it. On top of that, any AI agent can run it over MCP. See <a href="#-license">License</a> for the terms.
</details>

<details>
<summary><b>How do I connect it to ChatGPT or Claude?</b></summary>
<br />
Add <code>https://api.opensunsama.com/mcp</code> as a custom connector in Claude, or as a plugin connection in ChatGPT's developer mode. Then sign in and click <b>Allow access</b>. Step-by-step guides: <a href="https://opensunsama.com/docs/mcp/claude">Claude</a> and <a href="https://opensunsama.com/docs/mcp/chatgpt">ChatGPT</a>.
</details>

<details>
<summary><b>What is MCP?</b></summary>
<br />
The <a href="https://modelcontextprotocol.io">Model Context Protocol</a> is an open standard for connecting AI assistants to tools and data. Open Sunsama's MCP server gives assistants 23 tools to read and update your tasks, subtasks, and time blocks.
</details>

<details>
<summary><b>Can my AI delete my tasks without asking?</b></summary>
<br />
Destructive tools are annotated as such, so Claude and ChatGPT ask for confirmation before running them. You can revoke an assistant's access at any time under Settings → MCP.
</details>

<details>
<summary><b>Does it work with Cursor, VS Code, and Claude Code?</b></summary>
<br />
Yes. Use the one-click buttons above for Cursor and VS Code, or run <code>claude mcp add --transport http open-sunsama https://api.opensunsama.com/mcp</code> for Claude Code.
</details>

<br />

## 🤝 Contributing

Contributions are welcome! [Open an issue](https://github.com/ShadowWalker2014/open-sunsama/issues), [start a discussion](https://github.com/ShadowWalker2014/open-sunsama/discussions), or send a PR. See [CONTRIBUTING.md](CONTRIBUTING.md).

```bash
git checkout -b feature/amazing-feature
bun run dev && bun run typecheck && bun run lint
git commit -m "feat: add amazing feature"
```

## 📄 License

Open Sunsama uses a custom **non-commercial license**. It covers personal, educational, non-profit, and open-source use, plus evaluation. Commercial use by for-profit companies requires an enterprise license. See [LICENSE](LICENSE).

<br />

<div align="center">

**If Open Sunsama helps you plan better days, please give it a ⭐. It helps others find it.**

[![Star on GitHub](https://img.shields.io/github/stars/ShadowWalker2014/open-sunsama?style=for-the-badge&logo=github&color=yellow)](https://github.com/ShadowWalker2014/open-sunsama/stargazers)

<sub>Made by <a href="https://circo.so">Circo</a> · <a href="https://opensunsama.com">opensunsama.com</a></sub>

</div>
