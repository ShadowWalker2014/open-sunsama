/**
 * /for/adhd — the overwhelmed planner (persona 4 in
 * .skills/seo-content/personas.md). Target queries: "adhd planner app",
 * "planner for adhd", "time blindness app", "adhd time blocking".
 * Be kind and careful: Open Sunsama is a planner, not a treatment, and the page
 * makes no medical claims. Competitor facts checked September 2026.
 */

import { defineMarketingPage } from "../types";
import { dayBody, type DayEntry } from "./typical-day";

export const day: DayEntry[] = [
  {
    time: "9:00 AM",
    tone: "plan",
    tag: "Board",
    title: "Pick three tasks, not twelve",
    body: "Drag three tasks from the backlog into Today and give each one a guess in minutes. The day's total shows at the top, so you see 7 hours of work before you commit to it.",
  },
  {
    time: "9:10 AM",
    tone: "block",
    tag: "Time block",
    title: "Give the first task a real slot",
    body: "Drop \"Reply to the landlord\" onto the calendar at 9:30. Now it has a start and an end, not just a spot on a list.",
  },
  {
    time: "9:30 AM - 10:15 AM",
    tone: "focus",
    tag: "Focus mode",
    title: "One thing on the screen",
    body: "Start focus mode. Your list goes away, and you see one task and a timer. The timer keeps count, so you don't have to.",
  },
  {
    time: "10:15 AM",
    tone: "slip",
    tag: "It happens",
    title: "An hour disappears",
    body: "A rabbit hole, a phone call, a nap. Nothing breaks. Your tasks are still where you left them.",
  },
  {
    time: "11:30 AM",
    tone: "agent",
    tag: "Claude",
    title: "\"Help me get back on track\"",
    body: "Ask your AI agent to look at what's left and the free time around your meetings. It suggests a smaller plan, and you say yes or change it.",
  },
  {
    time: "2:00 PM",
    tone: "meeting",
    tag: "Google Calendar",
    title: "Doctor's appointment",
    body: "Your calendar events sit next to your blocks, so the plan works around them.",
  },
  {
    time: "5:30 PM",
    tone: "done",
    tag: "Rollover",
    title: "Stop for the day",
    body: "Check off what you did. The one task you didn't get to rolls to tomorrow on its own. No red wall of overdue tasks waiting for you.",
  },
];

export default defineMarketingPage({
  path: "/for/adhd",
  updated: "2026-09-24",
  seo: {
    title: "ADHD Planner App for Time Blindness and Overwhelm",
    description:
      "Open Sunsama is an ADHD planner app: time estimates for time blindness, a one-task focus mode, and tasks that roll over after a bad day. Any AI agent can help.",
  },
  breadcrumbs: [{ label: "For ADHD" }],

  hero: {
    badge: "For ADHD",
    eyebrow: "A calm, realistic day",
    title: "An ADHD planner app that forgives a bad day",
    accent: "forgives a bad day",
    answer:
      "Open Sunsama is an ADHD-friendly daily planner for a calm, realistic day. You pick a few tasks, see how long they take, and work on one at a time. Anything you don't finish rolls to tomorrow.",
    media: {
      clip: "plan-day",
      alt: "Tasks dragged from the backlog into Today on the Open Sunsama board, with time estimates",
    },
    chips: [
      { tone: "block", title: "Reply to the landlord", detail: "9:30 - 10:00 AM" },
      { tone: "timer", title: "12:40 / 30:00", detail: "Focus" },
      { tone: "agent", title: "Claude connected", detail: "Moved 4 tasks to tomorrow" },
    ],
    secondary: { video: "ai", label: "Watch AI plan a day" },
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "Open Sunsama is an ADHD planner app built around the day going wrong",
      body: [
        "Open Sunsama is a daily planner that works as an ADHD planner app. It shows your tasks on a board of days and your time on a calendar, side by side.",
        "It helps with three things people with ADHD often name: planning too much, losing track of time, and falling behind. You see the hours before you commit. A timer keeps count. And unfinished tasks move to tomorrow without a fuss.",
        "It is a planner, not a treatment. If a plan falls apart, the app doesn't punish you. You just start again.",
      ],
      pointsTitle: "What helps",
      points: [
        "Each day shows the total time you planned, so you stop at a realistic day.",
        "Time blocks give each task a start and an end on your calendar.",
        "Focus mode shows one task and a timer, not your whole list.",
        "Unfinished tasks roll over to tomorrow on their own.",
        "Any AI agent can turn a brain dump into tasks, or help you get back on track.",
      ],
    },
    {
      kind: "media-rows",
      id: "pains",
      eyebrow: "What gets in the way",
      heading: "Each part of Open Sunsama answers something that makes planning hard",
      lead: "People with ADHD describe the same problems again and again: a wall of stuff, time that slips away, and systems that need babysitting. Here is what Open Sunsama does about each one.",
      rows: [
        {
          title: "You see a realistic day before you start it",
          body: [
            "It's easy to put 12 tasks on a day that has room for 4. Then the day feels like a failure by lunch.",
            "Give each task a guess in minutes. Each day adds them up and shows the total at the top. When the number looks too big, move a task to tomorrow.",
          ],
          bullets: [
            "Drag tasks between days, or press **D** to push one to tomorrow",
            "Press **Z** to send a task to the backlog, out of sight but not lost",
            "Mark what matters most with P0 to P3",
          ],
          media: {
            shot: "board",
            alt: "The Open Sunsama board with days as columns, a time estimate on each task and a total at the top of each day",
            caption: "Days as columns. Each day adds up the time you planned.",
          },
          link: { label: "How the board works", href: "/features/kanban" },
        },
        {
          title: "Time blocks make time something you can see",
          body: [
            "Time blindness makes \"later\" feel like forever. A block on the calendar turns a task into a real stretch of time, with an end.",
            "Drag a task onto the day view and stretch it to fit. Your meetings from Google Calendar, Outlook and iCloud sit right beside it.",
            "Turn on email reminders, and Open Sunsama writes to you before a block starts.",
          ],
          media: {
            clip: "time-block",
            alt: "A task dragged onto the day calendar in Open Sunsama and resized to fit",
            caption: "Drag a task onto the calendar and stretch it to fit.",
          },
          link: { label: "Time blocking in Open Sunsama", href: "/features/time-blocking" },
        },
        {
          title: "Focus mode puts one task on the screen",
          body: [
            "Start focus on a task, and the rest of your list goes away. You see the task, its subtasks and a timer.",
            "The timer logs real time next to your guess. Over a few weeks, you learn how long things really take. That is planned vs actual.",
          ],
          media: {
            clip: "focus",
            alt: "Focus mode in Open Sunsama with one task, its subtasks and a running timer",
            caption: "One task, its steps and a timer. Your list stays out of sight.",
          },
          link: { label: "How focus mode works", href: "/features/focus-mode" },
        },
        {
          title: "A bad day doesn't turn into a wall of overdue tasks",
          body: [
            "Some apps greet you with a red list of everything you missed. Open Sunsama moves unfinished tasks to the next day on its own, so tomorrow starts clean.",
            "At the end of the day, check off what you did. That's it. No streaks to break and no score to keep up.",
          ],
          media: {
            clip: "shutdown",
            alt: "Checking off tasks at the end of the day in Open Sunsama",
            caption: "Check off what's done. The rest rolls to tomorrow.",
          },
          link: { label: "Why you always feel behind", href: "/blog/why-do-i-always-feel-behind" },
        },
      ],
    },
    {
      kind: "agent",
      id: "ai",
      eyebrow: "AI native",
      heading: "Claude, ChatGPT or any AI agent can help you get back on track",
      lead: "Connect your AI app with one URL. Then ask for help in plain words, the way you'd ask a friend.",
      body: [
        "Your agent reads your tasks and your calendar. It can turn a messy brain dump into tasks, split a big task into small steps, or move what's left into the free time you really have.",
        "You stay in charge. Nothing is hidden: every change shows up on your board right away, and you can drag it back.",
      ],
      prompts: [
        "Here's my brain dump. Turn it into tasks for this week.",
        "Yesterday went off track. Help me get back on track.",
        "I only have 3 hours today. What should I drop?",
        "Break \"do my taxes\" into small steps.",
      ],
      tools: ["list_tasks", "create_task", "create_subtask", "schedule_task", "get_schedule_for_day"],
      clip: "ai-plan",
      clipCaption: "Claude plans the afternoon over MCP. Tasks and time blocks appear live.",
      links: [
        { label: "Claude setup", href: "/docs/mcp/claude" },
        { label: "ChatGPT setup", href: "/docs/mcp/chatgpt" },
        { label: "Plan your day with Claude", href: "/blog/plan-your-day-with-claude" },
      ],
    },
    {
      kind: "custom",
      id: "typical-day",
      eyebrow: "A typical day",
      heading: "Here is what a day with ADHD can look like in Open Sunsama",
      lead: "An example day, with a slip in the middle. That's on purpose: the plan is built to bend.",
      body: dayBody(day),
    },
    {
      kind: "benefits",
      id: "calm",
      eyebrow: "Calm by design",
      heading: "A calm board keeps the noise down",
      lead: "Fewer things to look at, fewer things to set up, and nothing to babysit.",
      items: [
        {
          icon: "layout",
          title: "Days as columns",
          body: "Today, tomorrow and a backlog. You only see what's on today.",
          href: "/features/kanban",
        },
        {
          icon: "repeat",
          title: "Rollover you don't manage",
          body: "Turn it on once in Settings. Unfinished tasks move to the next day at midnight.",
        },
        {
          icon: "list",
          title: "Subtasks for big tasks",
          body: "Split a scary task into small steps you can check off one by one.",
        },
        {
          icon: "keyboard",
          title: "Quick keys",
          body: "A to add a task, D for tomorrow, Z for the backlog, F for focus. Press Cmd+K to find anything.",
          href: "/features/command-palette",
        },
        {
          icon: "smartphone",
          title: "On your phone",
          body: "Open it in your phone's browser to check today's plan. It syncs with your computer in real time.",
        },
        {
          icon: "shield",
          title: "Your plan stays yours",
          body: "The code is public, and you can run your own copy on your own server. Your tasks don't depend on one company.",
          href: "/docs/self-hosting/docker",
        },
      ],
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Compare",
      heading: "Open Sunsama keeps you in charge when a day goes wrong",
      lead: "People with ADHD often mention Sunsama, Motion and Structured. The big difference is what happens when you fall behind.",
      columns: ["Open Sunsama", "Sunsama", "Motion", "Structured"],
      rows: [
        {
          feature: "Unfinished tasks",
          cells: [
            { mark: "yes", text: "Roll to tomorrow on their own" },
            { mark: "yes", text: "Roll over to the next day" },
            { mark: "partial", text: "The AI moves them for you" },
            { mark: "partial", text: "You replan them (Replan is Pro)" },
          ],
        },
        {
          feature: "Who decides when tasks happen",
          cells: [
            { text: "You, or your agent when you ask" },
            { text: "You, in a guided ritual" },
            { text: "The AI scheduler" },
            { text: "You, on a timeline" },
          ],
        },
        {
          feature: "Time estimate on each task",
          cells: [
            { mark: "yes", text: "Plus actual time from the focus timer" },
            { mark: "yes", text: "Plus planned vs actual" },
            { mark: "yes", text: "A length on each task" },
            { mark: "yes", text: "A length on each timeline item" },
          ],
        },
        {
          feature: "AI help",
          cells: [
            { mark: "yes", text: "Any agent over MCP" },
            { mark: "yes", text: "Sunny assistant, MCP" },
            { mark: "yes", text: "AI scheduler and chat" },
            { mark: "yes", text: "AI task input" },
          ],
        },
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
        "Competitor facts come from each app's website and help docs: [Sunsama](https://www.sunsama.com/pricing), [Sunsama MCP](https://help.sunsama.com/docs/mcp-model-context-protocol), [Motion](https://www.usemotion.com/pricing), [Structured](https://structured.app/) and [Structured Replan](https://help.structured.app/en/articles/4511874). Checked September 2026. More in [Motion alternatives](/blog/motion-alternatives).",
    },
  ],

  faqs: {
    heading: "Questions about planning with ADHD in Open Sunsama",
    lead: "Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best planner app for ADHD?",
        answer:
          "We build Open Sunsama, and we think it is the best pick for most people with ADHD who want to stay in charge. You see a realistic day, work one task at a time, and unfinished tasks roll over. Pick Motion if you'd rather let AI schedule every task, or Structured for a simple phone timeline.",
        link: { label: "Productivity apps for ADHD", href: "/blog/best-productivity-apps-adhd" },
      },
      {
        question: "Is Open Sunsama made for people with ADHD?",
        answer:
          "It's a daily planner for anyone, but its core features match what many people with ADHD ask for: time estimates, time blocks, a one-task focus mode and gentle rollover. It is a planner, not a treatment.",
      },
      {
        question: "Can a planner app help with time blindness?",
        answer:
          "It can help you see time. In Open Sunsama, each task gets a length and a block on the calendar, and the focus timer shows real time passing. Over time, planned vs actual shows how long things really take.",
        link: { label: "How focus mode works", href: "/features/focus-mode" },
      },
      {
        question: "What happens when I fall behind?",
        answer:
          "Nothing bad. Unfinished tasks roll to the next day on their own, and you can send any task to the backlog with one key. If you want help, ask your AI agent to replan what's left.",
      },
      {
        question: "How do I time block with ADHD?",
        answer:
          "Start small: block only your first one or two tasks, not the whole day. Leave gaps between blocks. Drag a task onto the calendar in Open Sunsama and stretch it to your best guess.",
        link: { label: "Getting started with time blocking", href: "/blog/getting-started-with-time-blocking" },
      },
      {
        question: "Does Open Sunsama work on my phone?",
        answer:
          "Yes, in your phone's browser. It works as a mobile web app and syncs with your computer in real time. There is no native phone app yet; desktop apps are ready for Mac, Windows and Linux.",
        link: { label: "Get the desktop app", href: "/download" },
      },
      {
        question: "Can AI turn my brain dump into a plan?",
        answer:
          "Yes. Connect Claude, ChatGPT or another AI app with one URL. Paste your brain dump and ask for tasks. Your agent creates them in Open Sunsama, and you choose what goes on today.",
        link: { label: "Connect your AI", href: "/docs/mcp/overview" },
      },
    ],
  },

  related: {
    heading: "Keep exploring",
    lead: "The features that help most, and guides for when planning feels hard.",
    links: [
      {
        kind: "feature",
        title: "Focus mode",
        description: "One task, its steps and a timer on the screen.",
        href: "/features/focus-mode",
      },
      {
        kind: "feature",
        title: "Time blocking",
        description: "Give each task a start and an end on your calendar.",
        href: "/features/time-blocking",
      },
      {
        kind: "feature",
        title: "AI and MCP",
        description: "Let Claude or ChatGPT help you plan and replan.",
        href: "/features/ai-integration",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Motion",
        description: "Plan it yourself, or let an auto-scheduler move things.",
        href: "/alternative/motion",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Sunsama",
        description: "The same calm daily loop, with code you can read.",
        href: "/alternative/sunsama",
      },
      {
        kind: "guide",
        title: "Productivity apps for ADHD",
        description: "Focus apps, task managers and time blocking tools compared.",
        href: "/blog/best-productivity-apps-adhd",
      },
      {
        kind: "guide",
        title: "Why do I feel overwhelmed?",
        description: "What causes overwhelm, and small steps that help.",
        href: "/blog/why-do-i-feel-overwhelmed",
      },
      {
        kind: "guide",
        title: "Why can't I stick to a schedule?",
        description: "Why plans fall apart, and how to build one that bends.",
        href: "/blog/why-cant-i-stick-to-a-schedule",
      },
      {
        kind: "persona",
        title: "For remote workers",
        description: "Plan around meetings and log off on time.",
        href: "/for/remote-workers",
      },
    ],
  },

  cta: {
    heading: "Plan a calm, realistic day tomorrow",
    body: "Pick three tasks, give each one a slot, and let the rest roll over. If the day goes sideways, you start again with nothing lost.",
    shot: "focus",
    shotAlt: "Open Sunsama focus mode with one task, its subtasks and a running timer",
  },

  software: {
    featureList: [
      "Daily planning on a board of days with a backlog",
      "Time estimates with a daily total",
      "Drag-and-drop time blocking",
      "Focus mode with planned vs actual time",
      "Unfinished tasks roll over to the next day",
      "Email reminders before time blocks",
      "Hosted MCP server for Claude, ChatGPT and any AI agent",
    ],
  },
});
