/**
 * /alternative/todoist. Target queries: "todoist alternative" and
 * "open source todoist alternative". Todoist facts checked September 2026 on
 * todoist.com (downloads, help center: time blocking and calendar
 * integration) and github.com/Doist/todoist-mcp, and in the blog posts
 * open-source-todoist-alternatives and best-task-managers-with-mcp.
 */

import { defineMarketingPage } from "../types";
import { giveUpSection, LICENSE_FAQ, LICENSE_GIVE_UP, verdictSection, type AlternativeExtras } from "./shared";

const verdict: AlternativeExtras["verdict"] = {
  rival: "Todoist",
  switchIf: [
    "Your list grows faster than you can finish it, and you want to plan what really fits today.",
    "You want time blocking and a focus timer in the same app as your tasks.",
    "You want Google, Outlook and iCloud calendars in one view.",
    "You want to self-host, or read the code behind your planner.",
    "You want your AI agent to see your meetings and your tasks together.",
  ],
  stayIf: [
    "You mostly capture and sort tasks, and a list is all you need.",
    "You share projects with your team or family.",
    "You want native apps on every device, from iOS and Android to your watch.",
    "You rely on Todoist's many integrations.",
  ],
  switchLink: { label: "See the daily loop", href: "#how-it-works" },
  stayLink: { label: "Compare open-source Todoist alternatives", href: "/blog/open-source-todoist-alternatives" },
};

const giveUps: AlternativeExtras["giveUps"] = [
  {
    title: "Apps on every device",
    body: "Todoist has apps for iOS, Android, Apple Watch and Wear OS. Open Sunsama runs in your phone's browser as a mobile web app, and has desktop apps for Mac, Windows and Linux.",
  },
  {
    title: "Natural-language quick add",
    body: "Todoist turns \"call Sam Friday 3pm\" into a dated task. In Open Sunsama you type the task and pick the day, or ask your agent to do it.",
  },
  {
    title: "Shared projects",
    body: "Todoist lets you share projects with a team or family. Open Sunsama is built for one person's day.",
  },
  {
    title: "Built-in integrations",
    body: "Todoist connects to many apps. Open Sunsama syncs your calendars only. Other tasks come in by hand, through the REST API, or from your AI agent.",
  },
  {
    title: "A Todoist importer",
    body: "There is no Todoist importer yet. Move your open tasks by hand, or connect both apps to Claude over MCP and ask it to copy them.",
  },
  LICENSE_GIVE_UP,
];

export const extras: AlternativeExtras = { verdict, giveUps };

export default defineMarketingPage({
  path: "/alternative/todoist",
  updated: "2026-09-24",
  seo: {
    title: "Todoist Alternative: Open Source, With Time Blocking",
    description:
      "Open Sunsama is an open source Todoist alternative that plans when, not just what. Drag tasks onto your calendar, focus with a timer, and let any AI agent help.",
  },
  breadcrumbs: [{ label: "Alternatives" }, { label: "Todoist" }],

  hero: {
    badge: "Compare",
    eyebrow: "Open Sunsama vs Todoist",
    title: "The open-source Todoist alternative",
    accent: "Todoist alternative",
    answer:
      "Open Sunsama is an open-source Todoist alternative that plans when, not just what. Drag tasks onto your calendar next to your meetings, and let any AI agent help. The code is public, so you can self-host it.",
    media: {
      clip: "time-block",
      alt: "A task dragged from the list onto Open Sunsama's day calendar, then resized to fit",
    },
    chips: [
      { tone: "agent", title: "Claude connected", detail: "Spread your brain dump over the week" },
      { tone: "block", title: "P0: Ship onboarding fix", detail: "1:00 - 2:30 PM" },
      { tone: "timer", title: "12:05 / 1:30", detail: "Focus" },
    ],
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "Open Sunsama is the Todoist alternative built around your calendar",
      body: [
        "Open Sunsama is an open-source Todoist alternative for people who want to plan their day, not just their list. Tasks sit on a board of days. You drag them onto the calendar, then work one at a time with a focus timer.",
        "We build Open Sunsama, so we put it first — here is why, and where Todoist fits better.",
        "Todoist is a great list app. It has fast natural-language capture, apps on every device, and a calendar layout on its Pro and Business plans. If a list is what you need, stay with it.",
      ],
      pointsTitle: "In short",
      points: [
        "A board of days, not one long list.",
        "Time blocking next to Google, Outlook and iCloud events.",
        "Focus mode that tracks planned vs actual time.",
        "One MCP URL for Claude, ChatGPT, Cursor or any agent.",
        "Public code, self-hosting and a REST API with API keys.",
      ],
    },
    verdictSection(verdict, {
      heading: "Open Sunsama fits people who plan their day; Todoist fits people who manage lists",
      lead: "Both apps hold your tasks. The real choice is a list you check, or a day you plan hour by hour.",
    }),
    {
      kind: "story",
      id: "how-it-works",
      eyebrow: "The daily loop",
      heading: "Your list turns into a planned day in four moves",
      lead: "Plan, block, focus, and move fast from the keyboard. Every clip below is a real recording of the app.",
      steps: [
        {
          icon: "layout",
          eyebrow: "1 · Plan",
          title: "Pick what fits today on a board of days",
          body: "Your backlog sits next to Today and Tomorrow. Drag only what fits into Today. Anything you don't finish rolls over to tomorrow on its own.",
          clip: "plan-day",
          link: { label: "See the kanban board", href: "/features/kanban" },
        },
        {
          icon: "calendar",
          eyebrow: "2 · Block",
          title: "Give each task a time",
          body: "Drag a task onto the calendar next to your meetings, then drag its edge to set the length. Now it has a when, not just a due date.",
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
          title: "Find anything from the keyboard",
          body: "Press Cmd+K to find a task, jump to a day or run a command. Most actions have a shortcut.",
          clip: "command-palette",
          link: { label: "See the command palette", href: "/features/command-palette" },
        },
      ],
    },
    {
      kind: "agent",
      id: "ai",
      eyebrow: "AI native",
      heading: "Any AI agent can turn your tasks into a planned day",
      lead: "Paste one URL into Claude, ChatGPT, Cursor or any MCP client, then sign in. Your agent sees your meetings and tasks together and plans around them.",
      body: [
        "Todoist has an official MCP server too. If AI access to a list is all you want, you don't need to leave Todoist.",
        "The difference is the calendar. Open Sunsama's agent reads your meetings and your tasks in one call, then creates time blocks around them. And the code is public, so you can run it all on your own server.",
      ],
      prompts: [
        "Here is my brain dump. Turn it into tasks and spread them over this week.",
        "Plan today around my meetings. Put my P0 tasks first.",
        "What's left from yesterday? Move it into free slots today.",
      ],
      tools: ["create_task", "list_tasks", "get_schedule_for_day", "create_time_block", "schedule_task"],
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
      heading: "Open Sunsama adds a planned day to your tasks; Todoist adds sharing and apps everywhere",
      lead: "Todoist leads on capture, sharing and apps. Open Sunsama leads on planning your time and owning the app. Here is each feature side by side.",
      columns: ["Open Sunsama", "Todoist"],
      rows: [
        {
          feature: "How you plan",
          cells: [{ text: "Board of days, then drag to the calendar" }, { text: "Lists and projects, with a calendar layout" }],
        },
        {
          feature: "Time blocking on your calendar",
          cells: [
            { mark: "yes", text: "Every account" },
            { mark: "partial", text: "Pro and Business plans" },
          ],
        },
        {
          feature: "Calendars",
          cells: [
            { mark: "yes", text: "Google, Outlook, iCloud" },
            { mark: "partial", text: "Google or Outlook, one at a time" },
          ],
        },
        {
          feature: "Focus timer with planned vs actual",
          cells: [
            { mark: "yes", text: "Built in" },
            { mark: "no", text: "Task durations only" },
          ],
        },
        {
          feature: "Unfinished tasks",
          cells: [{ text: "Roll over to the next day" }, { text: "Stay overdue until you move them" }],
        },
        {
          feature: "Natural-language quick add",
          cells: [
            { mark: "no", text: "Ask your agent" },
            { mark: "yes", text: "Yes" },
          ],
        },
        { feature: "Shared projects", cells: ["no", "yes"] },
        {
          feature: "Built-in integrations",
          cells: [
            { mark: "no", text: "Calendars, REST API, your agent" },
            { mark: "yes", text: "Many apps" },
          ],
        },
        {
          feature: "MCP server for AI agents",
          cells: [
            { mark: "yes", text: "Hosted, tasks and calendar" },
            { mark: "yes", text: "Hosted, tasks and projects" },
          ],
        },
        { feature: "Public REST API", cells: ["yes", "yes"] },
        { feature: "Code you can read and self-host", cells: ["yes", "no"] },
        {
          feature: "Desktop apps",
          cells: [
            { mark: "yes", text: "Mac, Windows, Linux" },
            { mark: "yes", text: "Mac, Windows, Linux" },
          ],
        },
        {
          feature: "Phone and watch",
          cells: [
            { mark: "partial", text: "Mobile web app" },
            { mark: "yes", text: "iOS, Android, Apple Watch, Wear OS" },
          ],
        },
      ],
      sources:
        "Todoist facts come from its [downloads page](https://www.todoist.com/downloads), its help pages on [time blocking](https://www.todoist.com/help/articles/time-blocking-in-todoist-d6Pf1uTpc) and the [calendar integration](https://www.todoist.com/help/articles/use-the-calendar-integration-rCqwLCt3G), and its [MCP server](https://github.com/Doist/todoist-mcp). Checked September 2026.",
    },
    giveUpSection(giveUps, {
      heading: "Leaving Todoist costs you quick capture, sharing and apps everywhere",
      lead: "Todoist is a good app. Here is what it does that Open Sunsama doesn't, so you can choose with clear eyes.",
    }),
    {
      kind: "steps",
      id: "switch",
      eyebrow: "How to switch",
      heading: "You can switch from Todoist in three steps",
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
          title: "Bring over your open tasks",
          body: "There is no Todoist importer yet. Connect both Todoist and Open Sunsama to Claude over MCP, and ask it to copy this week's tasks. Check the result before you stop using Todoist.",
        },
      ],
    },
  ],

  faqs: {
    heading: "Questions before you switch from Todoist",
    lead: "Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best open-source Todoist alternative?",
        answer:
          "We build Open Sunsama, and we think it is the best pick overall. It plans your day on a board and a calendar, and works with any AI agent. Vikunja is the closest Todoist clone you can self-host. Super Productivity is best if you want no server at all.",
        link: { label: "Compare 8 open-source options", href: "/blog/open-source-todoist-alternatives" },
      },
      {
        question: "Is there a Todoist alternative with time blocking?",
        answer:
          "Yes. In Open Sunsama you drag any task onto your calendar and resize it to set its length. Todoist also has a calendar layout on its Pro and Business plans.",
        link: { label: "How time blocking works", href: "/features/time-blocking" },
      },
      {
        question: "Can I import my tasks from Todoist?",
        answer:
          "Not with one click yet. Move your open tasks by hand, or connect both apps to Claude over MCP and ask it to copy them.",
        link: { label: "Migration guide", href: "/blog/todoist-to-open-sunsama-migration" },
      },
      {
        question: "Does Todoist have an MCP server?",
        answer:
          "Yes. Todoist runs an official hosted MCP server at ai.todoist.net/mcp. If AI access is all you want, you don't need to leave Todoist. Switch for time blocking, self-hosting or open code.",
      },
      {
        question: "Does Open Sunsama have priorities like Todoist?",
        answer: "Yes. Tasks have priorities from P0 to P3, where P0 is the most urgent.",
      },
      {
        question: "Does Open Sunsama have a phone app?",
        answer:
          "It runs in your phone's browser as a mobile web app and syncs in real time. There is no native app for iOS or Android yet.",
        link: { label: "Get the desktop app", href: "/download" },
      },
      LICENSE_FAQ,
    ],
  },

  related: {
    heading: "Keep comparing",
    lead: "Other apps people weigh against Todoist, the features that matter most, and our longer guides.",
    links: [
      {
        kind: "guide",
        title: "8 open-source Todoist alternatives",
        description: "Licenses, self-hosting, phone apps and MCP, compared.",
        href: "/blog/open-source-todoist-alternatives",
      },
      {
        kind: "guide",
        title: "Task managers with MCP",
        description: "Which to-do apps your AI agent can really use.",
        href: "/blog/best-task-managers-with-mcp",
      },
      {
        kind: "compare",
        title: "Open-source task manager",
        description: "Why an open planner, and what you can do with the code.",
        href: "/open-source-task-manager",
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
        title: "Focus mode",
        description: "Work one task at a time with a timer that tracks real time.",
        href: "/features/focus-mode",
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
    heading: "Give tomorrow's tasks a time",
    body: "Drag your list onto the calendar, work one task at a time, and let the AI agent you already use keep the plan on track.",
    shot: "board",
    shotAlt: "Open Sunsama board with tasks planned across days",
  },

  software: {
    featureList: [
      "Kanban board of days with a backlog",
      "Drag-and-drop time blocking",
      "Google Calendar, Outlook and iCloud sync",
      "Focus mode with planned vs actual time",
      "Priorities P0-P3, subtasks and notes",
      "Hosted MCP server for Claude, ChatGPT and any AI agent",
      "Public REST API",
      "Desktop apps for Mac, Windows and Linux",
    ],
  },
});
