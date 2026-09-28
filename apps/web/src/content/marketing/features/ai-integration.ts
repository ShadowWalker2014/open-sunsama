/**
 * /features/ai-integration. Target queries: "AI daily planner", "planner that
 * works with Claude", "planner that works with ChatGPT", "MCP task manager".
 *
 * The tool list mirrors mcp/src/tools/*.ts and the read-only / destructive
 * flags in mcp/src/lib/define-tool.ts (24 tools). Update both when a tool is
 * added. Competitor facts come from /blog/best-task-managers-with-mcp and
 * each app's docs, checked September 2026.
 */

import { defineMarketingPage } from "../types";

export type ToolAccess = "read" | "write" | "delete";

export interface McpTool {
  name: string;
  does: string;
  access: ToolAccess;
}

export interface McpToolGroup {
  title: string;
  note: string;
  tools: McpTool[];
}

export const TOOL_GROUPS: McpToolGroup[] = [
  {
    title: "Tasks",
    note: "Your days and your backlog.",
    tools: [
      { name: "list_tasks", does: "List tasks for a day, a range of days or the backlog", access: "read" },
      { name: "get_task", does: "Read one task with its notes, estimate and real time", access: "read" },
      { name: "create_task", does: "Add a task with a date, estimate and priority", access: "write" },
      { name: "update_task", does: "Change the title, notes, date, estimate, real time or priority", access: "write" },
      { name: "schedule_task", does: "Move a task to another day or back to the backlog", access: "write" },
      { name: "reorder_tasks", does: "Set the order of a day's tasks", access: "write" },
      { name: "complete_task", does: "Check a task off", access: "write" },
      { name: "uncomplete_task", does: "Reopen a done task", access: "write" },
      { name: "delete_task", does: "Delete a task", access: "delete" },
    ],
  },
  {
    title: "Time blocks",
    note: "Your plan on the calendar.",
    tools: [
      { name: "get_schedule_for_day", does: "Meetings and time blocks for one day, in one call", access: "read" },
      { name: "list_time_blocks", does: "List blocks for a day, a range or one task", access: "read" },
      { name: "get_time_block", does: "Read one block", access: "read" },
      { name: "create_time_block", does: "Block time on the calendar", access: "write" },
      { name: "update_time_block", does: "Move, resize or rename a block", access: "write" },
      { name: "link_task_to_time_block", does: "Tie a block to its task", access: "write" },
      { name: "delete_time_block", does: "Delete a block", access: "delete" },
    ],
  },
  {
    title: "Subtasks",
    note: "The checklist inside each task.",
    tools: [
      { name: "list_subtasks", does: "List a task's subtasks", access: "read" },
      { name: "create_subtask", does: "Add a step to a task", access: "write" },
      { name: "toggle_subtask", does: "Check or uncheck a step", access: "write" },
      { name: "update_subtask", does: "Rename or reorder a step", access: "write" },
      { name: "delete_subtask", does: "Delete a step", access: "delete" },
    ],
  },
  {
    title: "Calendar events",
    note: "From Google, Outlook and iCloud. Read-only.",
    tools: [
      {
        name: "list_calendar_events",
        does: "Meetings for a day or range: title, time, calendar and place. Never attendees or notes.",
        access: "read",
      },
    ],
  },
  {
    title: "Profile",
    note: "So times land in your time zone.",
    tools: [
      { name: "get_user_profile", does: "Read your name, time zone and settings", access: "read" },
      { name: "update_user_profile", does: "Change your name, time zone or theme", access: "write" },
    ],
  },
];

export const ACCESS_LABEL: Record<ToolAccess, string> = {
  read: "Reads",
  write: "Changes",
  delete: "Deletes, asks first",
};

export default defineMarketingPage({
  path: "/features/ai-integration",
  updated: "2026-09-24",
  seo: {
    title: "AI Daily Planner That Works With Claude and ChatGPT",
    description:
      "Open Sunsama is an AI daily planner and MCP task manager. Paste one URL into Claude, ChatGPT or Cursor, sign in, and your agent plans tasks and time blocks.",
  },
  breadcrumbs: [{ label: "Features", href: "/#features" }, { label: "AI and MCP" }],

  hero: {
    badge: "Feature",
    eyebrow: "AI and MCP",
    title: "The AI daily planner that works with any agent",
    accent: "works with any agent",
    answer:
      "Open Sunsama is an AI daily planner you run with the agent you already use. Paste one URL into Claude, ChatGPT, Cursor or any MCP client, sign in, and ask it to plan your day.",
    media: {
      clip: "ai-plan",
      alt: "Claude plans the afternoon over MCP while tasks and time blocks appear live in Open Sunsama",
    },
    chips: [
      { tone: "agent", title: "Claude connected", detail: "Blocked 3 tasks around your meetings" },
      { tone: "block", title: "Deep work: Q4 roadmap", detail: "9:30 - 11:00 AM" },
      { tone: "timer", title: "24 tools", detail: "Tasks, time blocks, meetings" },
    ],
    secondary: { video: "ai", label: "Watch the AI demo" },
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "An AI daily planner here means your own agent plans with your real data",
      body: [
        "Open Sunsama is an AI daily planner that works with Claude, ChatGPT, Cursor and any other MCP client. There is no AI of our own to learn. You connect the agent you already talk to.",
        "It is also an MCP task manager. One hosted server gives your agent 24 tools for tasks, subtasks, time blocks and your synced meetings.",
        "You stay in charge. Every change shows up live in the app, calendar events are read-only, and you can cut off an agent in one click.",
      ],
      pointsTitle: "In short",
      points: [
        "One URL: https://api.opensunsama.com/mcp",
        "Works in Claude, ChatGPT, Claude Code, Cursor and VS Code.",
        "24 tools for tasks, subtasks, time blocks and meetings.",
        "OAuth sign-in: your agent never sees your password.",
        "Meetings are read-only. Deletes are flagged, so apps ask first.",
      ],
    },
    {
      kind: "agent",
      id: "ask",
      eyebrow: "Try it",
      heading: "Paste one URL, sign in, then ask your agent to plan your day",
      lead: "Your agent reads your tasks and meetings together, then builds the plan in the app while you watch.",
      body: [
        "Ask in plain words. The agent calls the tools it needs, and each task and block appears on your board and calendar right away.",
        "Don't like a block? Drag it somewhere else, or tell the agent. It is your plan, and the app is the source of truth.",
      ],
      prompts: [
        "Plan my day around my meetings. Put my top three tasks in focus blocks.",
        "Move everything I didn't finish today to tomorrow.",
        "Add subtasks to the launch task: write tests, update docs, deploy to staging.",
      ],
      tools: ["get_schedule_for_day", "list_tasks", "create_time_block", "link_task_to_time_block", "schedule_task"],
      links: [
        { label: "Claude setup", href: "/docs/mcp/claude" },
        { label: "ChatGPT setup", href: "/docs/mcp/chatgpt" },
        { label: "Cursor setup", href: "/docs/mcp/cursor" },
        { label: "Plan your day with Claude", href: "/blog/plan-your-day-with-claude" },
      ],
    },
    {
      kind: "media-rows",
      id: "connect",
      eyebrow: "Connect",
      heading: "You approve every agent on Open Sunsama's own page",
      lead: "Connecting takes about a minute. There is no API key to copy and no config file to edit.",
      rows: [
        {
          title: "Claude: add a custom connector",
          body: [
            "In Claude, open **Settings → Customize → Connectors** and click **Add**. Paste the URL, click **Connect**, sign in and click **Allow access**.",
            "It works in claude.ai, Claude Desktop and the Claude mobile apps. Claude Code needs one command.",
          ],
          media: {
            shot: "consent-claude",
            alt: "Open Sunsama consent screen: Claude asks to view and edit tasks, subtasks, time blocks and your profile, and to view meetings from your connected calendars",
            caption: "You allow Claude on Open Sunsama's page. Claude never sees your password.",
          },
          link: { label: "Claude setup guide", href: "/docs/mcp/claude" },
        },
        {
          title: "ChatGPT: add it as a plugin",
          body: [
            "Turn on developer mode in ChatGPT settings. Then go to Plugins, click **+**, paste the URL and click **Create**.",
            "Developer mode is on paid ChatGPT plans, on the web. OpenAI's docs say ChatGPT asks you before write actions.",
          ],
          media: {
            shot: "consent-chatgpt",
            alt: "Open Sunsama consent screen: ChatGPT asks to view and edit tasks, subtasks, time blocks and your profile, and to view meetings from your connected calendars",
            caption: "The same screen for ChatGPT lists what it will be able to reach.",
          },
          link: { label: "ChatGPT setup guide", href: "/docs/mcp/chatgpt" },
        },
        {
          title: "See and cut off every agent in Settings",
          body: [
            "**Settings → MCP** has the URL and the steps for each app, ready to copy. Below them is every agent you allowed, with when it was last used.",
            "Click **Disconnect** and that agent loses access at once.",
          ],
          media: {
            shot: "mcp-settings",
            alt: "Open Sunsama Settings, MCP page with the connector URL, setup tabs for each AI app and the connected apps list",
            caption: "Settings → MCP: the URL, setup steps and every connected app.",
          },
        },
      ],
    },
    {
      kind: "custom",
      id: "tools",
      eyebrow: "All 24 tools",
      heading: "Your agent gets 24 tools, and your meetings stay read-only",
      lead: "Each tool is marked read, change or delete. Apps like Claude and ChatGPT use those marks to ask you before a delete.",
      body: TOOL_GROUPS.map(
        (group) =>
          `**${group.title}** (${group.tools.length}). ${group.note} ${group.tools
            .map((tool) => `${tool.name}: ${tool.does.charAt(0).toLowerCase()}${tool.does.slice(1)}`)
            .join("; ")}.`
      ),
    },
    {
      kind: "benefits",
      id: "safety",
      eyebrow: "Security and control",
      heading: "Your agent gets only what you allow, and you can take it back",
      lead: "An agent with your calendar needs clear limits. These are ours.",
      items: [
        {
          icon: "shield",
          title: "OAuth sign-in",
          body: "You sign in on Open Sunsama's page. The agent gets a token, never your password.",
        },
        {
          icon: "clock",
          title: "Short-lived tokens",
          body: "Access tokens expire after one hour and refresh on their own while the app stays allowed.",
        },
        {
          icon: "calendar",
          title: "Meetings are read-only",
          body: "Your agent can't create, move or cancel meetings. It never sees attendees or notes.",
          href: "/features/calendar-sync",
        },
        {
          icon: "check",
          title: "Deletes are flagged",
          body: "Delete tools are marked destructive, so Claude and ChatGPT ask you before they run.",
        },
        {
          icon: "link",
          title: "One-click disconnect",
          body: "Cut off any agent in Settings → MCP. Its access ends right away.",
        },
        {
          icon: "github",
          title: "Code you can read",
          body: "The server is open source. Read every tool, or self-host the whole app with Docker.",
          href: "/docs/self-hosting/docker",
        },
      ],
    },
    {
      kind: "stats",
      id: "numbers",
      items: [
        { value: "24", label: "MCP tools" },
        { value: "1", label: "URL for any agent" },
        { value: "3", label: "Calendar providers" },
        { live: "github-stars", label: "GitHub stars" },
      ],
    },
    {
      kind: "steps",
      id: "setup",
      eyebrow: "Set it up",
      heading: "You can connect any AI app in three steps",
      lead: "The steps are the same everywhere. Only the menu names change.",
      steps: [
        {
          title: "Copy the URL",
          body: "Copy **https://api.opensunsama.com/mcp**. It is also in Settings → MCP in the app.",
        },
        {
          title: "Add it to your AI app",
          body: "Follow the guide for [Claude](/docs/mcp/claude), [ChatGPT](/docs/mcp/chatgpt), [Claude Desktop](/docs/mcp/claude-desktop), [Cursor](/docs/mcp/cursor) or [any other client](/docs/mcp/local-server).",
        },
        {
          title: "Sign in and allow access",
          body: "Your app opens Open Sunsama's sign-in page. Click **Allow access**, then ask it to plan your day.",
        },
      ],
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Compare",
      heading: "Open Sunsama gives any agent your tasks, time blocks and meetings in one server",
      lead: "Sunsama, Akiflow and Todoist run official MCP servers too. Motion has only community-built ones. Here is what each lets your agent do.",
      columns: ["Open Sunsama", "Sunsama", "Motion", "Akiflow", "Todoist"],
      rows: [
        {
          feature: "Official hosted MCP server",
          cells: [
            "yes",
            "yes",
            { mark: "no", text: "Community-built only" },
            "yes",
            "yes",
          ],
        },
        {
          feature: "What your agent can reach",
          cells: [
            { text: "Tasks, subtasks, time blocks, meetings" },
            { text: "Tasks, notes, channels, comments" },
            { text: "Depends on the tool" },
            { text: "Tasks, calendar, time slots, meeting notes" },
            { text: "Tasks, projects, activity" },
          ],
        },
        {
          feature: "Reads your meetings",
          cells: [
            { mark: "yes", text: "Read-only" },
            { text: "Not checked" },
            { text: "Depends on the tool" },
            "yes",
            { mark: "no", text: "Add a calendar connector" },
          ],
        },
        {
          feature: "In ChatGPT's plugin directory",
          cells: [
            { mark: "no", text: "Needs developer mode" },
            "yes",
            { text: "Not checked" },
            { text: "Not checked" },
            { text: "Not checked" },
          ],
        },
        { feature: "Public REST API", cells: ["yes", "no", "yes", { mark: "no", text: "None listed" }, "yes"] },
        { feature: "Code you can read and self-host", cells: ["yes", "no", "no", "no", "no"] },
      ],
      sources:
        "Competitor facts come from each company's MCP docs, summed up in our [MCP comparison](/blog/best-task-managers-with-mcp): [Sunsama MCP](https://help.sunsama.com/docs/mcp-model-context-protocol), [Motion API](https://docs.usemotion.com/), [Akiflow MCP](https://akiflow.com/mcp) and [Todoist MCP](https://www.todoist.com/help/todoist/todoist-and-ai/connect-todoist-to-an-ai-assistant-xMSzFfHng). Checked September 2026.",
    },
  ],

  faqs: {
    heading: "Questions about AI and MCP",
    lead: "Something missing? Read the [MCP docs](/docs/mcp/overview) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best AI daily planner?",
        answer:
          "We build Open Sunsama, and we think it is the best pick for most people. It works with the AI you already use, sees your tasks and meetings together, and keeps you in control. Pick Motion if you want AI to schedule every task without asking.",
        link: { label: "Best task managers with MCP", href: "/blog/best-task-managers-with-mcp" },
      },
      {
        question: "What is an MCP task manager?",
        answer:
          "It is a task app with an MCP server: a web address your AI app connects to so it can read and change your tasks. MCP is the open standard that Claude, ChatGPT, Cursor and many other apps speak.",
      },
      {
        question: "Does Open Sunsama work with Claude?",
        answer:
          "Yes. Add the URL as a custom connector in claude.ai, Claude Desktop or the Claude mobile apps, then sign in. Claude Code needs one command. Custom connectors work on every Claude plan.",
        link: { label: "Claude setup", href: "/docs/mcp/claude" },
      },
      {
        question: "Can ChatGPT plan my day?",
        answer:
          "Yes. Turn on developer mode, add the URL as a plugin and sign in. Developer mode is on paid ChatGPT plans, on the web.",
        link: { label: "Plan your day with ChatGPT", href: "/blog/plan-your-day-with-chatgpt" },
      },
      {
        question: "Can the AI see or change my meetings?",
        answer:
          "It can see them, but not change them. Your agent reads each meeting's title, time, calendar and place, never attendees or notes. It can't create, move or cancel a meeting.",
      },
      {
        question: "Is it safe to let an AI edit my planner?",
        answer:
          "You sign in with OAuth, so the agent never sees your password. Delete tools are flagged so your AI app asks first, and you can disconnect any agent in Settings → MCP.",
      },
      {
        question: "Can I use a local model or my own scripts?",
        answer:
          "Yes. Run the local MCP server with an API key for any local client, or call the public REST API from your own code.",
        link: { label: "Local server and API keys", href: "/docs/mcp/local-server" },
      },
    ],
  },

  related: {
    heading: "Keep exploring",
    lead: "What your agent can plan, how the servers compare, and step-by-step guides.",
    links: [
      {
        kind: "feature",
        title: "Time blocking",
        description: "The calendar your agent fills with blocks.",
        href: "/features/time-blocking",
      },
      {
        kind: "feature",
        title: "Calendar sync",
        description: "The meetings your agent plans around.",
        href: "/features/calendar-sync",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Sunsama",
        description: "Both have MCP. Only one has code you can run.",
        href: "/alternative/sunsama",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Motion",
        description: "Your agent on request, or an auto-scheduler.",
        href: "/alternative/motion",
      },
      {
        kind: "persona",
        title: "For developers",
        description: "An API, an MCP server and an agent in your editor.",
        href: "/for/developers",
      },
      {
        kind: "guide",
        title: "Plan your day with Claude",
        description: "The setup and the prompts, step by step.",
        href: "/blog/plan-your-day-with-claude",
      },
      {
        kind: "guide",
        title: "Plan your day with ChatGPT",
        description: "Developer mode, the plugin and the prompts.",
        href: "/blog/plan-your-day-with-chatgpt",
      },
      {
        kind: "guide",
        title: "Best task managers with MCP",
        description: "Every official server, side by side.",
        href: "/blog/best-task-managers-with-mcp",
      },
      {
        kind: "docs",
        title: "MCP docs",
        description: "The URL, sign-in and every client.",
        href: "/docs/mcp/overview",
      },
    ],
  },

  cta: {
    heading: "Connect your AI and plan tomorrow tonight",
    body: "Paste one URL into the agent you already use, sign in, and ask it to plan your day. Every block shows up on your calendar, where you can move it.",
    shot: "mcp-settings",
    shotAlt: "Open Sunsama Settings, MCP page with the connector URL and the connected AI apps",
  },

  software: {
    featureList: [
      "Hosted MCP server at https://api.opensunsama.com/mcp",
      "24 MCP tools for tasks, subtasks, time blocks and calendar events",
      "OAuth 2.1 sign-in for Claude, ChatGPT, Cursor and any MCP client",
      "Read-only access to Google, Outlook and iCloud events",
      "Local MCP server with API keys",
      "Public REST API",
      "Open source code you can self-host",
    ],
  },
});
