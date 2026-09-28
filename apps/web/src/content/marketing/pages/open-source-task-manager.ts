/**
 * /open-source-task-manager. Target queries: "open source task manager",
 * "open source task management software", "self hosted task manager",
 * "open source todo app", "open source daily planner", "open source time
 * blocking app". Reader: the self-hoster (personas.md, persona 3).
 *
 * Competitor facts come from each project's license file, README, docs and
 * GitHub releases, checked 24 September 2026 (see the comparison's sources).
 *
 * The default export is the page (prerendered for crawlers). The named export
 * `openSource` holds the extra data the page's own blocks draw (terminal
 * lines, services, endpoints); the words crawlers need are also in each
 * custom section's `body`.
 */

import { defineMarketingPage } from "../types";

export const REPO = "ShadowWalker2014/open-sunsama";
const GITHUB = `https://github.com/${REPO}`;

export const openSource = {
  repo: REPO,
  github: GITHUB,
  licenseUrl: `${GITHUB}/blob/main/LICENSE`,
  licenseName: "Non-commercial",
  licenseContact: "ceo@circo.so",
  language: "TypeScript",

  heroChips: {
    terminal: { command: "docker compose up -d --build", detail: "Web app on :3000 · API on :3001" },
    agent: { title: "Claude connected", detail: "Moved 3 tasks to Friday" },
  },

  selfHost: {
    tabs: [
      {
        id: "install",
        label: "Install",
        lines: [
          `$ git clone ${GITHUB}.git`,
          "$ cd open-sunsama",
          "$ docker compose up -d --build",
          "# Builds the app, starts PostgreSQL and creates the tables",
          "$ open http://localhost:3000",
        ],
      },
      {
        id: "update",
        label: "Update",
        lines: ["$ git pull", "$ docker compose up -d --build", "# The API applies new migrations when it starts"],
      },
      {
        id: "backup",
        label: "Back up",
        lines: [
          "# Back up",
          "$ docker compose exec -T postgres pg_dump -U opensunsama opensunsama | gzip > backup.sql.gz",
          "# Restore",
          "$ gunzip < backup.sql.gz | docker compose exec -T postgres psql -U opensunsama opensunsama",
        ],
      },
    ],
    services: [
      { name: "web", port: ":3000", detail: "The web app you plan in" },
      { name: "api", port: ":3001", detail: "REST API, MCP server and live sync" },
      { name: "postgres", port: "localhost only", detail: "PostgreSQL 16 holds your data" },
      { name: "redis", port: "localhost only", detail: "Relays live updates to open tabs" },
    ],
    needs: ["Docker 20.10+", "Compose 2.24+", "2 GB of RAM"],
    note: "The ready-made desktop apps connect to the hosted service. On your own server, use the web app, or build the desktop app with your API address.",
  },

  extend: {
    endpoints: [
      { method: "GET", path: "/tasks?date=2026-09-24" },
      { method: "POST", path: "/tasks" },
      { method: "PATCH", path: "/tasks/:id" },
      { method: "POST", path: "/tasks/:id/complete" },
      { method: "GET", path: "/time-blocks?date=2026-09-24" },
      { method: "POST", path: "/time-blocks" },
    ],
    scopes: ["tasks:read", "tasks:write", "time-blocks:read", "time-blocks:write", "calendar:read", "user:read", "user:write"],
    prompts: [
      "Plan my afternoon around my meetings.",
      "Move what I didn't finish today to tomorrow.",
      "Block two hours of deep work every morning this week.",
    ],
    toolGroups: [
      { label: "Tasks", count: 9 },
      { label: "Time blocks", count: 7 },
      { label: "Subtasks", count: 5 },
      { label: "Profile", count: 2 },
      { label: "Calendar events (read-only)", count: 1 },
    ],
    codeLines: [
      `$ git clone ${GITHUB}.git`,
      "$ cd open-sunsama",
      "# AGENTS.md maps the code for your agent",
      '$ claude "Add a waiting-on label to tasks"',
      "$ docker compose up -d --build",
      "# Your version now runs on your server",
    ],
  },

  license: {
    allowed: ["Personal use", "Education", "Non-profit groups", "Non-commercial open-source projects", "Evaluation and testing"],
    needsLicense: [
      "For-profit companies using it in production",
      "Products or services sold for profit",
      "Resale for commercial purposes",
    ],
  },

  /** Where the comparison's facts come from. Repos are followed links; sites are nofollow. */
  sources: [
    { name: "Vikunja", repo: "https://github.com/go-vikunja/vikunja", site: "https://vikunja.io" },
    {
      name: "Super Productivity",
      repo: "https://github.com/super-productivity/super-productivity",
      site: "https://super-productivity.com",
    },
    { name: "Tududi", repo: "https://github.com/chrisvel/tududi", site: "https://tududi.com" },
    { name: "Kanboard", repo: "https://github.com/kanboard/kanboard", site: "https://kanboard.org" },
    { name: "Planka", repo: "https://github.com/plankanban/planka", site: "https://planka.app" },
  ],
  checked: "September 24, 2026",
};

export default defineMarketingPage({
  path: "/open-source-task-manager",
  updated: "2026-09-24",
  seo: {
    title: "Open Source Task Manager and Daily Planner",
    description:
      "Open Sunsama is an open-source task manager and daily planner. Time block your day, self-host it with Docker, and let Claude or any AI agent plan with you.",
  },
  breadcrumbs: [{ label: "Open-source task manager" }],

  hero: {
    badge: "Open source",
    eyebrow: "Task manager and daily planner",
    title: "The open-source task manager that plans your day",
    accent: "that plans your day",
    answer:
      "Open Sunsama is an open-source task manager and daily planner. Plan your day on a board, block time next to your meetings, and run it on your own server with one command.",
    media: {
      clip: "week-plan",
      alt: "Tasks dragged between days on the Open Sunsama board",
    },
    secondary: { video: "tour", label: "Watch the 1-minute tour" },
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "Open Sunsama is an open-source task manager you can plan with, self-host and script",
      body: [
        "Open Sunsama is an open-source task manager and daily planner. Your tasks live on a board of days. Drag one onto the calendar to block time for it, right next to your Google, Outlook or iCloud meetings.",
        "The code is public on [GitHub](https://github.com/ShadowWalker2014/open-sunsama). Run it on your own server with [Docker](/docs/self-hosting/docker), or use the hosted app. Either way you get a REST API and an MCP server, so Claude, ChatGPT or any AI agent can plan with you.",
        "The license is non-commercial. You can read it, run it and self-host it for personal use. Companies need a commercial license.",
      ],
      pointsTitle: "In short",
      points: [
        "Plan each day on a kanban board. Unfinished tasks roll over.",
        "Drag tasks onto your calendar to time block the day.",
        "Self-host the app, API and database with one Docker command.",
        "Script it with the REST API, or connect any AI agent over MCP.",
        "Desktop apps for Mac, Windows and Linux, plus the web.",
      ],
    },
    {
      kind: "story",
      id: "product",
      eyebrow: "The whole product",
      heading: "Open Sunsama plans, blocks, focuses and closes out your day",
      lead: "Every clip below is a real recording of the app. The same code runs on the hosted app and on your server.",
      steps: [
        {
          icon: "layout",
          eyebrow: "Plan",
          title: "Pull today's work onto the board",
          body: "Drag tasks from the backlog into Today. Give each one a time estimate, and the day shows how full it is.",
          clip: "plan-day",
          link: { label: "See the kanban board", href: "/features/kanban" },
        },
        {
          icon: "calendar",
          eyebrow: "Time block",
          title: "Drop each task onto the calendar",
          body: "Drag a task next to your meetings, then drag its edge to set how long it takes. You see what fits before the day starts.",
          clip: "time-block",
          link: { label: "How time blocking works", href: "/features/time-blocking" },
        },
        {
          icon: "timer",
          eyebrow: "Focus",
          title: "Work on one task at a time",
          body: "Start focus mode and the timer runs. It tracks real time against your estimate, so tomorrow's plan gets more honest.",
          clip: "focus",
          link: { label: "How focus mode works", href: "/features/focus-mode" },
        },
        {
          icon: "command",
          eyebrow: "Keyboard",
          title: "Find anything with Cmd+K",
          body: "Search any task, jump to any day or run a command without the mouse. Most actions have a shortcut.",
          clip: "command-palette",
          link: { label: "See the command palette", href: "/features/command-palette" },
        },
        {
          icon: "check",
          eyebrow: "Shut down",
          title: "Check off the day and let the rest roll over",
          body: "Tick off what you finished at the end of the day. Anything left moves to tomorrow on its own, so nothing gets lost.",
          clip: "shutdown",
        },
        {
          icon: "lightbulb",
          eyebrow: "Ideas",
          title: "Park someday ideas on boards of their own",
          body: "Ideas boards hold the someday and maybe list, in columns you name. Your daily board stays clean.",
          clip: "ideas",
        },
      ],
    },
    {
      kind: "custom",
      id: "self-host",
      eyebrow: "Own it",
      heading: "One command runs the whole app on your own server",
      lead: "Clone the repo and start Docker Compose. You get the web app, the REST API, the MCP server and a PostgreSQL database.",
      body: [
        "Run git clone https://github.com/ShadowWalker2014/open-sunsama.git, then cd open-sunsama and docker compose up -d --build. The first build takes a few minutes. Then open localhost:3000 and create your account.",
        "It starts four containers: the web app on port 3000, the API on port 3001, PostgreSQL 16 and Redis. The database and Redis listen on localhost only.",
        "Back up with one pg_dump command and restore with psql. To update, run git pull and the same compose command. New database migrations apply when the API starts.",
        "You need Docker 20.10 or newer with Compose 2.24 or newer, and 2 GB of RAM. The [Docker guide](/docs/self-hosting/docker) covers your domain, HTTPS and every setting.",
      ],
    },
    {
      kind: "custom",
      id: "extend",
      eyebrow: "Extend it",
      heading: "Your scripts and your AI agent use the same API as the app",
      lead: "Every task and time block is one HTTP call away. Connect an agent with one URL, or point a coding agent at the repo and change the planner itself.",
      body: [
        "The hosted MCP server lives at https://api.opensunsama.com/mcp. Claude, ChatGPT, Cursor or any MCP client signs in with OAuth and gets 24 tools. A self-hosted server serves the same tools at your own API address plus /mcp. See the [MCP guide](/docs/mcp/overview).",
        "The REST API covers tasks, subtasks and time blocks. Create an API key in Settings, pick its scopes, and send it in the X-API-Key header. See the [API reference](/docs/api/authentication).",
        "The code is public, so a coding agent like Claude Code or Cursor can read it and add the feature you want. The repo ships an AGENTS.md file that maps the code for them.",
      ],
    },
    {
      kind: "custom",
      id: "license",
      eyebrow: "License, plainly",
      heading: "You can read, run and self-host Open Sunsama for personal use",
      lead: "The code is public, and the license is non-commercial. Here is what that means in plain words.",
      body: [
        "Allowed: personal use, education, non-profit groups, non-commercial open-source projects, and evaluation and testing.",
        "Needs a commercial license: for-profit companies using it in production, products or services sold for profit, and resale for commercial purposes. For a company license, email ceo@circo.so.",
        "Because it limits commercial use, it is not open source by the strictest definition. If your company needs a license with no such limit, see Vikunja, Tududi or Super Productivity in the table below. The full text is in the [LICENSE file](https://github.com/ShadowWalker2014/open-sunsama/blob/main/LICENSE).",
      ],
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Compare",
      heading: "Open Sunsama plans your day next to your real meetings",
      lead: "Vikunja, Super Productivity, Tududi, Kanboard and Planka are good projects. Here is where each one fits, so you can choose with clear eyes.",
      columns: ["Open Sunsama", "Vikunja", "Super Productivity", "Tududi", "Kanboard", "Planka"],
      rows: [
        {
          feature: "License",
          cells: [
            { mark: "partial", text: "Non-commercial" },
            { mark: "yes", text: "AGPL-3.0" },
            { mark: "yes", text: "Permissive" },
            { mark: "yes", text: "Permissive" },
            { mark: "yes", text: "Permissive" },
            { mark: "partial", text: "Fair Use License" },
          ],
        },
        {
          feature: "Self-host",
          cells: [
            { mark: "yes", text: "Docker Compose" },
            { mark: "yes", text: "Docker or binary" },
            { mark: "partial", text: "Local app, optional sync server" },
            { mark: "yes", text: "Docker" },
            { mark: "yes", text: "Docker or PHP host" },
            { mark: "yes", text: "Docker" },
          ],
        },
        {
          feature: "Daily planning",
          cells: [
            { mark: "yes", text: "Board of days, rollover" },
            { mark: "partial", text: "Upcoming view" },
            { mark: "yes", text: "Today and Planner views" },
            { mark: "partial", text: "Today view, daily brief" },
            "no",
            "no",
          ],
        },
        {
          feature: "Time blocking",
          cells: [
            { mark: "yes", text: "Drag tasks onto the calendar" },
            "no",
            { mark: "yes", text: "Schedule view" },
            "no",
            "no",
            "no",
          ],
        },
        {
          feature: "Calendar sync",
          cells: [
            { mark: "yes", text: "Google, Outlook, iCloud" },
            { mark: "partial", text: "CalDAV for tasks" },
            { mark: "partial", text: "iCal feeds, read-only" },
            { mark: "partial", text: "CalDAV for tasks" },
            { mark: "partial", text: "iCal feed out" },
            { mark: "no", text: "Calendar view is in Pro" },
          ],
        },
        {
          feature: "API",
          cells: [
            { mark: "yes", text: "REST + API keys" },
            { mark: "yes", text: "REST" },
            { mark: "partial", text: "Local REST (desktop)" },
            { mark: "yes", text: "REST + tokens" },
            { mark: "yes", text: "JSON-RPC" },
            { mark: "yes", text: "REST" },
          ],
        },
        {
          feature: "MCP for AI agents",
          cells: [
            { mark: "yes", text: "Hosted, OAuth, 24 tools" },
            { mark: "partial", text: "Community servers" },
            { mark: "partial", text: "Community plugins" },
            { mark: "yes", text: "Built in, 59 tools" },
            { mark: "no", text: "None found" },
            { mark: "no", text: "None found" },
          ],
        },
        {
          feature: "Phone",
          cells: [
            { mark: "partial", text: "Mobile web app" },
            { mark: "partial", text: "Web app (PWA)" },
            { mark: "yes", text: "Android, iOS" },
            { mark: "partial", text: "Web app (PWA)" },
            { mark: "partial", text: "Mobile web" },
            { mark: "partial", text: "Phone layout in Pro" },
          ],
        },
        {
          feature: "Latest release",
          cells: [
            { text: "v1.0.13, Sep 24, 2026" },
            { text: "v2.6.0, Aug 31, 2026" },
            { text: "v19.1.0, Sep 19, 2026" },
            { text: "v1.5.0, Sep 16, 2026" },
            { text: "v1.2.54, Aug 29, 2026" },
            { text: "v2.2.1, Aug 10, 2026" },
          ],
        },
      ],
      sources:
        "Facts come from each project's license file, README, docs and GitHub releases: Vikunja ([code](https://github.com/go-vikunja/vikunja), [site](https://vikunja.io)), Super Productivity ([code](https://github.com/super-productivity/super-productivity), [site](https://super-productivity.com)), Tududi ([code](https://github.com/chrisvel/tududi), [site](https://tududi.com)), Kanboard ([code](https://github.com/kanboard/kanboard), [site](https://kanboard.org)) and Planka ([code](https://github.com/plankanban/planka), [site](https://planka.app)). Checked September 24, 2026.",
    },
    {
      kind: "stats",
      id: "numbers",
      items: [
        { value: "1", label: "Command to self-host" },
        { value: "24", label: "MCP tools" },
        { value: "3", label: "Desktop apps" },
        { live: "github-stars", label: "GitHub stars" },
      ],
    },
  ],

  faqs: {
    heading: "Questions self-hosters ask about Open Sunsama",
    lead: "Something missing? Read the [docs](/docs) or open an [issue on GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best open-source task manager?",
        answer:
          "We build Open Sunsama, and we think it is the best pick if you want to plan your day: a board of days, time blocking and any AI agent. Pick Vikunja for a Todoist-style list, Super Productivity if you want no server, and Kanboard or Planka for plain kanban.",
        link: { label: "Compare open-source productivity apps", href: "/blog/best-open-source-productivity-apps" },
      },
      {
        question: "Is Open Sunsama really open source?",
        answer:
          "The code is public on GitHub. It uses a non-commercial license: you can read it, run it and self-host it for personal use. Companies need a commercial license.",
        link: { label: "Read the LICENSE file", href: "https://github.com/ShadowWalker2014/open-sunsama/blob/main/LICENSE" },
      },
      {
        question: "What do I need to self-host Open Sunsama?",
        answer:
          "Docker 20.10 or newer with Compose 2.24 or newer, and 2 GB of RAM. On a public server, add a domain and a reverse proxy for HTTPS.",
        link: { label: "Docker guide", href: "/docs/self-hosting/docker" },
      },
      {
        question: "Can I export my data?",
        answer:
          "Yes. When you self-host, your data sits in your own PostgreSQL database, so one pg_dump copies all of it. On the hosted app, the REST API returns your tasks and time blocks as JSON with an API key. There is no one-click export button yet.",
        link: { label: "API reference", href: "/docs/api/authentication" },
      },
      {
        question: "Is there a mobile app?",
        answer:
          "Open Sunsama runs as a mobile web app in your phone's browser and syncs in real time. There is no native phone app yet.",
      },
      {
        question: "Are there desktop apps for Linux?",
        answer:
          "Yes. There are desktop apps for Linux, Mac and Windows, and they update themselves. They connect to the hosted service; for your own server, use the web app or build the desktop app with your API address.",
        link: { label: "Download the desktop app", href: "/download" },
      },
      {
        question: "Can AI agents use my tasks?",
        answer:
          "Yes. Add https://api.opensunsama.com/mcp to Claude, ChatGPT, Cursor or any MCP client and sign in. Your agent gets 24 tools for tasks, subtasks and time blocks. A self-hosted server serves the same thing at your API address plus /mcp.",
        link: { label: "Connect your AI", href: "/docs/mcp/overview" },
      },
      {
        question: "How do I update a self-hosted install?",
        answer:
          "Run git pull, then docker compose up -d --build. The API applies any new database migrations when it starts, so there is no manual step.",
        link: { label: "Updating and backups", href: "/docs/self-hosting/docker" },
      },
    ],
  },

  related: {
    heading: "Keep exploring",
    lead: "Guides to open-source and self-hosted apps, the setup docs, and the features you get.",
    links: [
      {
        kind: "guide",
        title: "Best open-source productivity apps",
        description: "Planners, tasks, notes and calendars, with license and MCP compared.",
        href: "/blog/best-open-source-productivity-apps",
      },
      {
        kind: "guide",
        title: "Open-source Todoist alternatives",
        description: "Eight apps compared on license, sync, API and MCP.",
        href: "/blog/open-source-todoist-alternatives",
      },
      {
        kind: "guide",
        title: "Self-hosted productivity apps",
        description: "Build a stack you own, with backups that work.",
        href: "/blog/self-hosted-productivity-apps",
      },
      {
        kind: "docs",
        title: "Self-host with Docker",
        description: "One command, then your domain, HTTPS and every setting.",
        href: "/docs/self-hosting/docker",
      },
      {
        kind: "docs",
        title: "REST API",
        description: "API keys, scopes and every task and time block endpoint.",
        href: "/docs/api/authentication",
      },
      {
        kind: "docs",
        title: "Connect an AI agent",
        description: "Claude, ChatGPT, Cursor or any MCP client, with one URL.",
        href: "/docs/mcp/overview",
      },
      {
        kind: "feature",
        title: "Time blocking",
        description: "Drag tasks onto your calendar, next to your meetings.",
        href: "/features/time-blocking",
      },
      {
        kind: "persona",
        title: "For developers",
        description: "Keyboard-first planning with an API and any agent.",
        href: "/for/developers",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Sunsama",
        description: "The same daily loop, with code you can read and run.",
        href: "/alternative/sunsama",
      },
    ],
  },

  cta: {
    heading: "Plan tomorrow in a task manager you own",
    body: "Start on the hosted app in a minute, or run it on your own server tonight. Your tasks, your data and your agent, all in one place.",
    shot: "board",
    shotAlt: "The Open Sunsama board with tasks planned across the week",
  },

  software: {
    featureList: [
      "Open-source code on GitHub under a non-commercial license",
      "Self-hosting with Docker Compose",
      "Daily planning on a kanban board of days",
      "Drag-and-drop time blocking",
      "Google Calendar, Outlook and iCloud sync",
      "Focus mode with planned vs actual time",
      "Public REST API with scoped API keys",
      "Hosted MCP server with 24 tools for Claude, ChatGPT and any AI agent",
      "Desktop apps for Mac, Windows and Linux",
    ],
  },
});
