/**
 * /alternative/motion. Target queries: "motion alternative" and
 * "open source motion alternative". Motion facts checked September 2026 on
 * usemotion.com (pricing, API docs, help center) and in the blog posts
 * motion-alternatives and best-task-managers-with-mcp.
 */

import { defineMarketingPage } from "../types";
import { giveUpSection, LICENSE_FAQ, LICENSE_GIVE_UP, verdictSection, type AlternativeExtras } from "./shared";

const verdict: AlternativeExtras["verdict"] = {
  rival: "Motion",
  switchIf: [
    "You stopped trusting a calendar that keeps moving, and want to know why each block is where it is.",
    "You want AI help on request: ask Claude or ChatGPT to plan, then drag anything it gets wrong.",
    "You want to self-host, or read the code behind your planner.",
    "You work on Linux. Open Sunsama has a Linux desktop app.",
    "You need a planner for your own day, not a project tool for a team.",
  ],
  stayIf: [
    "You want software to place every task and fix the day when plans change.",
    "You run team projects, deadlines and workloads in one app.",
    "You plan from your phone and want native apps for iOS and Android.",
  ],
  switchLink: { label: "See how AI planning works", href: "#ai" },
  stayLink: { label: "Compare 8 Motion alternatives", href: "/blog/motion-alternatives" },
};

const giveUps: AlternativeExtras["giveUps"] = [
  {
    title: "An auto-scheduler",
    body: "Motion places each task by its deadline and length, then rebuilds the day when a meeting moves. Open Sunsama never moves tasks on its own. You place each block, or ask your agent to.",
  },
  {
    title: "Team projects",
    body: "Motion runs projects, deadlines and team workloads. Open Sunsama is built for one person's day.",
  },
  {
    title: "Native phone apps",
    body: "Motion has apps for iOS and Android. Open Sunsama runs in your phone's browser as a mobile web app, and has desktop apps for Mac, Windows and Linux.",
  },
  {
    title: "Built-in task integrations",
    body: "Open Sunsama syncs your calendars only. It does not pull tasks from Slack, Asana or Jira. Tasks come in by hand, through the REST API, or from your AI agent.",
  },
  {
    title: "A one-click import",
    body: "There is no Motion importer. Move this week's tasks by hand, or paste your list into Claude and ask it to create them.",
  },
  LICENSE_GIVE_UP,
];

export const extras: AlternativeExtras = { verdict, giveUps };

export default defineMarketingPage({
  path: "/alternative/motion",
  updated: "2026-09-24",
  seo: {
    title: "Motion Alternative: Open Source, With AI You Control",
    description:
      "Open Sunsama is an open source Motion alternative. You or your AI agent plan the day in blocks you can see, and nothing moves unless you ask. Self-host it.",
  },
  breadcrumbs: [{ label: "Alternatives" }, { label: "Motion" }],

  hero: {
    badge: "Compare",
    eyebrow: "Open Sunsama vs Motion",
    title: "The open-source Motion alternative",
    accent: "Motion alternative",
    answer:
      "Open Sunsama is an open-source Motion alternative with AI you can see. You plan the day, or ask Claude, ChatGPT or any agent to plan it. Nothing moves unless you ask.",
    media: {
      clip: "time-block",
      alt: "A task dragged onto Open Sunsama's day calendar next to meetings, then resized to fit",
    },
    chips: [
      { tone: "agent", title: "Claude connected", detail: "Added 3 blocks around your meetings" },
      { tone: "block", title: "Write launch notes", detail: "2:00 - 3:30 PM" },
      { tone: "timer", title: "41:12 / 1:30", detail: "Focus" },
    ],
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "Open Sunsama is the Motion alternative where you, or your agent, place every block",
      body: [
        "Open Sunsama is an open-source Motion alternative for people who want AI help without a black box. You drag tasks onto your calendar. Or you ask your AI agent to plan, and every block it makes shows up where you can see it.",
        "We build Open Sunsama, so we put it first — here is why, and where Motion fits better.",
        "Motion is an auto-scheduler. It places your tasks and rebuilds the day when a meeting runs long. If you want that autopilot, Motion does it well, and Open Sunsama does not.",
      ],
      pointsTitle: "In short",
      points: [
        "No auto-scheduler: tasks stay where you or your agent put them.",
        "Time blocking next to Google, Outlook and iCloud events.",
        "One MCP URL for Claude, ChatGPT, Cursor or any agent.",
        "Public code, self-hosting and a REST API with API keys.",
        "Built for one person, not team projects.",
      ],
    },
    verdictSection(verdict, {
      heading: "Open Sunsama fits people who want control; Motion fits people who want autopilot",
      lead: "Both apps put your tasks on your calendar. The real choice is who decides where they go.",
    }),
    {
      kind: "story",
      id: "how-it-works",
      eyebrow: "The daily loop",
      heading: "You plan a whole day in a few minutes, and it stays put",
      lead: "Plan, block, focus, and move fast from the keyboard. Every clip below is a real recording of the app.",
      steps: [
        {
          icon: "layout",
          eyebrow: "1 · Plan",
          title: "Pick today's tasks on a board of days",
          body: "Your backlog sits next to Today and Tomorrow. Drag the tasks you will do into Today and give each one an estimate.",
          clip: "plan-day",
          link: { label: "See the kanban board", href: "/features/kanban" },
        },
        {
          icon: "calendar",
          eyebrow: "2 · Block",
          title: "Drop each task where you want it",
          body: "Drag a task into a free slot next to your meetings, then drag its edge to set the length. The block stays there until you move it.",
          clip: "time-block",
          link: { label: "How time blocking works", href: "/features/time-blocking" },
        },
        {
          icon: "timer",
          eyebrow: "3 · Focus",
          title: "Work one block at a time",
          body: "Start focus mode on the task in front of you. The timer tracks real time, so tomorrow's plan is more honest.",
          clip: "focus",
          link: { label: "How focus mode works", href: "/features/focus-mode" },
        },
        {
          icon: "command",
          eyebrow: "4 · Move fast",
          title: "Fix the plan from the keyboard",
          body: "A meeting ran long? Press Cmd+K to find a task or jump to a day, and move it in seconds.",
          clip: "command-palette",
          link: { label: "See the command palette", href: "/features/command-palette" },
        },
      ],
    },
    {
      kind: "agent",
      id: "ai",
      eyebrow: "AI native",
      heading: "Your AI agent plans on request, and you see every block",
      lead: "Paste one URL into Claude, ChatGPT, Cursor or any MCP client, then sign in. Ask it to plan, and it creates tasks and time blocks around your meetings.",
      body: [
        "That is the middle path many Motion users ask for. The AI does the planning, and nothing moves until you ask. Set rules in plain words, like \"no deep work after 4pm\".",
        "Motion has a public REST API, but we found only community-built MCP servers for it. Open Sunsama runs a hosted MCP server with 24 tools. Your agent can read your calendar events but can't change them.",
      ],
      prompts: [
        "Plan my afternoon around my meetings. No deep work after 4pm.",
        "A meeting ran long. Move what's left into free slots today and tomorrow.",
        "Block two hours for the launch notes before Friday.",
      ],
      tools: ["get_schedule_for_day", "list_tasks", "create_time_block", "update_time_block", "link_task_to_time_block"],
      clip: "ai-plan",
      clipCaption: "Claude plans the afternoon over MCP. Every block it makes is one you can drag, resize or delete.",
      links: [
        { label: "Claude setup", href: "/docs/mcp/claude" },
        { label: "ChatGPT setup", href: "/docs/mcp/chatgpt" },
        { label: "Cursor setup", href: "/docs/mcp/cursor" },
        { label: "Time blocking with AI", href: "/blog/time-blocking-with-ai" },
      ],
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Feature by feature",
      heading: "Open Sunsama trades Motion's autopilot for control, the code and any agent",
      lead: "Motion leads on automation, projects and phone apps. Open Sunsama leads on control and ownership. Here is each feature side by side.",
      columns: ["Open Sunsama", "Motion"],
      rows: [
        {
          feature: "How blocks get made",
          cells: [{ text: "You drag them, or your agent does" }, { text: "AI schedules them for you" }],
        },
        {
          feature: "Auto-scheduling",
          cells: [
            { mark: "no", text: "Ask your agent" },
            { mark: "yes", text: "Full" },
          ],
        },
        {
          feature: "Moves tasks on its own",
          cells: [{ text: "Never" }, { text: "Yes, when plans change" }],
        },
        { feature: "Time blocking on your calendar", cells: ["yes", "yes"] },
        {
          feature: "Calendars",
          cells: [
            { mark: "yes", text: "Google, Outlook, iCloud" },
            { mark: "yes", text: "Google, Outlook, iCloud" },
          ],
        },
        { feature: "Board of days and a backlog", cells: ["yes", { text: "Task lists and projects" }] },
        { feature: "Projects and team workloads", cells: ["no", "yes"] },
        {
          feature: "AI agents over MCP",
          cells: [
            { mark: "yes", text: "Hosted, any MCP client" },
            { mark: "partial", text: "Community-built only" },
          ],
        },
        { feature: "Public REST API", cells: ["yes", "yes"] },
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
      ],
      sources:
        "Motion facts come from its [pricing page](https://www.usemotion.com/pricing), [API docs](https://docs.usemotion.com/) and [calendar help](https://www.usemotion.com/help/time-management/all-things-calendars). We looked for an official MCP server and found only community-built ones. Checked September 2026.",
    },
    giveUpSection(giveUps, {
      heading: "Leaving Motion costs you its auto-scheduler, team projects and phone apps",
      lead: "Motion is a good app. Here is what it does that Open Sunsama doesn't, so you can choose with clear eyes.",
    }),
    {
      kind: "steps",
      id: "switch",
      eyebrow: "How to switch",
      heading: "You can switch from Motion in three steps",
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
          body: "There is no Motion import. Add this week's tasks by hand, or paste your list into Claude and ask it to plan them. Keep Motion until you have planned five real days.",
        },
      ],
    },
  ],

  faqs: {
    heading: "Questions before you switch from Motion",
    lead: "Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best Motion alternative?",
        answer:
          "We build Open Sunsama, and we think it is the best pick for most people. You or your own AI agent plan the day, in an open-source planner you can self-host. If you want auto-scheduling, pick FlowSavvy for one person or Reclaim for teams.",
        link: { label: "Compare 8 Motion alternatives", href: "/blog/motion-alternatives" },
      },
      {
        question: "Is there an open-source Motion alternative?",
        answer:
          "Yes. Open Sunsama's code is public on GitHub, and you can self-host it with Docker for personal use. It has time blocking, focus mode, calendar sync and a hosted MCP server.",
        link: { label: "Self-hosting guide", href: "/docs/self-hosting/docker" },
      },
      {
        question: "Does Open Sunsama auto-schedule my tasks?",
        answer:
          "No. There is no built-in auto-scheduler, so you always know why a block is where it is. If you want help, ask your AI agent to place the blocks.",
      },
      {
        question: "Does Motion work with Claude or ChatGPT?",
        answer:
          "Motion has a public REST API, but we found no official MCP server, only community-built ones. Open Sunsama runs a hosted MCP server for Claude, ChatGPT, Cursor and any MCP client.",
        link: { label: "Connect your AI", href: "/docs/mcp/overview" },
      },
      {
        question: "Can AI plan my day without auto-scheduling?",
        answer:
          "Yes. Connect Claude or ChatGPT to a planner with an MCP server and ask it to plan your day. In Open Sunsama, the agent creates tasks and time blocks you can see and change.",
        link: { label: "Time blocking with AI", href: "/blog/time-blocking-with-ai" },
      },
      {
        question: "Can I import my tasks from Motion?",
        answer:
          "Not with one click. Move this week's tasks by hand, or paste your list into Claude or ChatGPT and let it create the tasks over MCP.",
      },
      LICENSE_FAQ,
    ],
  },

  related: {
    heading: "Keep comparing",
    lead: "Other apps people weigh against Motion, the features that matter most, and our longer guides.",
    links: [
      {
        kind: "guide",
        title: "8 best Motion alternatives in 2026",
        description: "Auto-schedulers and planners that keep you in control.",
        href: "/blog/motion-alternatives",
      },
      {
        kind: "guide",
        title: "Motion vs Sunsama",
        description: "Autopilot or a calm, manual plan.",
        href: "/blog/motion-vs-sunsama",
      },
      {
        kind: "guide",
        title: "Reclaim AI vs Motion vs Sunsama",
        description: "Three ways to fill your calendar, compared.",
        href: "/blog/reclaim-ai-vs-motion-vs-sunsama",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Reclaim",
        description: "A planner you run, not a layer that moves blocks.",
        href: "/alternative/reclaim",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Sunsama",
        description: "The same daily loop, with code you can read and run.",
        href: "/alternative/sunsama",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Akiflow",
        description: "Keyboard-first time blocking with a public API.",
        href: "/alternative/akiflow",
      },
      {
        kind: "feature",
        title: "Time blocking",
        description: "Drag tasks onto your calendar next to your meetings.",
        href: "/features/time-blocking",
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
    heading: "Plan tomorrow your way",
    body: "Drag your tasks onto the calendar yourself, or ask the AI agent you already use. Either way, the plan stays where you put it.",
    shot: "calendar-day",
    shotAlt: "Open Sunsama day view with the task list beside the calendar",
  },

  software: {
    featureList: [
      "Drag-and-drop time blocking",
      "Kanban board of days with a backlog",
      "Google Calendar, Outlook and iCloud sync",
      "Focus mode with planned vs actual time",
      "Hosted MCP server for Claude, ChatGPT and any AI agent",
      "Public REST API",
      "Desktop apps for Mac, Windows and Linux",
    ],
  },
});
