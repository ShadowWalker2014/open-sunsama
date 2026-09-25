/**
 * /for/developers — the agent operator and the owner (personas 2 and 3 in
 * .skills/seo-content/personas.md). Target queries: "task manager for
 * developers", "developer daily planner", "planner with API", "MCP task
 * manager". Competitor facts checked September 2026 (see the comparison
 * section's sources).
 */

import { defineMarketingPage } from "../types";
import { dayBody, type DayEntry } from "./typical-day";

/** One tab of the code card (components/personas/code-tabs.tsx). */
export interface CodeSnippet {
  id: string;
  label: string;
  /** Shown above the code, like a file name or a shell. */
  file: string;
  /** Lines starting with "#" are comments and are left out when copied. */
  code: string;
  note: string;
}

/** Exact lines from /docs/mcp/overview, /docs/mcp/cursor, /docs/api/* and /docs/self-hosting/docker. */
export const snippets: CodeSnippet[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    file: "Terminal",
    code: [
      "# Add the hosted MCP server, then sign in once in the browser",
      "claude mcp add --transport http open-sunsama https://api.opensunsama.com/mcp",
    ].join("\n"),
    note: "Claude Code opens a sign-in page the first time. No API key to paste. [Claude setup](/docs/mcp/claude)",
  },
  {
    id: "cursor",
    label: "Cursor",
    file: "~/.cursor/mcp.json",
    code: ['{', '  "mcpServers": {', '    "open-sunsama": {', '      "url": "https://api.opensunsama.com/mcp"', "    }", "  }", "}"].join(
      "\n"
    ),
    note: "Then click **Connect** in Cursor Settings → MCP and allow access. [Cursor setup](/docs/mcp/cursor)",
  },
  {
    id: "rest",
    label: "REST API",
    file: "Terminal",
    code: [
      "# Create a task for today with a 60-minute estimate",
      'curl -X POST "https://api.opensunsama.com/tasks" \\',
      '  -H "X-API-Key: os_live_xxx" \\',
      '  -H "Content-Type: application/json" \\',
      "  -d '{",
      '    "title": "Review the auth PR",',
      '    "scheduledDate": "2026-09-24",',
      '    "priority": "P1",',
      '    "estimatedMins": 60',
      "  }'",
    ].join("\n"),
    note: "Make a key with only the scopes you need in Settings → API Keys. [API authentication](/docs/api/authentication)",
  },
  {
    id: "docker",
    label: "Docker",
    file: "Terminal",
    code: [
      "git clone https://github.com/ShadowWalker2014/open-sunsama.git",
      "cd open-sunsama",
      "docker compose up -d --build",
      "",
      "# Web app on :3000, REST API on :3001, MCP at :3001/mcp",
    ].join("\n"),
    note: "One command builds the app, starts PostgreSQL and creates the tables. [Docker guide](/docs/self-hosting/docker)",
  },
];

/** REST endpoints shown as chips next to the code card (from apps/api/src/routes). */
export const endpoints = [
  "GET /tasks",
  "POST /tasks",
  "PATCH /tasks/:id",
  "POST /tasks/:id/complete",
  "GET /tasks/:id/subtasks",
  "GET /time-blocks",
  "POST /time-blocks",
  "PATCH /time-blocks/:id",
];

export const day: DayEntry[] = [
  {
    time: "8:50 AM",
    tone: "agent",
    tag: "Claude Code",
    title: "Ask for the plan in the terminal",
    body: "\"What's on my schedule today, and what did I leave open yesterday?\" Claude reads your tasks and meetings over MCP.",
  },
  {
    time: "9:00 AM",
    tone: "plan",
    tag: "Shortcuts",
    title: "Set today's three tasks",
    body: "Press A to add the bug you just remembered. Press E to give it an estimate. Press D to push the rest to tomorrow.",
  },
  {
    time: "9:30 AM - 11:30 AM",
    tone: "focus",
    tag: "Focus mode",
    title: "Deep work on the auth refactor",
    body: "One task, one timer. The timer logs the real minutes next to your estimate.",
  },
  {
    time: "11:30 AM",
    tone: "meeting",
    tag: "Google Calendar",
    title: "Standup",
    body: "Your synced meeting sits next to your blocks. Your agent can read it, but it can't move it.",
  },
  {
    time: "2:00 PM",
    tone: "agent",
    tag: "Cursor",
    title: "Turn a TODO into a task",
    body: "Select a // TODO: comment in Cursor and ask for a P2 task on Friday. It shows up on your board live.",
  },
  {
    time: "3:00 PM - 4:30 PM",
    tone: "block",
    tag: "Time block",
    title: "Code review block",
    body: "A script posts to /time-blocks each morning, so review time is always on the calendar.",
  },
  {
    time: "6:00 PM",
    tone: "done",
    tag: "Rollover",
    title: "Close the laptop",
    body: "Check off what shipped. Unfinished tasks roll to tomorrow on their own.",
  },
];

export default defineMarketingPage({
  path: "/for/developers",
  updated: "2026-09-24",
  seo: {
    title: "Task Manager for Developers: API, MCP, Keyboard",
    description:
      "Open Sunsama is a task manager for developers: Cmd+K and single-key shortcuts, a REST API with scoped keys, hosted MCP for Claude Code, and Docker self-hosting.",
  },
  breadcrumbs: [{ label: "For developers" }],

  hero: {
    badge: "For developers",
    eyebrow: "Keyboard, API, MCP",
    title: "A task manager for developers, with an API and MCP",
    accent: "with an API and MCP",
    answer:
      "Open Sunsama is an open-source task manager and daily planner for developers. Drive it from the keyboard, script it with the REST API, and let Claude Code or Cursor plan with you over MCP.",
    media: {
      clip: "command-palette",
      alt: "Pressing Cmd+K in Open Sunsama to search tasks and jump to a day",
    },
    chips: [
      { tone: "agent", title: "Claude Code connected", detail: "Created 3 tasks from your TODOs" },
      { tone: "block", title: "Deep work: auth refactor", detail: "9:30 - 11:30 AM" },
      { tone: "timer", title: "1:12:40 / 2:00", detail: "Focus" },
    ],
    secondary: { label: "Read the MCP docs", href: "/docs/mcp/overview" },
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "Open Sunsama is a task manager for developers that you can script, extend and run yourself",
      body: [
        "Open Sunsama is a task manager for developers who want speed and control. Your days are columns on a board, and your tasks go onto a calendar next to your meetings.",
        "You can drive it three ways: the keyboard, the REST API, or any AI agent over MCP. All three change the same tasks and time blocks.",
        "The code is public on GitHub. Read it, run it with Docker, or have your agent add the feature you need.",
      ],
      pointsTitle: "In short",
      points: [
        "Cmd+K finds any task or day. Single keys add, defer and complete.",
        "A REST API with API keys scoped to what each script needs.",
        "A hosted MCP server with 24 tools for Claude Code, Cursor and ChatGPT.",
        "Self-host with one docker compose command.",
        "Desktop apps for Mac, Windows and Linux.",
      ],
    },
    {
      kind: "media-rows",
      id: "pains",
      eyebrow: "Why developers switch",
      heading: "Your planner works the way your editor does",
      lead: "On Reddit and Hacker News, developers name the same three problems: closed apps with no API, connectors that log you out, and too much clicking. Here is how Open Sunsama answers each one.",
      rows: [
        {
          title: "Your hands stay on the keyboard",
          body: [
            "Press Cmd+K to search any task, jump to a day or run a command. Most actions have a single-key shortcut.",
            "Hover a task and press **C** to complete it, **D** to push it to tomorrow, **Z** to send it to the backlog or **F** to start focus. Press **Shift+?** to see every shortcut.",
          ],
          media: {
            shot: "command-palette",
            alt: "The Cmd+K command palette open over the Open Sunsama board, with task results and commands",
            caption: "Cmd+K: search tasks, jump to a day, run a command.",
          },
          link: { label: "How the command palette works", href: "/features/command-palette" },
        },
        {
          title: "Your agent reads and writes your plan, and stays signed in",
          body: [
            "Paste one URL into Claude Code, Cursor or ChatGPT and sign in with OAuth. Tokens refresh on their own, so you don't log in again every morning.",
            "Tasks, subtasks and time blocks live in one place. Your agent needs one connector, not a task app plus a calendar app.",
          ],
          bullets: [
            "24 tools, each marked read-only or destructive",
            "Meetings are read-only: your agent can't move them",
            "Estimates and actual minutes are in the data",
          ],
          media: {
            clip: "ai-plan",
            alt: "Claude plans an afternoon in Open Sunsama over MCP while tasks and time blocks appear live",
            caption: "Claude plans the afternoon over MCP. Blocks appear live.",
          },
          link: { label: "See all 24 MCP tools", href: "/docs/mcp/overview" },
        },
        {
          title: "Deep work gets a real slot on the calendar",
          body: [
            "Drag a task onto the day view to block time for it. Your Google, Outlook or iCloud meetings sit right beside it.",
            "So you can see a 2-hour refactor won't fit before standup, before you start it.",
          ],
          media: {
            clip: "time-block",
            alt: "A task dragged from the list onto the day calendar in Open Sunsama and resized",
            caption: "Drag a task onto the calendar, then resize the block.",
          },
          link: { label: "Time blocking in Open Sunsama", href: "/features/time-blocking" },
        },
      ],
    },
    {
      kind: "custom",
      id: "build",
      eyebrow: "Connect it",
      heading: "You can connect an agent, a script or your own server in one step",
      lead: "Pick your way in. Each tab has the exact lines from the docs.",
      body: [
        `The REST API covers tasks, subtasks and time blocks: ${endpoints.join(", ")}.`,
        "API keys start with os_ and carry scopes such as tasks:read, tasks:write, time-blocks:write and calendar:read. Send them in the X-API-Key header.",
        ...snippets.map((s) => `${s.label}: ${s.code.replace(/\n/g, " ")}`),
      ],
    },
    {
      kind: "benefits",
      id: "details",
      eyebrow: "The details",
      heading: "Open code means the planner can change when you need it to",
      lead: "No feature request that sits for years. If you need something, you or your agent can build it.",
      items: [
        {
          icon: "github",
          title: "Code you can read",
          body: "A TypeScript monorepo on GitHub: Hono API, React web app, Tauri desktop. Point your agent at it and add what you need.",
          href: "https://github.com/ShadowWalker2014/open-sunsama",
        },
        {
          icon: "server",
          title: "Self-host with Docker",
          body: "One command starts the web app, API, MCP server and PostgreSQL on your own box. Your data stays yours.",
          href: "/docs/self-hosting/docker",
        },
        {
          icon: "code",
          title: "REST API with scoped keys",
          body: "Give each script only the scopes it needs. JSON in, JSON out, with the same shape on every route.",
          href: "/docs/api/authentication",
        },
        {
          icon: "monitor",
          title: "Linux, Mac and Windows",
          body: "Desktop apps for all three. Press Cmd+Shift+T in any app to add a task. The web app works in any browser.",
          href: "/download",
        },
        {
          icon: "hourglass",
          title: "Planned vs actual",
          body: "Each task has an estimate. The focus timer logs real minutes, and both are in the API.",
          href: "/features/focus-mode",
        },
        {
          icon: "refresh",
          title: "Live sync",
          body: "A change from a script or an agent shows up on every open tab and device right away.",
        },
      ],
    },
    {
      kind: "custom",
      id: "typical-day",
      eyebrow: "A typical day",
      heading: "Here is how a developer might run a day in Open Sunsama",
      lead: "An example day that mixes the keyboard, a script and two AI agents. Every step uses a real feature.",
      body: dayBody(day),
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Compare",
      heading: "Open Sunsama is the one you can script, self-host and change",
      lead: "Todoist, Sunsama and Akiflow all have an official MCP server now. The difference is who owns the planner.",
      columns: ["Open Sunsama", "Todoist", "Sunsama", "Akiflow"],
      rows: [
        {
          feature: "Time blocking next to meetings",
          cells: [
            { mark: "yes", text: "Drag tasks onto the calendar" },
            { mark: "partial", text: "Calendar layout on paid plans" },
            { mark: "yes", text: "Drag tasks onto the calendar" },
            { mark: "yes", text: "Blocks and time slots" },
          ],
        },
        {
          feature: "Official MCP server",
          cells: [
            { mark: "yes", text: "Hosted, OAuth" },
            { mark: "yes", text: "Hosted" },
            { mark: "yes", text: "Hosted, in Pro" },
            { mark: "yes", text: "Hosted, in Pro" },
          ],
        },
        {
          feature: "Public REST API",
          cells: [
            { mark: "yes", text: "Scoped API keys" },
            "yes",
            { mark: "no", text: "Requested since 2019" },
            { mark: "no", text: "None we could find" },
          ],
        },
        { feature: "Code you can read and change", cells: ["yes", "no", "no", "no"] },
        { feature: "Self-host", cells: [{ mark: "yes", text: "Docker Compose" }, "no", "no", "no"] },
        {
          feature: "Linux desktop app",
          cells: ["yes", "yes", "yes", { mark: "no", text: "Mac and Windows" }],
        },
        {
          feature: "Phone",
          cells: [
            { mark: "partial", text: "Mobile web app" },
            { mark: "yes", text: "iOS and Android" },
            { mark: "yes", text: "iOS and Android" },
            { mark: "yes", text: "iOS and Android" },
          ],
        },
      ],
      sources:
        "Competitor facts come from each app's site and docs: [Todoist downloads](https://www.todoist.com/downloads), [Todoist calendar layout](https://www.todoist.com/help/articles/use-the-calendar-layout-in-todoist-lPHRQTu0o), [Todoist MCP](https://ai.todoist.net/mcp), [Sunsama MCP](https://help.sunsama.com/docs/mcp-model-context-protocol), [Sunsama API request](https://roadmap.sunsama.com/improvements/p/sunsama-api) and [Akiflow](https://akiflow.com/pricing). Checked September 2026. More detail in [task managers with MCP](/blog/best-task-managers-with-mcp).",
    },
    {
      kind: "stats",
      id: "numbers",
      items: [
        { value: "24", label: "MCP tools" },
        { value: "3", label: "Desktop apps" },
        { value: "1", label: "URL for any agent" },
        { live: "github-stars", label: "GitHub stars" },
      ],
    },
  ],

  faqs: {
    heading: "Questions developers ask about Open Sunsama",
    lead: "Something missing? Read the [docs](/docs) or open an issue on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best task manager for developers?",
        answer:
          "We build Open Sunsama, and we think it is the best pick for developers who want control. It is keyboard-first, has a REST API and a hosted MCP server, and you can self-host the code. Pick Todoist if you mostly need a fast list on every device.",
        link: { label: "Time blocking apps for developers", href: "/blog/best-time-blocking-apps-developers" },
      },
      {
        question: "Does Open Sunsama have an API?",
        answer:
          "Yes. A REST API covers tasks, subtasks and time blocks. Create an API key in Settings → API Keys, pick its scopes, and send it in the X-API-Key header.",
        link: { label: "API authentication", href: "/docs/api/authentication" },
      },
      {
        question: "How do I use Open Sunsama with Claude Code or Cursor?",
        answer:
          "In Claude Code, run claude mcp add --transport http open-sunsama https://api.opensunsama.com/mcp and sign in. In Cursor, add the same URL to mcp.json and click Connect.",
        link: { label: "MCP setup guides", href: "/docs/mcp/overview" },
      },
      {
        question: "Is there an MCP task manager that also does time blocking?",
        answer:
          "Yes. Open Sunsama's MCP server has 24 tools for tasks, subtasks, time blocks and your synced meetings. Your agent can see the whole day and block time around your meetings.",
        link: { label: "Task managers with MCP", href: "/blog/best-task-managers-with-mcp" },
      },
      {
        question: "Can I self-host Open Sunsama?",
        answer:
          "Yes. Clone the repo and run docker compose up -d --build. You get the web app, the REST API and the MCP server on your own machine. The prebuilt desktop app can't point at a self-hosted server yet.",
        link: { label: "Docker guide", href: "/docs/self-hosting/docker" },
      },
      {
        question: "Is Open Sunsama open source?",
        answer:
          "The code is public on GitHub. It uses a non-commercial license: you can read it, run it and self-host it for personal use. Companies need a commercial license.",
        link: { label: "See the code", href: "https://github.com/ShadowWalker2014/open-sunsama" },
      },
      {
        question: "Does Open Sunsama integrate with GitHub, Linear or Jira?",
        answer:
          "Not yet. There are no built-in task integrations. You can bring tasks in with a short script against the REST API, or ask your agent to file them over MCP.",
      },
    ],
  },

  related: {
    heading: "Keep exploring",
    lead: "Docs to get connected, features developers use most, and how we compare.",
    links: [
      {
        kind: "docs",
        title: "MCP overview",
        description: "One URL for Claude Code, Cursor, ChatGPT and any MCP client.",
        href: "/docs/mcp/overview",
      },
      {
        kind: "docs",
        title: "Self-host with Docker",
        description: "Run the web app, API and MCP server on your own box.",
        href: "/docs/self-hosting/docker",
      },
      {
        kind: "feature",
        title: "Command palette",
        description: "Cmd+K to find any task, day or action.",
        href: "/features/command-palette",
      },
      {
        kind: "feature",
        title: "AI and MCP",
        description: "Let any agent plan your day, with you in charge.",
        href: "/features/ai-integration",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Todoist",
        description: "A list app, or a planner with a calendar and open code.",
        href: "/alternative/todoist",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Akiflow",
        description: "Keyboard-first planning with a public API.",
        href: "/alternative/akiflow",
      },
      {
        kind: "guide",
        title: "Task managers with MCP in 2026",
        description: "Which to-do apps have a real MCP server, and what it can do.",
        href: "/blog/best-task-managers-with-mcp",
      },
      {
        kind: "guide",
        title: "Time blocking apps for developers",
        description: "Planners compared for coding sessions and deep work.",
        href: "/blog/best-time-blocking-apps-developers",
      },
      {
        kind: "persona",
        title: "For remote workers",
        description: "Plan around meetings in any time zone and log off on time.",
        href: "/for/remote-workers",
      },
    ],
  },

  cta: {
    heading: "Plan tomorrow from your terminal",
    body: "Connect Claude Code or Cursor in one line, script the rest with the API, or run the whole thing on your own server.",
    shot: "mcp-settings",
    shotAlt: "Open Sunsama's MCP settings with the connector URL and setup steps for each AI app",
  },

  software: {
    featureList: [
      "Command palette (Cmd+K) and single-key shortcuts",
      "Public REST API with scoped API keys",
      "Hosted MCP server with 24 tools and OAuth sign-in",
      "Self-hosting with Docker Compose",
      "Drag-and-drop time blocking next to Google, Outlook and iCloud events",
      "Focus mode with planned vs actual time",
      "Desktop apps for Mac, Windows and Linux",
    ],
  },
});
