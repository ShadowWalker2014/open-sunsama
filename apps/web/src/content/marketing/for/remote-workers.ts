/**
 * /for/remote-workers — knowledge workers who plan around meetings from home
 * (personas 1 and 5 in .skills/seo-content/personas.md). Target queries:
 * "daily planner for remote workers", "remote work planner", "time blocking
 * for remote work". Competitor facts checked September 2026.
 */

import { defineMarketingPage } from "../types";
import { dayBody, type DayEntry } from "./typical-day";

export const day: DayEntry[] = [
  {
    time: "8:30 AM",
    tone: "plan",
    tag: "Board",
    title: "Plan the day with your coffee",
    body: "Yesterday's unfinished task is already in Today. Add two more and give each one a time estimate.",
  },
  {
    time: "8:40 AM",
    tone: "agent",
    tag: "ChatGPT",
    title: "\"Plan my day around my meetings\"",
    body: "Your agent reads your tasks and today's meetings, then suggests time blocks in the gaps. You keep the ones you like.",
  },
  {
    time: "9:00 AM - 11:00 AM",
    tone: "focus",
    tag: "Focus mode",
    title: "Deep work before the team is online",
    body: "Your New York team is still asleep. Start focus on the proposal and let the timer run.",
  },
  {
    time: "11:30 AM - 12:00 PM",
    tone: "block",
    tag: "Time block",
    title: "Email and Slack, in one block",
    body: "Reply to everything at once, instead of all morning. When the block ends, you stop.",
  },
  {
    time: "2:00 PM",
    tone: "meeting",
    tag: "Outlook",
    title: "Weekly sync with New York",
    body: "It's 9:00 AM for them. The meeting syncs from Outlook and shows at your local time, next to your blocks.",
  },
  {
    time: "3:00 PM - 4:30 PM",
    tone: "block",
    tag: "Time block",
    title: "Finish the proposal",
    body: "The morning ran long, so drag the block to after the sync. It still fits before the end of your day.",
  },
  {
    time: "5:30 PM",
    tone: "done",
    tag: "Shutdown",
    title: "Log off on time",
    body: "Check off what's done. What's left rolls to tomorrow, so you can close the laptop without a nagging list.",
  },
];

export default defineMarketingPage({
  path: "/for/remote-workers",
  updated: "2026-09-24",
  seo: {
    title: "Daily Planner for Remote Workers: Log Off on Time",
    description:
      "Open Sunsama is a daily planner for remote workers: tasks and meetings in one view, time blocking around calls in any time zone, and a clear end to the day.",
  },
  breadcrumbs: [{ label: "For remote workers" }],

  hero: {
    badge: "For remote workers",
    eyebrow: "Plan around your meetings",
    title: "The daily planner for remote workers who log off on time",
    accent: "who log off on time",
    answer:
      "Open Sunsama is a daily planner for remote workers. Your tasks and your meetings sit in one view, you block time for real work between calls, and at the end of the day the rest rolls to tomorrow.",
    media: {
      clip: "time-block",
      alt: "A task dragged onto the day calendar next to meetings in Open Sunsama, then resized",
    },
    chips: [
      { tone: "block", title: "Deep work: proposal", detail: "9:00 - 11:00 AM" },
      { tone: "agent", title: "ChatGPT connected", detail: "Planned 3 blocks around 4 meetings" },
      { tone: "timer", title: "47:10 / 2:00:00", detail: "Focus" },
    ],
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "Open Sunsama is a daily planner for remote workers that puts tasks and meetings in one place",
      body: [
        "Open Sunsama is a daily planner for remote workers who juggle meetings, messages and real work from home. Your tasks sit on a board of days. Your meetings from Google Calendar, Outlook and iCloud sit on the calendar next to them.",
        "Time blocking for remote work means you drag each task into a gap between calls. You see what fits before the day starts.",
        "When the day ends, you check off what's done. Unfinished tasks roll to tomorrow, so you can log off on time.",
      ],
      pointsTitle: "In short",
      points: [
        "Tasks and meetings in one view, all in one place.",
        "Drag tasks into the gaps between calls to block time.",
        "Meetings show at your local time, wherever your team is.",
        "Focus mode keeps one task and a timer on screen.",
        "Unfinished tasks roll to tomorrow overnight.",
      ],
    },
    {
      kind: "media-rows",
      id: "pains",
      eyebrow: "What remote work does to a day",
      heading: "Each remote work problem has a simple fix in Open Sunsama",
      lead: "Too many tools, meetings across time zones, pings all day, and work that leaks into the evening. Here is what Open Sunsama does about each one.",
      rows: [
        {
          title: "Your tasks and your calendar share one screen",
          body: [
            "Remote days spread across a task app, two calendars and a chat app. You end up switching tabs just to know what's next.",
            "Open Sunsama puts your task board and your calendar side by side. Connect Google Calendar, Outlook or iCloud once, and your meetings show up next to your tasks.",
          ],
          media: {
            shot: "calendar-week",
            alt: "Open Sunsama week view with synced meetings and color-coded time blocks side by side",
            caption: "The week view: meetings and time blocks together.",
          },
          link: { label: "How calendar sync works", href: "/features/calendar-sync" },
        },
        {
          title: "Real work gets a slot between your calls",
          body: [
            "When meetings land all over the day, deep work only happens if it's on the calendar too.",
            "Drag a task into an open gap and resize the block to fit. Meetings with a team in another time zone show at your local time, so you plan around the real hour.",
          ],
          bullets: [
            "Day, 3-day, week and month views",
            "Each block links back to its task and notes",
            "Drag a block to a new slot when a call runs long",
          ],
          media: {
            shot: "calendar-day",
            alt: "Open Sunsama day view with the task list beside a calendar of meetings and time blocks",
            caption: "Day view: tasks on the left, your meetings and blocks on the right.",
          },
          link: { label: "Time blocking in Open Sunsama", href: "/features/time-blocking" },
        },
        {
          title: "Focus mode shuts out the rest of the list",
          body: [
            "Start focus on one task. Your list goes away, and a timer tracks the real time next to your estimate.",
            "After a week, planned vs actual shows where your time really goes.",
          ],
          media: {
            clip: "focus",
            alt: "Starting focus mode on a task in Open Sunsama with a running timer",
            caption: "Start focus on one task. The timer tracks real time.",
          },
          link: { label: "How focus mode works", href: "/features/focus-mode" },
        },
        {
          title: "The end of the day is a real end",
          body: [
            "At home, there's no commute to end the day. Work leaks into the evening.",
            "Make the last thing a shutdown: check off what you did and look at tomorrow. Anything unfinished rolls over at midnight in your time zone, so it won't be lost.",
          ],
          media: {
            clip: "shutdown",
            alt: "Checking off the day's tasks in Open Sunsama at the end of the day",
            caption: "Check off what's done. The rest rolls to tomorrow.",
          },
          link: { label: "How to stop working late", href: "/blog/how-to-stop-working-late" },
        },
      ],
    },
    {
      kind: "agent",
      id: "ai",
      eyebrow: "AI native",
      heading: "Claude, ChatGPT or any AI agent can plan your day around your meetings",
      lead: "Paste one URL into your AI app and sign in. Your agent sees your meetings and tasks together, then blocks time in the gaps.",
      body: [
        "Your agent can read your calendar events, but it can't change them. It only adds and moves your tasks and time blocks.",
        "Every block shows up live on your calendar. Keep it, drag it or delete it.",
      ],
      prompts: [
        "Plan my day around my meetings. Put my top two tasks in focus blocks.",
        "My calls ran long. Move what's left into free slots today and tomorrow.",
        "What's on my calendar this week, and where do I have 2 open hours?",
      ],
      tools: ["get_schedule_for_day", "list_calendar_events", "list_tasks", "create_time_block", "schedule_task"],
      clip: "ai-plan",
      clipCaption: "Claude plans the afternoon around meetings over MCP. Blocks appear live.",
      links: [
        { label: "ChatGPT setup", href: "/docs/mcp/chatgpt" },
        { label: "Claude setup", href: "/docs/mcp/claude" },
        { label: "Plan your day with ChatGPT", href: "/blog/plan-your-day-with-chatgpt" },
      ],
    },
    {
      kind: "custom",
      id: "typical-day",
      eyebrow: "A typical day",
      heading: "Here is how a remote worker might plan a day in Open Sunsama",
      lead: "An example day for someone in Lisbon with a team in New York. The meetings move, and the plan moves with them.",
      body: dayBody(day),
    },
    {
      kind: "benefits",
      id: "details",
      eyebrow: "The details",
      heading: "Small details keep a remote day on track",
      lead: "The things that help when your office is also your home.",
      items: [
        {
          icon: "calendar",
          title: "Three calendar services",
          body: "Google Calendar, Outlook and iCloud, in day, week and month views.",
          href: "/features/calendar-sync",
        },
        {
          icon: "repeat",
          title: "Rollover in your time zone",
          body: "Unfinished tasks move to the next day at your midnight, wherever you work from.",
        },
        {
          icon: "clock",
          title: "Reminders",
          body: "Turn on email reminders to hear from Open Sunsama before a time block starts.",
        },
        {
          icon: "monitor",
          title: "Desktop apps",
          body: "Apps for Mac, Windows and Linux. Press Cmd+Shift+T in any app to add a task.",
          href: "/download",
        },
        {
          icon: "smartphone",
          title: "On your phone",
          body: "Check today's plan in your phone's browser. It syncs with your computer in real time.",
        },
        {
          icon: "github",
          title: "Open source",
          body: "The code is public on GitHub. Self-host it with Docker to keep your plan on your own server.",
          href: "/docs/self-hosting/docker",
        },
      ],
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Compare",
      heading: "Open Sunsama plans around your meetings and leaves you in charge",
      lead: "Remote workers often look at Sunsama, Motion and Reclaim. Here is how each one handles a day full of calls.",
      columns: ["Open Sunsama", "Sunsama", "Motion", "Reclaim"],
      rows: [
        {
          feature: "How your day gets planned",
          cells: [
            { text: "You drag tasks, or your agent does" },
            { text: "You drag tasks, in a guided ritual" },
            { text: "AI schedules tasks for you" },
            { text: "AI schedules by priority" },
          ],
        },
        {
          feature: "Moves tasks without asking",
          cells: [{ text: "No" }, { text: "No" }, { text: "Yes" }, { text: "Yes" }],
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
        { feature: "Code you can read and self-host", cells: ["yes", "no", "no", "no"] },
        {
          feature: "Desktop apps",
          cells: [
            { mark: "yes", text: "Mac, Windows, Linux" },
            { mark: "yes", text: "Mac, Windows, Linux" },
            { mark: "yes", text: "Desktop app" },
            { mark: "no", text: "Web app only" },
          ],
        },
        {
          feature: "Phone",
          cells: [
            { mark: "partial", text: "Mobile web app" },
            { mark: "yes", text: "iOS and Android" },
            { mark: "yes", text: "iOS and Android" },
            { mark: "no", text: "Web app only" },
          ],
        },
      ],
      sources:
        "Competitor facts come from each app's website, pricing page and help docs: [Sunsama](https://www.sunsama.com/pricing), [Sunsama MCP](https://help.sunsama.com/docs/mcp-model-context-protocol), [Motion](https://www.usemotion.com/pricing) and [Reclaim](https://reclaim.ai/pricing). Checked September 2026. More in [Motion alternatives](/blog/motion-alternatives) and [the best time blocking apps](/blog/best-calendar-apps-time-blocking).",
    },
  ],

  faqs: {
    heading: "Questions about planning remote work in Open Sunsama",
    lead: "Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best daily planner for remote workers?",
        answer:
          "We build Open Sunsama, and we think it is the best pick for most remote workers. Tasks and meetings share one view, you block time between calls, and any AI agent can plan with you. Pick Motion or Reclaim if you want AI to schedule every task for you.",
        link: { label: "Daily planners for remote workers", href: "/blog/best-daily-planner-remote-workers" },
      },
      {
        question: "How do I time block when my day is full of meetings?",
        answer:
          "Block only the gaps. Look at the day view, find the open stretches between calls, and drag one task into each. Keep a 30-minute block for email and chat so it doesn't eat the whole day.",
        link: { label: "How to protect focus time", href: "/blog/how-to-protect-focus-time" },
      },
      {
        question: "Does Open Sunsama work with Outlook and Google Calendar?",
        answer:
          "Yes. Connect Google Calendar, Outlook or iCloud in Settings. Your meetings show up next to your tasks and time blocks.",
        link: { label: "How calendar sync works", href: "/features/calendar-sync" },
      },
      {
        question: "How does Open Sunsama handle time zones?",
        answer:
          "Meetings from any time zone show at your local time, next to your tasks. Rollover runs at midnight in the time zone set in your profile, so it works wherever you are.",
      },
      {
        question: "Can AI plan my day around my meetings?",
        answer:
          "Yes. Connect Claude, ChatGPT or any MCP client with one URL. Your agent reads your meetings and tasks, then creates time blocks in the gaps. It can't move your meetings.",
        link: { label: "Connect your AI", href: "/docs/mcp/overview" },
      },
      {
        question: "Does Open Sunsama have a phone app?",
        answer:
          "It works in your phone's browser as a mobile web app and syncs in real time. There is no native phone app yet. Desktop apps are ready for Mac, Windows and Linux.",
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
    lead: "Features for a day full of calls, how we compare, and guides for working from home.",
    links: [
      {
        kind: "feature",
        title: "Calendar sync",
        description: "Google, Outlook and iCloud events next to your plan.",
        href: "/features/calendar-sync",
      },
      {
        kind: "feature",
        title: "Time blocking",
        description: "Drag tasks into the gaps between your meetings.",
        href: "/features/time-blocking",
      },
      {
        kind: "feature",
        title: "Focus mode",
        description: "One task and a timer, with planned vs actual.",
        href: "/features/focus-mode",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Sunsama",
        description: "The same daily loop, with code you can read and run.",
        href: "/alternative/sunsama",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Reclaim",
        description: "Plan around meetings yourself, or with your agent.",
        href: "/alternative/reclaim",
      },
      {
        kind: "guide",
        title: "Daily planners for remote workers",
        description: "Planners compared for a day of calls and deep work.",
        href: "/blog/best-daily-planner-remote-workers",
      },
      {
        kind: "guide",
        title: "How to work from home productively",
        description: "Habits and setups that keep a home workday on track.",
        href: "/blog/productive-working-from-home",
      },
      {
        kind: "guide",
        title: "How to stop working late",
        description: "End the day on time without feeling behind.",
        href: "/blog/how-to-stop-working-late",
      },
      {
        kind: "persona",
        title: "For developers",
        description: "Keyboard-first planning with an API and MCP.",
        href: "/for/developers",
      },
    ],
  },

  cta: {
    heading: "Plan tomorrow around your meetings, then log off",
    body: "Drag your tasks into the gaps between calls, work one block at a time, and let the rest roll over when the day is done.",
    shot: "calendar-week",
    shotAlt: "Open Sunsama week calendar with meetings and time blocks side by side",
  },

  software: {
    featureList: [
      "Google Calendar, Outlook and iCloud sync",
      "Drag-and-drop time blocking around meetings",
      "Day, 3-day, week and month calendar views",
      "Focus mode with planned vs actual time",
      "Unfinished tasks roll over at your midnight",
      "Hosted MCP server for Claude, ChatGPT and any AI agent",
      "Desktop apps for Mac, Windows and Linux",
    ],
  },
});
