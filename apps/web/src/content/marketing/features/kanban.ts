/**
 * /features/kanban. Target queries: "kanban board for daily planning",
 * "personal kanban app". Competitor facts checked September 2026 (see the
 * comparison section's sources).
 */

import { defineMarketingPage } from "../types";

export default defineMarketingPage({
  path: "/features/kanban",
  updated: "2026-09-24",
  seo: {
    title: "Kanban Board for Daily Planning, One Column a Day",
    description:
      "Open Sunsama is a personal kanban app for daily planning. Each day is a column with its planned hours. Drag tasks from the backlog to Today or ask an AI agent.",
  },
  breadcrumbs: [{ label: "Features", href: "/#features" }, { label: "Kanban board" }],

  hero: {
    badge: "Feature",
    eyebrow: "Kanban board",
    title: "The kanban board for daily planning",
    accent: "for daily planning",
    answer:
      "Open Sunsama is a personal kanban app where each day is a column. Drag tasks from your backlog into Today, see how many hours you planned, and move the rest of the week in seconds.",
    media: {
      clip: "plan-day",
      alt: "Tasks dragged from the backlog into the Today column of the Open Sunsama board",
    },
    chips: [
      { tone: "block", title: "Today · 4:45 planned", detail: "8 tasks, 2 done" },
      { tone: "agent", title: "Claude connected", detail: "Moved 3 tasks to Friday" },
      { tone: "timer", title: "0:42 / 1:30", detail: "Finalize Q4 roadmap" },
    ],
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "A kanban board for daily planning gives every day its own column",
      body: [
        "A kanban board for daily planning in Open Sunsama has one column per day: Today, Tomorrow, then the rest of the week. Your backlog sits to the side for everything without a date.",
        "You drag a task into the day you will do it. Each column adds up your time estimates, so you see a full day before you start it.",
        "Your calendar sits next to the board. Drag a task onto it to block time, right beside your meetings.",
      ],
      pointsTitle: "In short",
      points: [
        "One column per day, plus a backlog for someday tasks.",
        "Each day shows its task count and total planned time.",
        "Drag tasks between days, or onto the calendar.",
        "Unfinished tasks roll over on their own.",
        "Claude, ChatGPT or any MCP agent can move tasks for you.",
      ],
    },
    {
      kind: "story",
      id: "how-it-works",
      eyebrow: "How it works",
      heading: "Plan the day, plan the week, then close it out",
      lead: "Three moves run the whole board. Every clip below is a real recording of the app.",
      steps: [
        {
          icon: "layout",
          eyebrow: "1 · Plan today",
          title: "Pull today's work out of the backlog",
          body: "Open the backlog and drag the tasks you will do into Today. Add a time estimate to each one. The column header adds them up, so you know when the day is full.",
          clip: "plan-day",
        },
        {
          icon: "calendar-clock",
          eyebrow: "2 · Plan the week",
          title: "Spread the rest across the week",
          body: "Drag a task from Today to Thursday, or back to the backlog. On a busy day, press D on a task to push it to tomorrow.",
          clip: "week-plan",
          link: { label: "See every shortcut", href: "/features/command-palette" },
        },
        {
          icon: "check",
          eyebrow: "3 · Close out",
          title: "Check off what you did and let the rest roll over",
          body: "Tick tasks as you finish them. Done tasks drop into a Completed list with their planned and actual time. Anything left rolls to tomorrow or the backlog, your choice.",
          clip: "shutdown",
        },
      ],
    },
    {
      kind: "media-rows",
      id: "board",
      eyebrow: "The board",
      heading: "Your days, your backlog and your calendar sit on one screen",
      lead: "You never switch apps to see what fits. The list, the days and the hours are side by side.",
      rows: [
        {
          title: "Each column tells you if the day is too full",
          body: [
            "Every day shows its task count and total planned time. Today also gets a progress bar that fills as you check tasks off.",
            "Priorities from P0 to P3 and time estimates show on every card. Sort a day by hand, by priority or by date added.",
          ],
          bullets: [
            "Subtasks show right on the card",
            "Add a task to any day from its column",
            "Past days fade, so today stands out",
          ],
          media: {
            shot: "board",
            alt: "Open Sunsama board with Today, Tomorrow and weekend columns, time totals per day and the calendar on the right",
            caption: "Today holds 4:45 of planned work. Your calendar sits on the right.",
          },
        },
        {
          title: "Drag a card onto the calendar to block time",
          body: [
            "The board and the calendar share one screen. Drag a task into a free slot and it becomes a time block next to your meetings.",
            "The block stays linked to its card, with the same notes and subtasks.",
          ],
          media: {
            clip: "time-block",
            alt: "A task dragged from the list onto the day calendar in Open Sunsama, then resized to fit",
            caption: "Drop a task on the calendar, then drag its edge to set how long it takes.",
          },
          link: { label: "How time blocking works", href: "/features/time-blocking" },
        },
        {
          title: "Open a card to see everything about the task",
          body: [
            "Click any card to open its notes, subtasks, files and time blocks. Notes are rich text, so you can paste links, lists and images.",
            "Set a task to repeat daily, weekly, monthly or on your own pattern, and it shows up on the right days.",
          ],
          media: {
            shot: "task-detail",
            alt: "An Open Sunsama task open with its notes, subtasks, priority and time estimate",
            caption: "One card holds the notes, subtasks and files for the task.",
          },
        },
      ],
    },
    {
      kind: "agent",
      id: "ai",
      eyebrow: "AI native",
      heading: "Your AI agent can move cards on the board for you",
      lead: "Connect Claude, ChatGPT, Cursor or any MCP client with one URL. Your agent reads the board and moves tasks between days, just like you do.",
      body: [
        "Open Sunsama has a hosted MCP server with 24 tools. Your agent can list a day, create tasks, reorder them and schedule them to another day or the backlog.",
        "Every change shows up live on your board. If you don't like a move, drag the card back.",
      ],
      prompts: [
        "I have too much on today. Move the lowest priority tasks to Friday.",
        "Put my three P0 tasks at the top of today.",
        "Look at my backlog and spread the P1 tasks across this week.",
      ],
      tools: ["list_tasks", "schedule_task", "reorder_tasks", "create_task", "update_task"],
      clip: "ai-plan",
      clipCaption: "Claude plans the afternoon over MCP. Tasks and time blocks appear live.",
      links: [
        { label: "Claude setup", href: "/docs/mcp/claude" },
        { label: "ChatGPT setup", href: "/docs/mcp/chatgpt" },
        { label: "All 24 tools", href: "/features/ai-integration" },
      ],
    },
    {
      kind: "benefits",
      id: "details",
      eyebrow: "The details",
      heading: "Small details keep a personal kanban board calm",
      lead: "A board only helps if it stays short and honest. These keep it that way.",
      items: [
        {
          icon: "repeat",
          title: "Rollover",
          body: "Unfinished tasks move to the next day or the backlog on their own. Pick which in Settings.",
        },
        {
          icon: "list",
          title: "Backlog clean-up",
          body: "Old backlog tasks are grouped by age, so you can clear out what you will never do.",
        },
        {
          icon: "keyboard",
          title: "Keyboard first",
          body: "Hover a card and press D for tomorrow, Z for the backlog or C to complete it.",
          href: "/features/command-palette",
        },
        {
          icon: "timer",
          title: "Focus on one card",
          body: "Press F on a card to open it full screen with a timer that tracks real time.",
          href: "/features/focus-mode",
        },
        {
          icon: "lightbulb",
          title: "Ideas boards",
          body: "Keep someday ideas on their own boards, with columns and cards, away from your days.",
        },
        {
          icon: "refresh",
          title: "Real-time sync",
          body: "Move a card on your laptop and it moves on your phone's browser and the desktop app too.",
          href: "/download",
        },
      ],
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Compare",
      heading: "Open Sunsama puts days, calendar and any AI agent on one board",
      lead: "Sunsama, Todoist and Trello all have boards. Here is how each one handles planning by the day.",
      columns: ["Open Sunsama", "Sunsama", "Todoist", "Trello"],
      rows: [
        {
          feature: "Columns are days",
          cells: [
            { mark: "yes", text: "Always" },
            { mark: "yes", text: "Always" },
            { mark: "partial", text: "In the Upcoming board" },
            { mark: "no", text: "You name the lists" },
          ],
        },
        {
          feature: "Planned time per day",
          cells: [
            { mark: "yes", text: "On each column" },
            { mark: "yes", text: "On each day" },
            { text: "Not checked" },
            "no",
          ],
        },
        {
          feature: "Calendar beside the board",
          cells: [
            { mark: "yes", text: "Google, Outlook, iCloud" },
            { mark: "yes", text: "Google, Outlook, iCloud" },
            { mark: "partial", text: "In a calendar layout" },
            { mark: "partial", text: "Cards by due date" },
          ],
        },
        {
          feature: "AI agents over MCP",
          cells: [
            { mark: "yes", text: "Hosted, any MCP client" },
            { mark: "yes", text: "Hosted" },
            { mark: "yes", text: "Hosted" },
            { text: "Not checked" },
          ],
        },
        { feature: "Public REST API", cells: ["yes", "no", "yes", "yes"] },
        { feature: "Code you can read and self-host", cells: ["yes", "no", "no", "no"] },
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
        "Competitor facts come from each app's website and help docs: [Sunsama](https://help.sunsama.com/docs/timeboxing), [Sunsama MCP](https://help.sunsama.com/docs/mcp-model-context-protocol), [Todoist Upcoming board](https://www.todoist.com/help/todoist/get-started/plan-your-week-with-the-upcoming-view-OKOg1mR8), [Todoist MCP](https://www.todoist.com/help/todoist/todoist-and-ai/connect-todoist-to-an-ai-assistant-xMSzFfHng) and [Trello](https://trello.com). Checked September 2026.",
    },
    {
      kind: "steps",
      id: "start",
      eyebrow: "Get started",
      heading: "You can plan your first day on the board in three steps",
      lead: "You can fill your first Today column the same morning you sign up.",
      steps: [
        {
          title: "Create your account",
          body: "Sign up on the web or [download the desktop app](/download). Prefer your own server? [Self-host it with Docker](/docs/self-hosting/docker).",
        },
        {
          title: "Brain dump into the backlog",
          body: "Press A to add a task. Get everything out of your head first, without a date.",
        },
        {
          title: "Drag today's tasks into Today",
          body: "Pick what you will really do and add an estimate to each. Stop when the column total fills your day.",
        },
      ],
    },
  ],

  faqs: {
    heading: "Questions about the kanban board",
    lead: "Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best kanban board for daily planning?",
        answer:
          "We build Open Sunsama, and we think it is the best pick for most people. Each day is a column, your calendar sits beside it, and any AI agent can move tasks for you. Pick Trello if you want boards for projects, not days.",
        link: { label: "How to plan your day", href: "/blog/how-to-plan-your-day" },
      },
      {
        question: "What is a personal kanban board?",
        answer:
          "It is a board of columns and cards for your own work. In Open Sunsama the columns are days, so moving a card means choosing when you will do it.",
      },
      {
        question: "How do I plan my week on the board?",
        answer:
          "Drag tasks from the backlog into the days they belong to. Each column shows its total planned time, so you can even out heavy days before they start.",
        link: { label: "Weekly review guide", href: "/blog/how-to-weekly-review" },
      },
      {
        question: "What happens to tasks I don't finish?",
        answer:
          "They roll over on their own. In Settings you pick whether they move to the next day or back to the backlog, and whether they land at the top or bottom.",
      },
      {
        question: "Can I use the kanban board on my phone?",
        answer:
          "Yes, in your phone's browser. Open Sunsama works as a mobile web app and syncs in real time. There is no native phone app yet; desktop apps are ready for Mac, Windows and Linux.",
        link: { label: "Get the desktop app", href: "/download" },
      },
      {
        question: "Can I make boards for projects instead of days?",
        answer:
          "Yes, with Ideas boards. They have your own columns and cards, for someday ideas and projects. Your daily board stays one column per day.",
      },
      {
        question: "Is Open Sunsama open source?",
        answer:
          "The code is public on GitHub. It uses a non-commercial license: you can read it, run it and self-host it for personal use. Companies need a commercial license.",
        link: { label: "See the code", href: "https://github.com/ShadowWalker2014/open-sunsama" },
      },
    ],
  },

  related: {
    heading: "Keep exploring",
    lead: "Features that work with the board, how we compare, and guides to plan better.",
    links: [
      {
        kind: "feature",
        title: "Time blocking",
        description: "Drag a card onto the calendar to give it a time.",
        href: "/features/time-blocking",
      },
      {
        kind: "feature",
        title: "Focus mode",
        description: "Open one card full screen with a timer.",
        href: "/features/focus-mode",
      },
      {
        kind: "feature",
        title: "Keyboard shortcuts",
        description: "Move cards between days without the mouse.",
        href: "/features/command-palette",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Sunsama",
        description: "The same board of days, with code you can read and run.",
        href: "/alternative/sunsama",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Todoist",
        description: "Plan by the day, not just by the list.",
        href: "/alternative/todoist",
      },
      {
        kind: "persona",
        title: "For ADHD",
        description: "A short Today column and rollover that forgives bad days.",
        href: "/for/adhd",
      },
      {
        kind: "guide",
        title: "How to plan your day",
        description: "A simple daily plan that survives real life.",
        href: "/blog/how-to-plan-your-day",
      },
      {
        kind: "guide",
        title: "Trello vs Sunsama",
        description: "Project boards vs a board of days.",
        href: "/blog/trello-vs-sunsama",
      },
    ],
  },

  cta: {
    heading: "Plan tomorrow in one column",
    body: "Drag tomorrow's tasks into place before you log off, then let the AI agent you already use keep the board in order.",
    shot: "board",
    shotAlt: "Open Sunsama board with a column for each day and the calendar beside it",
  },

  software: {
    featureList: [
      "Kanban board with one column per day",
      "Backlog for tasks without a date",
      "Planned time and task count on every day",
      "Drag tasks onto the calendar to time block",
      "Unfinished tasks roll over to the next day or the backlog",
      "Hosted MCP server for Claude, ChatGPT and any AI agent",
      "Public REST API",
      "Desktop apps for Mac, Windows and Linux",
    ],
  },
});
