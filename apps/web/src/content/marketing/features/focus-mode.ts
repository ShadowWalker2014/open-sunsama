/**
 * /features/focus-mode. Target queries: "focus mode app", "focus timer app",
 * "pomodoro timer with tasks". Open Sunsama's timer counts up against the
 * task's estimate; there is no built-in Pomodoro cycle, and the page says so.
 * Competitor facts checked September 2026 (see the comparison's sources).
 */

import { defineMarketingPage } from "../types";

export default defineMarketingPage({
  path: "/features/focus-mode",
  updated: "2026-09-24",
  seo: {
    title: "Focus Mode App With a Timer on Every Task",
    description:
      "Open Sunsama is a focus mode app for your daily plan. Open one task full screen, run a focus timer against your estimate and see planned vs actual at night.",
  },
  breadcrumbs: [{ label: "Features", href: "/#features" }, { label: "Focus mode" }],

  hero: {
    badge: "Feature",
    eyebrow: "Focus mode",
    title: "The focus mode app built into your daily plan",
    accent: "built into your daily plan",
    answer:
      "Open Sunsama's focus mode opens one task full screen with a timer. It counts your real time against your estimate, so you finish the day knowing planned vs actual.",
    media: {
      clip: "focus",
      alt: "A task opened in Open Sunsama focus mode, with the timer started next to its estimate",
    },
    chips: [
      { tone: "timer", title: "0:42 / 1:30", detail: "Finalize Q4 roadmap" },
      { tone: "block", title: "Deep work: Q4 roadmap", detail: "9:30 - 11:00 AM" },
      { tone: "agent", title: "Claude connected", detail: "Planned 4:45, spent 5:10 today" },
    ],
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "Focus mode shows one task, one timer and nothing else",
      body: [
        "A focus mode app hides everything except the work in front of you. In Open Sunsama, press F on a task and it fills the screen: its title, subtasks, notes and a focus timer.",
        "Press Space to start the timer. It counts up next to your estimate, like 0:42 / 1:30, and saves the real time to the task.",
        "Finish the task and the next one on today's list opens. When the list is empty, you see how many tasks you did and how long you focused.",
      ],
      pointsTitle: "In short",
      points: [
        "Press F on any task to open it in focus mode.",
        "Space starts and pauses the timer.",
        "The timer saves actual time next to your estimate.",
        "Finishing a task opens the next one on today's list.",
        "Your AI agent can read planned vs actual over MCP.",
      ],
    },
    {
      kind: "story",
      id: "how-it-works",
      eyebrow: "How it works",
      heading: "Plan it, block it, focus on it, then close the day",
      lead: "Focus mode is one step in a simple daily loop. Every clip below is a real recording of the app.",
      steps: [
        {
          icon: "layout",
          eyebrow: "1 · Pick",
          title: "Pick today's tasks and estimate each one",
          body: "Drag tasks into Today and give each one a time estimate. The estimate is what the timer measures against later.",
          clip: "plan-day",
          link: { label: "See the kanban board", href: "/features/kanban" },
        },
        {
          icon: "calendar",
          eyebrow: "2 · Block",
          title: "Give the hard task a slot on the calendar",
          body: "Drag your most important task into a free slot, away from your meetings. That block is your protected focus time.",
          clip: "time-block",
          link: { label: "How time blocking works", href: "/features/time-blocking" },
        },
        {
          icon: "timer",
          eyebrow: "3 · Focus",
          title: "Open the task full screen and start the timer",
          body: "Press F, then Space. Work through the subtasks and write notes as you go. Press Esc when you want the board back.",
          clip: "focus",
        },
        {
          icon: "check",
          eyebrow: "4 · Close",
          title: "End the day with planned vs actual",
          body: "Check off what you finished. Each done task keeps its real time next to its estimate, so tomorrow's plan gets more honest.",
          clip: "shutdown",
        },
      ],
    },
    {
      kind: "media-rows",
      id: "planned-vs-actual",
      eyebrow: "Planned vs actual",
      heading: "The focus timer shows how long tasks really take",
      lead: "Tasks often take longer than we think. The timer turns that guess into a number you can learn from.",
      rows: [
        {
          title: "The timer runs against your estimate",
          body: [
            "The timer sits next to the task title and shows real time over planned time. Press W to change the estimate, or E to fix the real time by hand.",
            "Start a timer on another task and the first one stops and saves on its own. You never lose time you forgot to log.",
          ],
          bullets: [
            "Counts up, so a long task never cuts you off",
            "The timer keeps running across your devices",
            "Real time saves to the task when you stop",
          ],
          media: {
            shot: "focus",
            alt: "Open Sunsama focus mode showing a task with 0:42 of 1:30 spent, its subtasks and notes",
            caption: "0:42 spent of a 1:30 estimate, with subtasks and notes in view.",
          },
        },
        {
          title: "Done tasks keep their real time",
          body: [
            "Check a task off and it moves to Completed with both numbers, like 0:15 / 0:15. At the end of the day you can see where your hours went.",
            "Over a week, you learn which tasks you always underestimate. Then you give them more time.",
          ],
          media: {
            clip: "shutdown",
            alt: "Tasks checked off at the end of the day in Open Sunsama, moving into the Completed list with planned and actual time",
            caption: "Finished tasks move to Completed with planned and actual time.",
          },
          link: { label: "How to track your time", href: "/blog/how-to-track-your-time" },
        },
      ],
    },
    {
      kind: "benefits",
      id: "details",
      eyebrow: "The details",
      heading: "Focus mode keeps your hands on the keyboard",
      lead: "Every action in focus mode has a key, so you never reach for the mouse mid-thought.",
      items: [
        {
          icon: "keyboard",
          title: "Space, E and W",
          body: "Space starts or pauses the timer. E edits real time, W edits the estimate.",
          href: "/features/command-palette",
        },
        {
          icon: "calendar-clock",
          title: "D, Z and Shift+Z",
          body: "Not today? D snoozes a day, Z sends it to the backlog, Shift+Z moves it to next week.",
        },
        {
          icon: "list",
          title: "Subtasks and notes",
          body: "Tick subtasks and write rich notes in place. Attach files and images to the task.",
        },
        {
          icon: "calendar",
          title: "Today's calendar on hover",
          body: "Hover the right edge of the screen to see today's meetings and blocks.",
        },
        {
          icon: "zap",
          title: "Next task opens by itself",
          body: "Complete a task and the next one on today's list opens. No trip back to the board.",
        },
        {
          icon: "check",
          title: "An end to the day",
          body: "When today's list is empty, you see how many tasks you did and how long you focused.",
        },
      ],
    },
    {
      kind: "agent",
      id: "ai",
      eyebrow: "AI native",
      heading: "Your AI agent can read planned vs actual and plan tomorrow",
      lead: "Connect Claude, ChatGPT, Cursor or any MCP client with one URL. Your agent sees each task's estimate and real time.",
      body: [
        "Open Sunsama has a hosted MCP server with 24 tools. Tasks come back with their estimate and actual minutes, so your agent can spot the tasks you always underestimate.",
        "Ask it to plan tomorrow with that in mind. It creates focus blocks around your meetings, and you can drag any of them.",
      ],
      prompts: [
        "Compare my planned and actual time for today. What ran over?",
        "Plan tomorrow with bigger estimates for the tasks I ran over on.",
        "Block 90 minutes of focus time for my top task tomorrow morning.",
      ],
      tools: ["get_schedule_for_day", "list_tasks", "update_task", "create_time_block", "link_task_to_time_block"],
      clip: "ai-plan",
      clipCaption: "Claude plans the afternoon over MCP. Tasks and time blocks appear live.",
      links: [
        { label: "Claude setup", href: "/docs/mcp/claude" },
        { label: "ChatGPT setup", href: "/docs/mcp/chatgpt" },
        { label: "Plan your day with Claude", href: "/blog/plan-your-day-with-claude" },
      ],
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Compare",
      heading: "Open Sunsama times your tasks inside your plan, with code you can run",
      lead: "Sunsama and TickTick have strong focus timers too. Todoist leaves it to add-on apps. Here is how they differ.",
      columns: ["Open Sunsama", "Sunsama", "TickTick", "Todoist"],
      rows: [
        {
          feature: "Timer on a task",
          cells: [
            { mark: "yes", text: "Counts up to your estimate" },
            { mark: "yes", text: "Task timer" },
            { mark: "yes", text: "Pomo or stopwatch" },
            { mark: "no", text: "Add-on apps" },
          ],
        },
        {
          feature: "Pomodoro cycles with breaks",
          cells: [
            { mark: "no", text: "Not built in" },
            { mark: "yes", text: "Pomodoro tab" },
            { mark: "yes", text: "25 / 5 by default" },
            { mark: "no", text: "Add-on apps" },
          ],
        },
        {
          feature: "Planned vs actual",
          cells: [
            { mark: "yes", text: "On every task" },
            { mark: "yes", text: "Planned and actual times" },
            { mark: "partial", text: "Estimated pomos" },
            "no",
          ],
        },
        {
          feature: "AI agents over MCP",
          cells: [
            { mark: "yes", text: "Hosted, any MCP client" },
            { mark: "yes", text: "Hosted" },
            { mark: "yes", text: "Hosted" },
            { mark: "yes", text: "Hosted" },
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
        "Competitor facts come from each app's help docs: [Sunsama focus mode](https://help.sunsama.com/docs/usage-guides/focus-mode/), [TickTick Pomodoro](https://help.ticktick.com/articles/7055782025193586688), [TickTick focus](https://help.ticktick.com/articles/7055782010496745472), [Pomodoro with Todoist](https://www.todoist.com/help/articles/pomodoro-with-todoist-7u42Gr) and our [MCP comparison](/blog/best-task-managers-with-mcp). Checked September 2026.",
    },
    {
      kind: "steps",
      id: "start",
      eyebrow: "Get started",
      heading: "You can run your first focus session in three steps",
      lead: "Start with one task you have put off. That is where focus mode helps most.",
      steps: [
        {
          title: "Create your account",
          body: "Sign up on the web or [download the desktop app](/download) for Mac, Windows or Linux.",
        },
        {
          title: "Add a task with an estimate",
          body: "Press A to add a task to Today. Give it a time estimate, even a rough one.",
        },
        {
          title: "Press F, then Space",
          body: "The task opens full screen and the timer starts. Work until it's done, then check it off.",
        },
      ],
    },
  ],

  faqs: {
    heading: "Questions about focus mode",
    lead: "Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best focus mode app?",
        answer:
          "We build Open Sunsama, and we think it is the best pick if you plan your day first. Focus mode opens right from your plan and tracks planned vs actual time. Pick TickTick if you want Pomodoro cycles and focus stats in a to-do list.",
        link: { label: "Best focus apps for deep work", href: "/blog/best-focus-apps-deep-work" },
      },
      {
        question: "Does Open Sunsama have a Pomodoro timer?",
        answer:
          "No. The focus timer counts up against your estimate and has no set work and break cycles. If you like 25-minute sprints, split a task into 25-minute estimates and take a break between them.",
        link: { label: "Pomodoro apps with tasks", href: "/blog/best-pomodoro-apps-task-management" },
      },
      {
        question: "How do I start focus mode?",
        answer:
          "Hover a task and press F, or right-click it and pick Focus. Press Space to start the timer and Esc to leave focus mode.",
      },
      {
        question: "What is planned vs actual time?",
        answer:
          "Planned time is your estimate. Actual time is what the focus timer measured. Seeing both on each task shows which work you always underestimate.",
      },
      {
        question: "Does the timer keep running if I switch devices?",
        answer:
          "Yes. The timer lives on the server, so a timer you start on your laptop keeps counting in the desktop app and in your phone's browser.",
      },
      {
        question: "Can I use focus mode on my phone?",
        answer:
          "Yes, in your phone's browser. Open Sunsama works as a mobile web app. There is no native phone app yet; desktop apps are ready for Mac, Windows and Linux.",
        link: { label: "Get the desktop app", href: "/download" },
      },
    ],
  },

  related: {
    heading: "Keep exploring",
    lead: "Features that feed focus mode, how we compare, and guides to protect your focus.",
    links: [
      {
        kind: "feature",
        title: "Time blocking",
        description: "Give your hardest task a slot before the day starts.",
        href: "/features/time-blocking",
      },
      {
        kind: "feature",
        title: "Kanban board",
        description: "Plan today in one column, then focus on each card.",
        href: "/features/kanban",
      },
      {
        kind: "feature",
        title: "Keyboard shortcuts",
        description: "Every focus mode action has a key.",
        href: "/features/command-palette",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Sunsama",
        description: "The same focus loop, with code you can read and run.",
        href: "/alternative/sunsama",
      },
      {
        kind: "persona",
        title: "For ADHD",
        description: "One task on screen and a timer that keeps you honest.",
        href: "/for/adhd",
      },
      {
        kind: "persona",
        title: "For developers",
        description: "Deep work blocks, keyboard first, and an agent in your editor.",
        href: "/for/developers",
      },
      {
        kind: "guide",
        title: "How to protect your focus time",
        description: "Keep meetings from eating your best hours.",
        href: "/blog/how-to-protect-focus-time",
      },
      {
        kind: "guide",
        title: "The Pomodoro technique",
        description: "How it works, and when a count-up timer fits better.",
        href: "/blog/pomodoro-technique-guide",
      },
    ],
  },

  cta: {
    heading: "Pick one task and start the timer",
    body: "Open it full screen, work until it's done, and let the AI agent you already use learn from your planned vs actual time.",
    shot: "focus",
    shotAlt: "Open Sunsama focus mode with a task, its timer, subtasks and notes",
  },

  software: {
    featureList: [
      "Full-screen focus mode for one task",
      "Focus timer that tracks actual time against your estimate",
      "Planned vs actual time on every task",
      "Keyboard shortcuts for the timer, estimates and snoozing",
      "Next task opens when you finish one",
      "Hosted MCP server for Claude, ChatGPT and any AI agent",
      "Desktop apps for Mac, Windows and Linux",
    ],
  },
});
