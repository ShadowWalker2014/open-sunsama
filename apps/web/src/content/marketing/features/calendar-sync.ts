/**
 * /features/calendar-sync. Target queries: "google calendar task planner",
 * "outlook calendar sync to-do app", "icloud calendar planner".
 *
 * How sync works (checked in apps/api, September 2026): events sync in from
 * Google, Outlook and iCloud (background job, plus "Sync now"); events you
 * create, move, resize or delete in Open Sunsama are written back to the
 * provider (apps/api/src/routes/calendar-events.ts); time blocks are NOT
 * pushed to external calendars; MCP reads events only
 * (mcp/src/tools/calendar-events.ts). Competitor facts: see the comparison's
 * sources.
 */

import { defineMarketingPage } from "../types";

export default defineMarketingPage({
  path: "/features/calendar-sync",
  updated: "2026-09-24",
  seo: {
    title: "Google Calendar Task Planner With Outlook and iCloud",
    description:
      "Open Sunsama is a Google Calendar task planner that also syncs Outlook and iCloud. See meetings beside tasks, time block around them and edit events in place.",
  },
  breadcrumbs: [{ label: "Features", href: "/#features" }, { label: "Calendar sync" }],

  hero: {
    badge: "Feature",
    eyebrow: "Calendar sync",
    title: "The Google Calendar task planner, plus Outlook and iCloud",
    accent: "plus Outlook and iCloud",
    answer:
      "Open Sunsama puts your Google Calendar, Outlook and iCloud meetings next to your tasks. Drag tasks into the gaps between meetings, and edit events without leaving your plan.",
    media: {
      clip: "time-block",
      alt: "A task dragged onto the Open Sunsama day calendar between synced meetings, then resized to fit",
    },
    chips: [
      { tone: "block", title: "Google · Outlook · iCloud", detail: "3 accounts connected" },
      { tone: "agent", title: "Claude connected", detail: "Read 4 meetings, planned around them" },
      { tone: "timer", title: "1:1 with Priya", detail: "11:15 - 11:45 AM" },
    ],
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "Your meetings and your tasks share one calendar in Open Sunsama",
      body: [
        "Open Sunsama is a Google Calendar task planner that also works with Outlook and iCloud. Connect your accounts in Settings and your events appear next to your tasks and time blocks.",
        "You plan in the gaps. Drag a task into a free slot and it becomes a time block beside your meetings.",
        "Events go both ways. Create, move or delete a meeting in Open Sunsama and the change goes back to your calendar.",
      ],
      pointsTitle: "In short",
      points: [
        "Google Calendar, Outlook and iCloud, several accounts at once.",
        "Day, 3-day, week and month views.",
        "Create, move, resize and delete events in the app.",
        "Time blocks stay private in Open Sunsama.",
        "Your AI agent can read your meetings, but never change them.",
      ],
    },
    {
      kind: "media-rows",
      id: "views",
      eyebrow: "See your day",
      heading: "You see every meeting before you plan a single task",
      lead: "A plan that ignores your meetings breaks by 10 am. Here your calendar is part of the plan.",
      rows: [
        {
          title: "The week view shows where your time already went",
          body: [
            "Meetings and time blocks sit side by side, each calendar in its own color. You spot the open afternoons at a glance.",
            "Press D, X, W or M to switch between day, 3-day, week and month.",
          ],
          bullets: [
            "Turn each calendar on or off",
            "Pick a color for each calendar",
            "Pick the calendar new events go to",
          ],
          media: {
            shot: "calendar-week",
            alt: "Open Sunsama week view with synced meetings and color-coded time blocks",
            caption: "The week view: synced meetings and time blocks side by side.",
          },
        },
        {
          title: "Drag tasks into the gaps between meetings",
          body: [
            "The day view puts your task list next to the timeline. Drag a task into a free slot to block time for it.",
            "Drag the block's edge to set how long it takes. If the day doesn't fit, you see it before it starts.",
          ],
          media: {
            clip: "time-block",
            alt: "A task dragged from the list onto the Open Sunsama day calendar, then resized to fit",
            caption: "Drop a task between meetings, then drag its edge to set the length.",
          },
          link: { label: "How time blocking works", href: "/features/time-blocking" },
        },
        {
          title: "Edit a meeting without opening Google Calendar",
          body: [
            "Click an event to see its time, place and your reply. Drag it to move it, or drag its edge to change the length.",
            "The change goes back to Google, Outlook or iCloud. Calendars you can only view stay read-only.",
          ],
          media: {
            shot: "calendar-day",
            alt: "Open Sunsama day view with the task list beside a calendar of meetings and time blocks",
            caption: "Day view: your task list beside meetings and time blocks.",
          },
        },
      ],
    },
    {
      kind: "benefits",
      id: "how-sync-works",
      eyebrow: "How sync works",
      heading: "Events sync both ways, and your time blocks stay private",
      lead: "Here is exactly what moves where, so nothing on your calendar surprises you.",
      items: [
        {
          icon: "refresh",
          title: "Your calendars → Open Sunsama",
          body: "Events sync in on their own in the background. Press Sync now in Settings to pull changes at once.",
        },
        {
          icon: "calendar",
          title: "Open Sunsama → your calendars",
          body: "Events you create, move, resize or delete here are saved back to Google, Outlook or iCloud.",
        },
        {
          icon: "shield",
          title: "Time blocks stay in Open Sunsama",
          body: "Your time blocks don't show up in Google or Outlook, so coworkers don't see your plan.",
        },
        {
          icon: "bot",
          title: "Your AI agent → read only",
          body: "Over MCP, your agent sees each event's title, time, calendar and place. Never who is invited, never the notes.",
          href: "/features/ai-integration",
        },
        {
          icon: "link",
          title: "Many accounts at once",
          body: "Connect a work Google account, a personal one, Outlook and iCloud side by side.",
        },
        {
          icon: "monitor",
          title: "Live on every device",
          body: "The same calendar shows in the web app, the desktop apps and your phone's browser.",
          href: "/download",
        },
      ],
    },
    {
      kind: "agent",
      id: "ai",
      eyebrow: "AI native",
      heading: "Your AI agent reads your meetings and plans around them",
      lead: "Connect Claude, ChatGPT, Cursor or any MCP client with one URL. One call returns your meetings and time blocks for a day.",
      body: [
        "Open Sunsama's hosted MCP server has 24 tools. Two of them read your synced calendars, so your agent plans around real meetings without a second calendar connector.",
        "Calendar access is read-only. Your agent can add and move time blocks, but it can't create, move or cancel a meeting.",
      ],
      prompts: [
        "Plan my afternoon around my meetings.",
        "Find two open hours this week and block them for the launch plan.",
        "What meetings do I have tomorrow, and what should I prep?",
      ],
      tools: ["get_schedule_for_day", "list_calendar_events", "list_tasks", "create_time_block", "link_task_to_time_block"],
      clip: "ai-plan",
      clipCaption: "Claude reads the day and plans the afternoon around meetings. Blocks appear live.",
      links: [
        { label: "Claude setup", href: "/docs/mcp/claude" },
        { label: "ChatGPT setup", href: "/docs/mcp/chatgpt" },
        { label: "Time blocking with AI", href: "/blog/time-blocking-with-ai" },
      ],
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Compare",
      heading: "Open Sunsama syncs all three calendars and keeps your plan private",
      lead: "Sunsama, Motion and Akiflow all sync calendars well. The biggest difference is where your time blocks end up.",
      columns: ["Open Sunsama", "Sunsama", "Motion", "Akiflow"],
      rows: [
        {
          feature: "Calendars",
          cells: [
            { mark: "yes", text: "Google, Outlook, iCloud" },
            { mark: "yes", text: "Google, Outlook, iCloud" },
            { mark: "partial", text: "Google, Outlook; iCloud read-only" },
            { mark: "partial", text: "Google, Outlook" },
          ],
        },
        {
          feature: "Edit events in the app",
          cells: [
            { mark: "yes", text: "All three" },
            { mark: "yes", text: "Two-way" },
            { mark: "partial", text: "Not for iCloud" },
            { mark: "yes", text: "Two-way" },
          ],
        },
        {
          feature: "Time blocks on your real calendar",
          cells: [
            { mark: "no", text: "Stay in Open Sunsama" },
            { mark: "yes", text: "By default; can stay private" },
            { mark: "partial", text: "Google, Outlook only" },
            { mark: "partial", text: "When you lock them" },
          ],
        },
        {
          feature: "AI agent reads meetings over MCP",
          cells: [
            { mark: "yes", text: "Read-only" },
            { text: "Not checked" },
            { mark: "partial", text: "Community-built only" },
            { mark: "yes", text: "Calendar tools" },
          ],
        },
        { feature: "Public REST API", cells: ["yes", "no", "yes", { mark: "no", text: "None listed" }] },
        { feature: "Code you can read and self-host", cells: ["yes", "no", "no", "no"] },
      ],
      sources:
        "Competitor facts come from each app's help docs: [Sunsama calendars](https://help.sunsama.com/docs/calendar-integration), [Sunsama timeboxing](https://help.sunsama.com/docs/timeboxing-choosing-your-calendar), [Motion calendars](https://www.usemotion.com/help/time-management/all-things-calendars/reference-all-things-calendars/supported-providers), [Motion and iCloud](https://www.usemotion.com/help/time-management/all-things-calendars/reference-all-things-calendars/all-things-icloud), [Akiflow Google Calendar](https://akiflow.com/integrations/google-calendar), [Akiflow MCP](https://akiflow.com/mcp) and our [MCP comparison](/blog/best-task-managers-with-mcp). Checked September 2026.",
    },
    {
      kind: "steps",
      id: "connect",
      eyebrow: "Connect",
      heading: "You can connect a calendar in three steps",
      lead: "Add as many accounts as you like. Google, Outlook and iCloud can all be connected at once.",
      steps: [
        {
          title: "Open Settings → Calendars",
          body: "Sign in on the web or in the [desktop app](/download) and open **Settings → Calendars**.",
        },
        {
          title: "Pick your provider",
          body: "Click **Add Google Calendar** or **Add Outlook** and sign in. For **Add iCloud**, enter your Apple ID email and an app-specific password from account.apple.com.",
        },
        {
          title: "Choose what shows",
          body: "Turn each calendar on or off and pick its color. Your meetings then appear next to your tasks.",
        },
      ],
    },
  ],

  faqs: {
    heading: "Questions about calendar sync",
    lead: "Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best Google Calendar task planner?",
        answer:
          "We build Open Sunsama, and we think it is the best pick for most people. Your Google, Outlook and iCloud meetings sit next to your tasks, and any AI agent can plan around them. Pick Sunsama if you want your time blocks to show on your Google Calendar.",
        link: { label: "Best time blocking apps", href: "/blog/best-calendar-apps-time-blocking" },
      },
      {
        question: "Is Open Sunsama's calendar sync two-way?",
        answer:
          "For events, yes. Meetings sync in, and events you create, move or delete in Open Sunsama go back to your calendar. Time blocks stay in Open Sunsama and are not copied to Google or Outlook.",
      },
      {
        question: "Does Open Sunsama work with Outlook?",
        answer:
          "Yes. Click Add Outlook in Settings and sign in with your Microsoft account. Your Outlook events appear next to your tasks, and you can edit them in the app.",
      },
      {
        question: "Can I use Open Sunsama with iCloud Calendar?",
        answer:
          "Yes. Click Add iCloud in Settings, then enter your Apple ID email and an app-specific password from account.apple.com. Your iCloud events sync in and you can edit them.",
      },
      {
        question: "Can I connect more than one Google account?",
        answer:
          "Yes. Add each account in Settings, for example work and personal. You can also mix Google, Outlook and iCloud, and turn single calendars on or off.",
      },
      {
        question: "Can my AI agent move my meetings?",
        answer:
          "No. Over MCP, calendar events are read-only. Your agent sees each meeting's title, time, calendar and place, and plans time blocks around them.",
        link: { label: "Connect your AI", href: "/docs/mcp/overview" },
      },
      {
        question: "Can I see my calendar on my phone?",
        answer:
          "Yes, in your phone's browser. Open Sunsama works as a mobile web app with a calendar view. There is no native phone app yet; desktop apps are ready for Mac, Windows and Linux.",
        link: { label: "Get the desktop app", href: "/download" },
      },
    ],
  },

  related: {
    heading: "Keep exploring",
    lead: "Features that use your calendar, how we compare, and guides for planning around meetings.",
    links: [
      {
        kind: "feature",
        title: "Time blocking",
        description: "Drag tasks into the gaps between meetings.",
        href: "/features/time-blocking",
      },
      {
        kind: "feature",
        title: "AI and MCP",
        description: "Let any agent read your meetings and plan around them.",
        href: "/features/ai-integration",
      },
      {
        kind: "feature",
        title: "Kanban board",
        description: "Plan each day in a column beside your calendar.",
        href: "/features/kanban",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Motion",
        description: "Plan around meetings yourself, or with your agent.",
        href: "/alternative/motion",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Reclaim",
        description: "A planner you control instead of an auto-scheduler.",
        href: "/alternative/reclaim",
      },
      {
        kind: "persona",
        title: "For remote workers",
        description: "Meetings across time zones, and focus time around them.",
        href: "/for/remote-workers",
      },
      {
        kind: "guide",
        title: "Google Calendar vs Sunsama",
        description: "When a calendar alone stops being enough.",
        href: "/blog/google-calendar-vs-sunsama",
      },
      {
        kind: "guide",
        title: "How to reduce meetings",
        description: "Win back time for real work.",
        href: "/blog/how-to-reduce-meetings",
      },
    ],
  },

  cta: {
    heading: "Connect your calendar and plan around it",
    body: "Bring in Google, Outlook and iCloud, drag tasks into the gaps, and let the AI agent you already use plan around your meetings.",
    shot: "calendar-week",
    shotAlt: "Open Sunsama week calendar with synced meetings next to time blocks",
  },

  software: {
    featureList: [
      "Google Calendar, Outlook and iCloud sync",
      "Several calendar accounts at once",
      "Create, move, resize and delete events in the app",
      "Day, 3-day, week and month calendar views",
      "Drag-and-drop time blocking next to meetings",
      "Read-only calendar access for AI agents over MCP",
      "Desktop apps for Mac, Windows and Linux",
    ],
  },
});
