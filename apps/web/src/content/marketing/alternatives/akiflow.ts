/**
 * /alternative/akiflow. Target queries: "akiflow alternative" and
 * "open source akiflow alternative". Akiflow facts checked September 2026 on
 * akiflow.com/pricing and akiflow.com/mcp (see the comparison sources), and in
 * the blog post akiflow-alternatives.
 */

import { defineMarketingPage } from "../types";
import { giveUpSection, LICENSE_FAQ, LICENSE_GIVE_UP, verdictSection, type AlternativeExtras } from "./shared";

const verdict: AlternativeExtras["verdict"] = {
  rival: "Akiflow",
  switchIf: [
    "You drag tasks onto your calendar by hand, and want to own the app you do it in.",
    "You plan with Claude, ChatGPT or Cursor, and want an agent that can read, write and even extend your planner.",
    "You want to self-host, or you need a public REST API for your own scripts.",
    "You work on Linux. Open Sunsama has a Linux desktop app, and Akiflow does not.",
    "Your inbox fills faster than you can plan, and you want a shorter, calmer list.",
  ],
  stayIf: [
    "You want Slack, Gmail and your other tools to drop tasks into one inbox on their own.",
    "You plan from your phone a lot and want native apps for iOS and Android.",
    "You like Akiflow's daily planning ritual and its Aki assistant.",
    "Your team plans together in Akiflow.",
  ],
  switchLink: { label: "See the daily loop", href: "#how-it-works" },
  stayLink: { label: "Compare 7 Akiflow alternatives", href: "/blog/akiflow-alternatives" },
};

const giveUps: AlternativeExtras["giveUps"] = [
  {
    title: "A universal inbox",
    body: "Akiflow pulls tasks from Slack, Gmail, Linear and more into one list. Open Sunsama syncs your calendars only. Other tasks come in by hand, through the REST API, or from your AI agent.",
  },
  {
    title: "Native phone apps",
    body: "Akiflow has apps for iOS and Android. Open Sunsama runs in your phone's browser as a mobile web app, and has desktop apps for Mac, Windows and Linux.",
  },
  {
    title: "A guided planning ritual",
    body: "Akiflow walks you through a daily plan. Open Sunsama gives you the board and the calendar, and you set your own rhythm. Or ask your agent to run it.",
  },
  {
    title: "An auto-scheduler",
    body: "Akiflow's Schedule Optimizer can place tasks for you. In Open Sunsama you place each block yourself, or ask your agent to do it.",
  },
  {
    title: "Team features",
    body: "Akiflow's Pro plan includes team features. Open Sunsama is built for one person's day.",
  },
  {
    title: "A one-click import",
    body: "There is no Akiflow importer yet. Move this week's tasks by hand, or paste your list into Claude and ask it to create them.",
  },
  LICENSE_GIVE_UP,
];

export const extras: AlternativeExtras = { verdict, giveUps };

export default defineMarketingPage({
  path: "/alternative/akiflow",
  updated: "2026-09-24",
  seo: {
    title: "Akiflow Alternative: Open Source, Built for AI Agents",
    description:
      "Open Sunsama is an open source Akiflow alternative. Plan on a board of days, drag tasks onto your calendar, and let Claude, ChatGPT or any AI agent help.",
  },
  breadcrumbs: [{ label: "Alternatives" }, { label: "Akiflow" }],

  hero: {
    badge: "Compare",
    eyebrow: "Open Sunsama vs Akiflow",
    title: "The open-source Akiflow alternative",
    accent: "Akiflow alternative",
    answer:
      "Open Sunsama is an open-source Akiflow alternative. Plan your day on a board, drag tasks onto your calendar, and let Claude, ChatGPT or any AI agent help. The code is public, so you can self-host it.",
    media: {
      clip: "plan-day",
      alt: "Tasks dragged from the backlog into Today on Open Sunsama's board of days",
    },
    chips: [
      { tone: "agent", title: "Claude connected", detail: "Turned 6 Slack to-dos into tasks" },
      { tone: "block", title: "Reply to design review", detail: "10:00 - 10:45 AM" },
      { tone: "timer", title: "18:40 / 45:00", detail: "Focus" },
    ],
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "Open Sunsama is the Akiflow alternative you own and any agent can run",
      body: [
        "Open Sunsama is an open-source Akiflow alternative. Your days sit on a board, and you drag tasks onto the calendar next to your meetings. Any AI agent can plan with you over MCP.",
        "We build Open Sunsama, so we put it first — here is why, and where Akiflow fits better.",
        "Akiflow's strength is its inbox. It pulls tasks from Slack, Gmail and other tools into one list. Open Sunsama has no inbox like that. Instead, you own the app: read the code, self-host it, or build on its REST API.",
      ],
      pointsTitle: "In short",
      points: [
        "Keyboard-first daily planning on a board of days.",
        "Time blocking next to Google, Outlook and iCloud events.",
        "One MCP URL for Claude, ChatGPT, Cursor or any agent.",
        "Public code, self-hosting and a REST API with API keys.",
        "Honest gaps: no universal inbox and no native phone app.",
      ],
    },
    verdictSection(verdict, {
      heading: "Open Sunsama fits people who plan by hand; Akiflow fits people who capture from many tools",
      lead: "Both apps let you drag a task onto your calendar with a few keys. The real choice is an inbox for every tool, or a planner you own.",
    }),
    {
      kind: "story",
      id: "how-it-works",
      eyebrow: "The daily loop",
      heading: "Your Akiflow day maps onto four moves in Open Sunsama",
      lead: "Plan, block, focus, and do it all from the keyboard. Every clip below is a real recording of the app.",
      steps: [
        {
          icon: "layout",
          eyebrow: "1 · Plan",
          title: "Pull today's tasks onto a board of days",
          body: "Your backlog sits next to Today and Tomorrow. Drag the tasks you will do into Today. Anything you don't finish rolls over to tomorrow.",
          clip: "plan-day",
          link: { label: "See the kanban board", href: "/features/kanban" },
        },
        {
          icon: "calendar",
          eyebrow: "2 · Block",
          title: "Drag each task onto your calendar",
          body: "Drop a task into a free slot next to your meetings, then drag its edge to set the length. Google, Outlook and iCloud events share the same view.",
          clip: "time-block",
          link: { label: "How time blocking works", href: "/features/time-blocking" },
        },
        {
          icon: "timer",
          eyebrow: "3 · Focus",
          title: "Work one task at a time",
          body: "Focus mode hides everything but the task in front of you. The timer tracks real time, so you see planned vs actual.",
          clip: "focus",
          link: { label: "How focus mode works", href: "/features/focus-mode" },
        },
        {
          icon: "command",
          eyebrow: "4 · Move fast",
          title: "Do it all from the keyboard",
          body: "Press Cmd+K to find a task, jump to a day or run a command. If you liked Akiflow's speed, you keep it.",
          clip: "command-palette",
          link: { label: "See the command palette", href: "/features/command-palette" },
        },
      ],
    },
    {
      kind: "agent",
      id: "ai",
      eyebrow: "AI native",
      heading: "Any AI agent can plan your day in Open Sunsama",
      lead: "Paste one URL into Claude, ChatGPT, Cursor or any MCP client, then sign in. Your agent sees your meetings and tasks together and plans around them.",
      body: [
        "Akiflow has its own MCP connector now, and it works well. It launched in June 2026 and comes with the Pro plan.",
        "The difference is what sits behind the URL. Open Sunsama's code is public, so your agent can read it and even add the feature you want. You can run all of it, agent access included, on your own server.",
        "Your agent gets 24 tools. It can read your calendar events but can't change them. It adds and moves your tasks and time blocks.",
      ],
      prompts: [
        "Here are my Slack to-dos. Turn them into tasks for this week.",
        "Plan my day around my meetings. Put my top three tasks in focus blocks.",
        "Yesterday went off track. Move what's left into free slots today.",
      ],
      tools: ["create_task", "get_schedule_for_day", "list_tasks", "create_time_block", "schedule_task"],
      clip: "ai-plan",
      clipCaption: "Claude plans the afternoon over MCP. Tasks and time blocks appear live.",
      links: [
        { label: "Claude setup", href: "/docs/mcp/claude" },
        { label: "ChatGPT setup", href: "/docs/mcp/chatgpt" },
        { label: "Cursor setup", href: "/docs/mcp/cursor" },
        { label: "Task managers with MCP", href: "/blog/best-task-managers-with-mcp" },
      ],
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Feature by feature",
      heading: "Open Sunsama matches Akiflow's planning and adds the code, the API and self-hosting",
      lead: "Akiflow leads on capture and phone apps. Open Sunsama leads on ownership. Here is each feature side by side.",
      columns: ["Open Sunsama", "Akiflow"],
      rows: [
        {
          feature: "How you plan",
          cells: [{ text: "Board of days, then drag to the calendar" }, { text: "Universal inbox, then drag to the calendar" }],
        },
        { feature: "Time blocking on your calendar", cells: ["yes", "yes"] },
        {
          feature: "Calendars",
          cells: [
            { mark: "yes", text: "Google, Outlook, iCloud" },
            { mark: "partial", text: "Google, Outlook" },
          ],
        },
        {
          feature: "Keyboard-first",
          cells: [
            { mark: "yes", text: "Cmd+K palette" },
            { mark: "yes", text: "Command bar" },
          ],
        },
        { feature: "Daily planning ritual", cells: ["no", "yes"] },
        {
          feature: "Built-in task integrations",
          cells: [
            { mark: "no", text: "Via REST API or your agent" },
            { mark: "yes", text: "Slack, Gmail, Linear and more" },
          ],
        },
        {
          feature: "AI assistant",
          cells: [{ text: "Bring any agent" }, { text: "Aki" }],
        },
        {
          feature: "MCP server for AI agents",
          cells: [
            { mark: "yes", text: "Hosted, 24 tools" },
            { mark: "yes", text: "Hosted, 19 actions" },
          ],
        },
        {
          feature: "Public REST API",
          cells: [
            { mark: "yes", text: "API keys" },
            { mark: "no", text: "None found" },
          ],
        },
        { feature: "Code you can read and self-host", cells: ["yes", "no"] },
        {
          feature: "Desktop apps",
          cells: [
            { mark: "yes", text: "Mac, Windows, Linux" },
            { mark: "partial", text: "Mac, Windows" },
          ],
        },
        {
          feature: "Phone",
          cells: [
            { mark: "partial", text: "Mobile web app" },
            { mark: "yes", text: "iOS and Android" },
          ],
        },
        { feature: "Team features", cells: ["no", "yes"] },
      ],
      sources:
        "Akiflow facts come from its [pricing page](https://akiflow.com/pricing), its [MCP page](https://akiflow.com/mcp) and its help docs. Checked September 2026.",
    },
    giveUpSection(giveUps, {
      heading: "Leaving Akiflow costs you its inbox, its phone apps and its ritual",
      lead: "Akiflow is a good app. Here is what it does that Open Sunsama doesn't, so you can choose with clear eyes.",
    }),
    {
      kind: "steps",
      id: "switch",
      eyebrow: "How to switch",
      heading: "You can switch from Akiflow in three steps",
      lead: "Plan your first day in Open Sunsama the same morning you sign up.",
      steps: [
        {
          title: "Create an account, or self-host",
          body: "Sign up on the web or [download the desktop app](/download). Prefer your own server? Follow the [Docker guide](/docs/self-hosting/docker).",
        },
        {
          title: "Connect your calendars",
          body: "Add Google Calendar, Outlook or iCloud in Settings. Your meetings show up next to your tasks, so you see what really fits.",
        },
        {
          title: "Move this week's tasks",
          body: "There is no Akiflow import yet. Add this week's tasks by hand, or paste your list into Claude and ask it to create them. Keep Akiflow until you have planned five real days.",
        },
      ],
    },
  ],

  faqs: {
    heading: "Questions before you switch from Akiflow",
    lead: "Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best Akiflow alternative?",
        answer:
          "We build Open Sunsama, and we think it is the best pick for most people. It is an open-source daily planner with time blocking that any AI agent can run. Pick Sunsama for a calm, guided ritual, or Morgen for a task hub.",
        link: { label: "Compare 7 Akiflow alternatives", href: "/blog/akiflow-alternatives" },
      },
      {
        question: "Is there an open-source Akiflow alternative?",
        answer:
          "Yes. Open Sunsama's code is public on GitHub, and you can self-host it with Docker for personal use. It covers the board, time blocking, focus mode and calendar sync.",
        link: { label: "Self-hosting guide", href: "/docs/self-hosting/docker" },
      },
      {
        question: "Does Akiflow have an MCP server or an API?",
        answer:
          "Akiflow launched an official MCP connector in June 2026, included in its Pro plan. We found no public REST API. Open Sunsama has a hosted MCP server and a REST API with API keys.",
      },
      {
        question: "Can I import my Akiflow tasks into Open Sunsama?",
        answer:
          "Not directly yet. Move this week's tasks by hand, or paste your list into Claude or ChatGPT and let it create the tasks over MCP.",
        link: { label: "Connect your AI", href: "/docs/mcp/overview" },
      },
      {
        question: "Does Open Sunsama work on Linux?",
        answer: "Yes. There are desktop apps for Mac, Windows and Linux, plus the web app. Akiflow has no Linux app.",
        link: { label: "Download", href: "/download" },
      },
      {
        question: "Does Open Sunsama have a phone app?",
        answer:
          "It runs in your phone's browser as a mobile web app and syncs in real time. There is no native app for iOS or Android yet.",
      },
      LICENSE_FAQ,
    ],
  },

  related: {
    heading: "Keep comparing",
    lead: "Other apps people weigh against Akiflow, the features that matter most, and our longer guides.",
    links: [
      {
        kind: "guide",
        title: "7 best Akiflow alternatives in 2026",
        description: "Calm rituals, AI scheduling, task hubs and open source, compared.",
        href: "/blog/akiflow-alternatives",
      },
      {
        kind: "guide",
        title: "Akiflow vs Sunsama vs Motion",
        description: "Three popular planners, head to head.",
        href: "/blog/akiflow-vs-sunsama-vs-motion",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Sunsama",
        description: "The same daily loop, with code you can read and run.",
        href: "/alternative/sunsama",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Motion",
        description: "Plan by hand, or with your agent, instead of an auto-scheduler.",
        href: "/alternative/motion",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Todoist",
        description: "Plan when, not just what.",
        href: "/alternative/todoist",
      },
      {
        kind: "feature",
        title: "Time blocking",
        description: "Drag tasks onto your calendar next to your meetings.",
        href: "/features/time-blocking",
      },
      {
        kind: "feature",
        title: "Command palette",
        description: "Cmd+K to find any task or jump to any day.",
        href: "/features/command-palette",
      },
      {
        kind: "feature",
        title: "AI and MCP",
        description: "Let Claude, ChatGPT or any agent plan your day.",
        href: "/features/ai-integration",
      },
    ],
  },

  cta: {
    heading: "Plan tomorrow in Open Sunsama",
    body: "Drag your tasks onto a board, block time on your calendar, and let the AI agent you already use help run the day.",
    shot: "calendar-week",
    shotAlt: "Open Sunsama week calendar with time blocks next to meetings",
  },

  software: {
    featureList: [
      "Kanban board of days with a backlog",
      "Drag-and-drop time blocking",
      "Google Calendar, Outlook and iCloud sync",
      "Focus mode with planned vs actual time",
      "Cmd+K command palette",
      "Hosted MCP server for Claude, ChatGPT and any AI agent",
      "Public REST API",
      "Desktop apps for Mac, Windows and Linux",
    ],
  },
});
