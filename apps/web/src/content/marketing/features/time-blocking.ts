/**
 * /features/time-blocking — the reference page for the marketing kit.
 * Target query: "time blocking app". Competitor facts checked September 2026
 * (see the comparison section's sources).
 */

import { defineMarketingPage } from "../types";

export default defineMarketingPage({
  path: "/features/time-blocking",
  updated: "2026-09-24",
  seo: {
    title: "Time Blocking App That Fits Your Real Calendar",
    description:
      "Open Sunsama is an open-source time blocking app. Drag tasks onto your calendar next to Google, Outlook and iCloud events, or let any AI agent plan your day.",
  },
  breadcrumbs: [{ label: "Features", href: "/#features" }, { label: "Time blocking" }],

  hero: {
    badge: "Feature",
    eyebrow: "Time blocking",
    title: "The time blocking app for your real calendar",
    accent: "for your real calendar",
    answer:
      "Open Sunsama is an open-source time blocking app. Drag a task onto your calendar, right next to your meetings, or let any AI agent plan the day for you.",
    media: {
      clip: "time-block",
      alt: "A task dragged from the list onto the day calendar in Open Sunsama, then resized to fit",
    },
    chips: [
      { tone: "agent", title: "Claude connected", detail: "Blocked 3 tasks around your meetings" },
      { tone: "block", title: "Deep work: Q4 roadmap", detail: "9:30 - 11:00 AM" },
      { tone: "timer", title: "23:02 / 1:30", detail: "Focus" },
    ],
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "Time blocking in Open Sunsama means every task gets a slot on your calendar",
      body: [
        "Time blocking in Open Sunsama means you drag a task from your list onto the calendar. It becomes a block with a start and an end. Drag its bottom edge to set how long it takes.",
        "Your meetings from Google Calendar, Outlook and iCloud sit in the same view. So you see what really fits before the day starts, not at 4 pm.",
        "Each block stays linked to its task. Open it to see the notes and subtasks you need to get it done.",
      ],
      pointsTitle: "In short",
      points: [
        "Drag a task onto the day view to block time for it.",
        "Resize a block to set how long the task takes.",
        "See Google, Outlook and iCloud events next to your blocks.",
        "Track planned vs actual time with the focus timer.",
        "Let Claude, ChatGPT or any MCP agent block time for you.",
      ],
    },
    {
      kind: "story",
      id: "how-it-works",
      eyebrow: "How it works",
      heading: "A fully blocked day takes a few minutes",
      lead: "Plan, block, focus, then look ahead. Every clip below is a real recording of the app.",
      steps: [
        {
          icon: "layout",
          eyebrow: "1 · Plan",
          title: "Pull today's tasks onto the board",
          body: "Start from your backlog. Drag the tasks you want to do into Today and give each one a time estimate. Each day shows how much time you have planned.",
          clip: "plan-day",
          link: { label: "See the kanban board", href: "/features/kanban" },
        },
        {
          icon: "calendar",
          eyebrow: "2 · Block",
          title: "Drop each task onto the calendar",
          body: "Drag a task into a free slot next to your meetings. Then drag the block's edge to set how long it takes. If the day is too full, you see it now.",
          clip: "time-block",
        },
        {
          icon: "timer",
          eyebrow: "3 · Focus",
          title: "Work one block at a time",
          body: "Start focus mode on the task in front of you. The timer tracks the real time, so you can compare planned vs actual and plan better tomorrow.",
          clip: "focus",
          link: { label: "How focus mode works", href: "/features/focus-mode" },
        },
        {
          icon: "calendar-clock",
          eyebrow: "4 · Look ahead",
          title: "Move the rest of the week in seconds",
          body: "Drag tasks between days to plan the week. Anything you don't finish rolls over to tomorrow, so one bad day never snowballs.",
          clip: "week-plan",
        },
      ],
    },
    {
      kind: "media-rows",
      id: "calendar-sync",
      eyebrow: "Calendar sync",
      heading: "Your meetings and your time blocks share one calendar",
      lead: "Connect Google Calendar, Outlook or iCloud once. Your events show up next to your blocks, so you plan around real meetings.",
      rows: [
        {
          title: "See the whole week at a glance",
          body: [
            "The week view shows your meetings and time blocks side by side. Colors tell you what kind of work each block is.",
          ],
          bullets: [
            "Google Calendar, Outlook and iCloud",
            "Day, 3-day, week and month views",
            "Meetings sync in, so your plan stays honest",
          ],
          media: {
            shot: "calendar-week",
            alt: "Open Sunsama week view with meetings and color-coded time blocks",
            caption: "The week view: meetings and time blocks side by side.",
          },
          link: { label: "How calendar sync works", href: "/features/calendar-sync" },
        },
        {
          title: "Tasks on the left, time on the right",
          body: [
            "The day view puts your task list next to the timeline. Drag from one to the other.",
            "Every block links back to its task, with its notes and subtasks.",
          ],
          media: {
            shot: "calendar-day",
            alt: "Open Sunsama day view with the task list beside the calendar",
            caption: "Day view: drag tasks from the list into open time.",
          },
        },
        {
          title: "Take today's plan with you",
          body: [
            "On your phone, open Open Sunsama in the browser. It works as a mobile web app and syncs in real time.",
            "At your desk, use the web app or the [desktop app](/download) for Mac, Windows and Linux.",
          ],
          media: {
            shot: "mobile-tasks",
            alt: "Open Sunsama's task list in a phone browser",
            caption: "Today's plan on your phone.",
          },
        },
      ],
    },
    {
      kind: "agent",
      id: "ai",
      eyebrow: "AI native",
      heading: "Claude, ChatGPT or any AI agent can time-block your day",
      lead: "Paste one URL into your AI app and sign in. Your agent sees your meetings and tasks together, then creates time blocks around them.",
      body: [
        "Open Sunsama has a hosted MCP server with 24 tools. Your agent can read your calendar events, but it can't change them. It only adds and moves your tasks and time blocks.",
        "You stay in charge. Every block the agent makes shows up live on your calendar, and you can drag it anywhere.",
      ],
      prompts: [
        "Plan my afternoon around my meetings. Put my top three tasks in focus blocks.",
        "I lost the morning. Move what's left into free slots today and tomorrow.",
        "Block two hours of deep work every morning this week.",
      ],
      tools: ["get_schedule_for_day", "list_tasks", "create_time_block", "update_time_block", "link_task_to_time_block"],
      clip: "ai-plan",
      clipCaption: "Claude plans the afternoon over MCP. Tasks and time blocks appear live.",
      links: [
        { label: "Claude setup", href: "/docs/mcp/claude" },
        { label: "ChatGPT setup", href: "/docs/mcp/chatgpt" },
        { label: "Cursor setup", href: "/docs/mcp/cursor" },
        { label: "Time blocking with AI", href: "/blog/time-blocking-with-ai" },
      ],
    },
    {
      kind: "benefits",
      id: "details",
      eyebrow: "The details",
      heading: "Small details keep your time blocks honest",
      lead: "Time blocking fails when the plan drifts from the day. These keep them in step.",
      items: [
        {
          icon: "link",
          title: "Blocks stay linked to tasks",
          body: "Open a block to see its task, notes and subtasks. Nothing lives in two places.",
        },
        {
          icon: "hourglass",
          title: "Planned vs actual",
          body: "Set an estimate, and the focus timer tracks the real time. Your next plan gets more honest.",
          href: "/features/focus-mode",
        },
        {
          icon: "repeat",
          title: "Rollover",
          body: "Unfinished tasks move to the next day on their own. You never start buried in yesterday.",
        },
        {
          icon: "command",
          title: "Keyboard first",
          body: "Press Cmd+K to find any task or jump to any day. Most actions have a shortcut.",
          href: "/features/command-palette",
        },
        {
          icon: "monitor",
          title: "Desktop apps",
          body: "Apps for Mac, Windows and Linux, plus the web. Changes sync across devices in real time.",
          href: "/download",
        },
        {
          icon: "github",
          title: "Open source",
          body: "The code is public on GitHub. Self-host it with Docker and keep your data on your own server.",
          href: "/docs/self-hosting/docker",
        },
      ],
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Compare",
      heading: "Open Sunsama gives you time blocking plus the code, the API and any agent",
      lead: "Sunsama, Motion and Akiflow are good apps. Here is how each one handles time blocking, so you can choose with clear eyes.",
      columns: ["Open Sunsama", "Sunsama", "Motion", "Akiflow"],
      rows: [
        {
          feature: "How blocks get made",
          cells: [
            { text: "You drag them, or your agent does" },
            { text: "You drag them, in a guided ritual" },
            { text: "AI schedules them for you" },
            { text: "You drag them, with AI help" },
          ],
        },
        {
          feature: "Auto-scheduling",
          cells: [
            { mark: "no", text: "Ask your agent" },
            { mark: "partial", text: "Optional, per task" },
            { mark: "yes", text: "Full" },
            { mark: "partial", text: "Schedule Optimizer" },
          ],
        },
        {
          feature: "Calendars",
          cells: [
            { mark: "yes", text: "Google, Outlook, iCloud" },
            { mark: "yes", text: "Google, Outlook, iCloud" },
            { mark: "partial", text: "Google, Outlook" },
            { mark: "partial", text: "Google, Outlook" },
          ],
        },
        {
          feature: "AI agents over MCP",
          cells: [
            { mark: "yes", text: "Hosted, any MCP client" },
            { mark: "yes", text: "Hosted" },
            { mark: "partial", text: "Community-built only" },
            { mark: "yes", text: "Hosted" },
          ],
        },
        { feature: "Public REST API", cells: ["yes", "no", "yes", "no"] },
        { feature: "Code you can read and self-host", cells: ["yes", "no", "no", "no"] },
        {
          feature: "Desktop apps",
          cells: [
            { mark: "yes", text: "Mac, Windows, Linux" },
            { mark: "yes", text: "Mac, Windows, Linux" },
            { mark: "yes", text: "Desktop app" },
            { mark: "yes", text: "Mac, Windows" },
          ],
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
        "Competitor facts come from each app's website, pricing page and help docs: [Sunsama](https://www.sunsama.com/pricing), [Sunsama MCP](https://help.sunsama.com/docs/mcp-model-context-protocol), [Motion](https://www.usemotion.com/pricing), [Motion API](https://docs.usemotion.com/) and [Akiflow](https://akiflow.com/pricing). Checked September 2026.",
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
    {
      kind: "steps",
      id: "start",
      eyebrow: "Get started",
      heading: "You can start time blocking in three steps",
      lead: "Block your first day the same morning you sign up.",
      steps: [
        {
          title: "Create your account",
          body: "Sign up on the web or [download the desktop app](/download). Prefer your own server? [Self-host it with Docker](/docs/self-hosting/docker).",
        },
        {
          title: "Connect your calendar",
          body: "Add Google Calendar, Outlook or iCloud in Settings. Your meetings appear next to your tasks.",
        },
        {
          title: "Drag your first task onto the calendar",
          body: "Pick one task for this morning and drop it into a free slot. Resize it to fit. That is your first time block.",
        },
      ],
    },
  ],

  faqs: {
    heading: "Questions about time blocking in Open Sunsama",
    lead: "Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best time blocking app?",
        answer:
          "We build Open Sunsama, and we think it is the best pick for most people. You drag tasks onto your calendar next to your meetings, and any AI agent can plan with you. Pick Motion if you want AI to schedule every task for you.",
        link: { label: "Compare 9 time blocking apps", href: "/blog/best-calendar-apps-time-blocking" },
      },
      {
        question: "How do I time block in Open Sunsama?",
        answer:
          "Open the day view and drag a task from your list onto the calendar. Drag the bottom edge of the block to set how long it takes. The block stays linked to its task.",
        link: { label: "Time blocking guide", href: "/blog/complete-guide-time-blocking" },
      },
      {
        question: "Does Open Sunsama sync with Google Calendar and Outlook?",
        answer:
          "Yes. Connect Google Calendar, Outlook or iCloud in Settings. Your events show up next to your time blocks in the day and week views.",
        link: { label: "How calendar sync works", href: "/features/calendar-sync" },
      },
      {
        question: "Can AI time-block my day for me?",
        answer:
          "Yes. Connect Claude, ChatGPT, Cursor or any MCP client with one URL. Your agent reads your meetings and tasks, then creates time blocks around them. It can't move your meetings.",
        link: { label: "Connect your AI", href: "/docs/mcp/overview" },
      },
      {
        question: "Does Open Sunsama auto-schedule my tasks?",
        answer:
          "No. There is no built-in auto-scheduler, so you always know why a block is where it is. If you want help, ask your AI agent to place the blocks.",
      },
      {
        question: "Can I time block on my phone?",
        answer:
          "Yes, in your phone's browser. Open Sunsama works as a mobile web app and syncs in real time. There is no native phone app yet; desktop apps are ready for Mac, Windows and Linux.",
        link: { label: "Get the desktop app", href: "/download" },
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
    lead: "Features that work with time blocking, how we compare, and guides to get better at it.",
    links: [
      {
        kind: "feature",
        title: "Calendar sync",
        description: "See Google, Outlook and iCloud events next to your plan.",
        href: "/features/calendar-sync",
      },
      {
        kind: "feature",
        title: "Focus mode",
        description: "Work one block at a time with a timer that tracks real time.",
        href: "/features/focus-mode",
      },
      {
        kind: "feature",
        title: "AI and MCP",
        description: "Let Claude, ChatGPT or any agent plan your day.",
        href: "/features/ai-integration",
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
        title: "Open Sunsama vs Akiflow",
        description: "Keyboard-first time blocking with a public API.",
        href: "/alternative/akiflow",
      },
      {
        kind: "guide",
        title: "9 best time blocking apps in 2026",
        description: "AI schedulers vs planners, compared side by side.",
        href: "/blog/best-calendar-apps-time-blocking",
      },
      {
        kind: "guide",
        title: "What is time blocking?",
        description: "How the method works, with examples.",
        href: "/blog/what-is-time-blocking",
      },
      {
        kind: "guide",
        title: "AI time blocking",
        description: "Let an agent plan your day without losing control.",
        href: "/blog/time-blocking-with-ai",
      },
    ],
  },

  cta: {
    heading: "Block tomorrow before you log off",
    body: "Drag your tasks onto the calendar, work one block at a time, and let the AI agent you already use keep the plan on track.",
    shot: "calendar-week",
    shotAlt: "Open Sunsama week calendar full of time blocks next to meetings",
  },

  software: {
    featureList: [
      "Drag-and-drop time blocking",
      "Day, 3-day, week and month calendar views",
      "Google Calendar, Outlook and iCloud sync",
      "Focus mode with planned vs actual time",
      "Unfinished tasks roll over to the next day",
      "Hosted MCP server for Claude, ChatGPT and any AI agent",
      "Public REST API",
      "Desktop apps for Mac, Windows and Linux",
    ],
  },
});
