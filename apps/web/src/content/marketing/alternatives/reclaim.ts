/**
 * /alternative/reclaim. Target queries: "reclaim alternative",
 * "reclaim.ai alternative" and "open source reclaim alternative". Reclaim facts
 * checked September 2026 on reclaim.ai (pricing, help center, Claude
 * integration page) and in the blog posts reclaim-ai-alternatives and
 * best-task-managers-with-mcp.
 */

import { defineMarketingPage } from "../types";
import { giveUpSection, LICENSE_FAQ, LICENSE_GIVE_UP, verdictSection, type AlternativeExtras } from "./shared";

const verdict: AlternativeExtras["verdict"] = {
  rival: "Reclaim",
  switchIf: [
    "You want to see and choose where each block goes, and Reclaim's moves felt hard to follow.",
    "You use iCloud Calendar. Reclaim works with Google and Outlook only.",
    "You want a board of days and a task list, not just events on a calendar.",
    "You want to self-host, or read the code behind your planner.",
    "You plan with Claude, ChatGPT or Cursor, and want one agent for your tasks and time blocks.",
  ],
  stayIf: [
    "You want habits and focus time booked and defended for you.",
    "Your team needs smart meetings and scheduling links.",
    "You want tasks synced in from Asana, Jira, Linear or Todoist.",
  ],
  switchLink: { label: "See the daily loop", href: "#how-it-works" },
  stayLink: { label: "Compare 7 Reclaim alternatives", href: "/blog/reclaim-ai-alternatives" },
};

const giveUps: AlternativeExtras["giveUps"] = [
  {
    title: "Auto-scheduling and habits",
    body: "Reclaim books time for tasks, habits and focus, then moves those blocks when meetings land. Open Sunsama never moves blocks on its own. You place them, or ask your agent to.",
  },
  {
    title: "Team scheduling",
    body: "Reclaim has smart meetings and scheduling links for teams. Open Sunsama is built for one person's day.",
  },
  {
    title: "Built-in task integrations",
    body: "Reclaim syncs tasks from Asana, Jira, Linear, Todoist and more on its paid plans. Open Sunsama syncs your calendars only. Other tasks come in by hand, through the REST API, or from your AI agent.",
  },
  {
    title: "A one-click import",
    body: "There is no Reclaim importer. Your meetings come across when you connect your calendar. Tasks move by hand, or your agent can create them.",
  },
  LICENSE_GIVE_UP,
];

export const extras: AlternativeExtras = { verdict, giveUps };

export default defineMarketingPage({
  path: "/alternative/reclaim",
  updated: "2026-09-24",
  seo: {
    title: "Reclaim.ai Alternative: Open Source, Any AI Agent",
    description:
      "Open Sunsama is an open source Reclaim.ai alternative. Place time blocks next to Google, Outlook and iCloud events, or let any AI agent plan. Self-host it.",
  },
  breadcrumbs: [{ label: "Alternatives" }, { label: "Reclaim" }],

  hero: {
    badge: "Compare",
    eyebrow: "Open Sunsama vs Reclaim.ai",
    title: "The open-source Reclaim alternative",
    accent: "Reclaim alternative",
    answer:
      "Open Sunsama is an open-source Reclaim.ai alternative. You place time blocks next to your meetings, or ask any AI agent to plan them. It works with iCloud too, and you can self-host it.",
    media: {
      clip: "time-block",
      alt: "A task dragged onto Open Sunsama's day calendar next to meetings, then resized to fit",
    },
    chips: [
      { tone: "agent", title: "ChatGPT connected", detail: "Found 2 hours for deep work" },
      { tone: "block", title: "Deep work: pricing model", detail: "9:00 - 11:00 AM" },
      { tone: "timer", title: "52:30 / 2:00", detail: "Focus" },
    ],
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "Open Sunsama is the Reclaim alternative that plans your day instead of guarding your calendar",
      body: [
        "Open Sunsama is an open-source Reclaim.ai alternative for people who want to see and choose their day. Tasks live on a board of days. You drag them onto the calendar, next to your Google, Outlook and iCloud events.",
        "We build Open Sunsama, so we put it first — here is why, and where Reclaim fits better.",
        "Reclaim works on top of Google Calendar or Outlook. It books time for tasks, habits and focus, then moves those blocks by priority. If you want that done for you, Reclaim does it well, and Open Sunsama does not.",
      ],
      pointsTitle: "In short",
      points: [
        "A daily planner: a board of days next to your calendar.",
        "Google, Outlook and iCloud calendars in one view.",
        "No auto-scheduler: blocks stay where you put them.",
        "One MCP URL for Claude, ChatGPT, Cursor or any agent.",
        "Public code, self-hosting and a REST API with API keys.",
      ],
    },
    verdictSection(verdict, {
      heading: "Open Sunsama fits people who plan their own day; Reclaim fits teams that want time guarded for them",
      lead: "Both apps put your work on your calendar. The real choice is a smart layer that moves blocks for you, or a planner you run yourself.",
    }),
    {
      kind: "story",
      id: "how-it-works",
      eyebrow: "The daily loop",
      heading: "You choose each block, and the day stays the way you planned it",
      lead: "Plan, block, focus, and move fast from the keyboard. Every clip below is a real recording of the app.",
      steps: [
        {
          icon: "layout",
          eyebrow: "1 · Plan",
          title: "Pick today's tasks on a board of days",
          body: "Your backlog sits next to Today and Tomorrow. Drag the tasks you will do into Today. Anything you don't finish rolls over to tomorrow.",
          clip: "plan-day",
          link: { label: "See the kanban board", href: "/features/kanban" },
        },
        {
          icon: "calendar",
          eyebrow: "2 · Block",
          title: "Guard your own focus time",
          body: "Drag a task into a free slot next to your meetings, then drag its edge to set the length. That block is your focus time, and it stays put.",
          clip: "time-block",
          link: { label: "How calendar sync works", href: "/features/calendar-sync" },
        },
        {
          icon: "timer",
          eyebrow: "3 · Focus",
          title: "Work one block at a time",
          body: "Start focus mode on the task in front of you. The timer tracks real time, so you see planned vs actual.",
          clip: "focus",
          link: { label: "How focus mode works", href: "/features/focus-mode" },
        },
        {
          icon: "command",
          eyebrow: "4 · Move fast",
          title: "Replan from the keyboard",
          body: "A meeting landed on your focus time? Press Cmd+K to find the task or jump to a day, and move it in seconds.",
          clip: "command-palette",
          link: { label: "See the command palette", href: "/features/command-palette" },
        },
      ],
    },
    {
      kind: "agent",
      id: "ai",
      eyebrow: "AI native",
      heading: "Any AI agent can plan your tasks and time blocks in Open Sunsama",
      lead: "Paste one URL into Claude, ChatGPT, Cursor or any MCP client, then sign in. Your agent sees your meetings and tasks together and plans around them.",
      body: [
        "Reclaim has an official MCP server too. It works on your calendar events, and changes wait in a preview for you to approve.",
        "Open Sunsama's server works on your tasks and time blocks, and reads your meetings without changing them. Its code is public, so you can run all of it on your own server.",
      ],
      prompts: [
        "Find two hours for deep work every morning this week.",
        "Plan my day around my meetings. Put my top three tasks first.",
        "How did my planned time compare with my actual time yesterday?",
      ],
      tools: ["get_schedule_for_day", "list_time_blocks", "create_time_block", "update_time_block", "list_tasks"],
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
      heading: "Open Sunsama gives you a full planner, iCloud and the code; Reclaim gives you autopilot",
      lead: "Reclaim leads on automation and team scheduling. Open Sunsama leads on control and ownership. Here is each feature side by side.",
      columns: ["Open Sunsama", "Reclaim"],
      rows: [
        {
          feature: "What it is",
          cells: [{ text: "A daily planner with a calendar" }, { text: "A smart layer on your calendar" }],
        },
        {
          feature: "Places tasks on its own",
          cells: [
            { mark: "no", text: "You or your agent" },
            { mark: "yes", text: "By priority" },
          ],
        },
        { feature: "Habits and focus time defense", cells: ["no", "yes"] },
        { feature: "Board of days and a backlog", cells: ["yes", { text: "Task list" }] },
        {
          feature: "Calendars",
          cells: [
            { mark: "yes", text: "Google, Outlook, iCloud" },
            { mark: "partial", text: "Google, Outlook" },
          ],
        },
        { feature: "Focus mode with planned vs actual", cells: ["yes", { text: "Focus time on the calendar" }] },
        {
          feature: "Built-in task integrations",
          cells: [
            { mark: "no", text: "Via REST API or your agent" },
            { mark: "yes", text: "Asana, Jira, Linear, Todoist and more" },
          ],
        },
        { feature: "Smart meetings and scheduling links", cells: ["no", "yes"] },
        {
          feature: "MCP server for AI agents",
          cells: [
            { mark: "yes", text: "Hosted, tasks and time blocks" },
            { mark: "yes", text: "Hosted, calendar events" },
          ],
        },
        { feature: "Code you can read and self-host", cells: ["yes", "no"] },
        {
          feature: "Desktop apps",
          cells: [
            { mark: "yes", text: "Mac, Windows, Linux" },
            { mark: "partial", text: "Web app" },
          ],
        },
        {
          feature: "Phone",
          cells: [
            { mark: "partial", text: "Mobile web app" },
            { mark: "partial", text: "Mobile web app" },
          ],
        },
      ],
      sources:
        "Reclaim facts come from its [pricing page](https://reclaim.ai/pricing), [help center](https://help.reclaim.ai/) and [Claude integration page](https://reclaim.ai/integrations/claude). Reclaim has been part of Dropbox since August 2024. Checked September 2026.",
    },
    giveUpSection(giveUps, {
      heading: "Leaving Reclaim costs you auto-scheduling, habits and task sync",
      lead: "Reclaim is a good app. Here is what it does that Open Sunsama doesn't, so you can choose with clear eyes.",
    }),
    {
      kind: "steps",
      id: "switch",
      eyebrow: "How to switch",
      heading: "You can switch from Reclaim in three steps",
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
          title: "Move your tasks, then pause Reclaim",
          body: "Add this week's tasks by hand, or ask Claude to create them over MCP. Then pause Reclaim's habits and task blocks, so they don't fill your calendar twice.",
        },
      ],
    },
  ],

  faqs: {
    heading: "Questions before you switch from Reclaim",
    lead: "Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best Reclaim.ai alternative?",
        answer:
          "We build Open Sunsama, and we think it is the best pick for most people. It is an open-source daily planner with time blocking that any AI agent can run. FlowSavvy is the closest auto-scheduler for one person, and Motion does more for you.",
        link: { label: "Compare 7 Reclaim alternatives", href: "/blog/reclaim-ai-alternatives" },
      },
      {
        question: "Is there an open-source Reclaim alternative?",
        answer:
          "Yes. Open Sunsama's code is public on GitHub, and you can self-host it with Docker for personal use. It has time blocking, focus mode, calendar sync and a hosted MCP server.",
        link: { label: "Self-hosting guide", href: "/docs/self-hosting/docker" },
      },
      {
        question: "Does Open Sunsama work with iCloud Calendar?",
        answer: "Yes. Connect Google Calendar, Outlook or iCloud in Settings. Reclaim works with Google and Outlook only.",
        link: { label: "How calendar sync works", href: "/features/calendar-sync" },
      },
      {
        question: "Does Open Sunsama auto-schedule like Reclaim?",
        answer:
          "No. There is no built-in auto-scheduler, so blocks stay where you put them. If you want help, ask your AI agent to place them.",
      },
      {
        question: "Does Reclaim work with Claude or ChatGPT?",
        answer:
          "Yes. Reclaim has an official MCP server and a ChatGPT app. Changes made through AI wait in a preview until you approve them.",
      },
      {
        question: "Did Dropbox buy Reclaim.ai?",
        answer: "Yes. Dropbox announced it bought Reclaim in August 2024. Reclaim still runs as its own app.",
      },
      {
        question: "Is there a Reclaim alternative with a phone app?",
        answer:
          "Open Sunsama runs in your phone's browser as a mobile web app, like Reclaim. If you need native phone apps, FlowSavvy, Motion, Morgen and Sunsama have them.",
      },
      LICENSE_FAQ,
    ],
  },

  related: {
    heading: "Keep comparing",
    lead: "Other apps people weigh against Reclaim, the features that matter most, and our longer guides.",
    links: [
      {
        kind: "guide",
        title: "7 best Reclaim.ai alternatives in 2026",
        description: "Auto or manual planning, plus what happened to Clockwise.",
        href: "/blog/reclaim-ai-alternatives",
      },
      {
        kind: "guide",
        title: "Reclaim AI vs Motion vs Sunsama",
        description: "Three ways to fill your calendar, compared.",
        href: "/blog/reclaim-ai-vs-motion-vs-sunsama",
      },
      {
        kind: "guide",
        title: "Task managers with MCP",
        description: "Which planners your AI agent can really use.",
        href: "/blog/best-task-managers-with-mcp",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Motion",
        description: "Plan by hand, or with your agent, instead of an auto-scheduler.",
        href: "/alternative/motion",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Sunsama",
        description: "The same daily loop, with code you can read and run.",
        href: "/alternative/sunsama",
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
        title: "Calendar sync",
        description: "Google, Outlook and iCloud events next to your plan.",
        href: "/features/calendar-sync",
      },
    ],
  },

  cta: {
    heading: "Guard tomorrow's focus time yourself",
    body: "Put your tasks on the calendar next to your meetings, and let the AI agent you already use help when the day shifts.",
    shot: "calendar-week",
    shotAlt: "Open Sunsama week calendar with time blocks next to meetings",
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
