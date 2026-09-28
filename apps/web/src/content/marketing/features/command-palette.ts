/**
 * /features/command-palette. Target queries: "keyboard-first task manager",
 * "command palette". Shortcuts mirror SHORTCUTS in
 * src/hooks/useKeyboardShortcuts.tsx, the focus-mode handler in
 * src/routes/app/focus.$taskId.tsx and the desktop global shortcut in
 * apps/desktop/src-tauri/src/lib.rs. Update this list when those change.
 * Competitor facts checked September 2026 (see the comparison's sources).
 */

import { defineMarketingPage } from "../types";

export interface ShortcutItem {
  /** Keys pressed together, Mac symbols (⌘ ⇧ ⌥). */
  keys: string[];
  label: string;
}

export interface ShortcutGroup {
  title: string;
  /** When the group's keys work. */
  note: string;
  items: ShortcutItem[];
}

/** Every shortcut in the app, grouped the way the in-app "?" sheet groups them. */
export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Anywhere in the app",
    note: "Works on the board, the task list and the calendar.",
    items: [
      { keys: ["⌘", "K"], label: "Search, or run a command" },
      { keys: ["A"], label: "Add a task" },
      { keys: ["?"], label: "Show every shortcut" },
      { keys: ["⌘", "Z"], label: "Undo" },
      { keys: ["⌘", "⇧", "Z"], label: "Redo" },
      { keys: ["⇧", "Space"], label: "Jump to Today" },
      { keys: ["⇧", "→"], label: "Next day" },
      { keys: ["⇧", "←"], label: "Previous day" },
    ],
  },
  {
    title: "On the task under your cursor",
    note: "Hover a task, then press the key.",
    items: [
      { keys: ["C"], label: "Complete it" },
      { keys: ["F"], label: "Open it in focus mode" },
      { keys: ["X"], label: "Add it to the calendar" },
      { keys: ["E"], label: "Edit the time estimate" },
      { keys: ["D"], label: "Move it to tomorrow" },
      { keys: ["Z"], label: "Move it to the backlog" },
      { keys: ["⇧", "Z"], label: "Move it to next week" },
      { keys: ["H"], label: "Hide or show subtasks" },
      { keys: ["⌘", "D"], label: "Duplicate it" },
      { keys: ["⌘", "⌫"], label: "Delete it" },
      { keys: ["⌥", "⇧", "↑"], label: "Move it to the top" },
      { keys: ["⌥", "⇧", "↓"], label: "Move it to the bottom" },
    ],
  },
  {
    title: "Calendar",
    note: "Same keys as Google Calendar.",
    items: [
      { keys: ["D"], label: "Day view" },
      { keys: ["X"], label: "3-day view" },
      { keys: ["W"], label: "Week view" },
      { keys: ["M"], label: "Month view" },
      { keys: ["T"], label: "Jump to today" },
      { keys: ["J"], label: "Previous range" },
      { keys: ["K"], label: "Next range" },
    ],
  },
  {
    title: "Focus mode",
    note: "While a task is open full screen.",
    items: [
      { keys: ["Space"], label: "Start or pause the timer" },
      { keys: ["E"], label: "Edit the real time" },
      { keys: ["W"], label: "Edit the estimate" },
      { keys: ["D"], label: "Snooze it a day" },
      { keys: ["Z"], label: "Move it to the backlog" },
      { keys: ["⇧", "Z"], label: "Move it to next week" },
      { keys: ["Esc"], label: "Leave focus mode" },
    ],
  },
  {
    title: "Desktop app",
    note: "Works from any app on your computer. On Windows and Linux, use the Windows (Super) key for ⌘.",
    items: [
      { keys: ["⌘", "⇧", "T"], label: "Add a task for today" },
      { keys: ["⌘", "⇧", "F"], label: "Focus on your current task" },
      { keys: ["⌘", "⇧", "O"], label: "Show or hide Open Sunsama" },
    ],
  },
];

/** "⌘ + K" style text for the prerendered page and screen readers. */
export const shortcutText = (keys: string[]) => keys.join(" + ");

export default defineMarketingPage({
  path: "/features/command-palette",
  updated: "2026-09-24",
  seo: {
    title: "Keyboard-First Task Manager With a Command Palette",
    description:
      "Open Sunsama is a keyboard-first task manager. Press Cmd+K to find any task, idea or meeting, then plan your day with single-key shortcuts or ask any AI agent.",
  },
  breadcrumbs: [{ label: "Features", href: "/#features" }, { label: "Command palette" }],

  hero: {
    badge: "Feature",
    eyebrow: "Command palette",
    title: "The keyboard-first task manager",
    accent: "keyboard-first",
    answer:
      "Open Sunsama is a keyboard-first task manager. Press Cmd+K to find any task, idea or meeting, then plan the day with single keys: C to complete, D for tomorrow, F to focus.",
    media: {
      clip: "command-palette",
      alt: "The Open Sunsama command palette opening with Cmd+K, searching tasks and jumping to one",
    },
    chips: [
      { tone: "block", title: "⌘K  review", detail: "5 tasks, 2 ideas" },
      { tone: "timer", title: "F", detail: "Focus on this task" },
      { tone: "agent", title: "Claude connected", detail: "Or just ask your agent" },
    ],
  },

  sections: [
    {
      kind: "answer",
      id: "answer",
      eyebrow: "The short answer",
      heading: "A keyboard-first task manager lets you plan without the mouse",
      body: [
        "A keyboard-first task manager puts every action on a key. In Open Sunsama, the command palette opens with Cmd+K (Ctrl+K on Windows and Linux). Type to search your tasks, ideas and calendar events, or to run a command.",
        "On the board, hover a task and press one key. C completes it, D moves it to tomorrow, Z sends it to the backlog and F opens it in focus mode.",
        "Press ? any time to see the full list. It is also right below.",
      ],
      pointsTitle: "In short",
      points: [
        "Cmd+K searches tasks, ideas and meetings in one box.",
        "Type a new task's name and press Enter to add it to today.",
        "Single keys act on the task under your cursor.",
        "The calendar uses Google Calendar's keys: D, W, M, T.",
        "Press ? to see every shortcut.",
      ],
    },
    {
      kind: "media-rows",
      id: "palette",
      eyebrow: "The palette",
      heading: "One box finds any task, idea or meeting and runs any command",
      lead: "You don't need to know where something lives. Type a few letters and press Enter.",
      rows: [
        {
          title: "Search everything at once",
          body: [
            "Results come back in groups: tasks with their dates, ideas with their board, and calendar events. Pick a meeting and the calendar opens on its day.",
            "Use the arrow keys to move, Enter to open and Esc to close.",
          ],
          media: {
            shot: "command-palette",
            alt: "The Open Sunsama command palette searching for review, with matching tasks and ideas grouped",
            caption: "Search for review: five tasks and two ideas, in groups.",
          },
        },
        {
          title: "Run a command, or add a task that isn't there",
          body: [
            "The same box runs commands. Go to the calendar or settings, switch to dark mode, or open the steps to connect your AI assistant.",
            "No match? Press Enter on **Create** and the task lands on today's list.",
          ],
          bullets: [
            "Hover a task first to see its actions at the top",
            "Complete, defer, add to calendar, duplicate or delete",
            "Shortcuts are shown next to each command, so you learn them",
          ],
          media: {
            clip: "command-palette",
            alt: "Cmd+K opens the Open Sunsama command palette; typing filters tasks and Enter jumps to one",
            caption: "Press Cmd+K, type, and press Enter to jump to the task.",
          },
        },
        {
          title: "Switch calendar views with one key",
          body: [
            "The calendar uses the keys you already know from Google Calendar. D for day, X for 3-day, W for week and M for month.",
            "T jumps back to today. J and K step back and forward.",
          ],
          media: {
            shot: "calendar-week",
            alt: "Open Sunsama week view with meetings and color-coded time blocks",
            caption: "Press W for the week view, D for a single day.",
          },
          link: { label: "How calendar sync works", href: "/features/calendar-sync" },
        },
      ],
    },
    {
      kind: "custom",
      id: "shortcuts",
      eyebrow: "Every shortcut",
      heading: "Every action in Open Sunsama has a key",
      lead: "It matches the list you see when you press ? in the app, plus three desktop-app keys that work from any app. On Windows and Linux, use Ctrl for ⌘ and Alt for ⌥ in the app, and the Windows key for ⌘ in the desktop keys.",
      body: SHORTCUT_GROUPS.map(
        (group) =>
          `**${group.title}.** ${group.note} ${group.items
            .map((item) => `${shortcutText(item.keys)}: ${item.label.toLowerCase()}`)
            .join("; ")}.`
      ),
    },
    {
      kind: "agent",
      id: "ai",
      eyebrow: "AI native",
      heading: "Or skip the keys and ask any AI agent",
      lead: "Connect Claude, ChatGPT, Cursor or any MCP client with one URL. Your agent can do what the palette does, in plain words.",
      body: [
        "Open Sunsama has a hosted MCP server with 24 tools. Your agent can add, find, move and complete tasks, and block time on your calendar.",
        "Developers can stay in their editor. Ask Claude Code or Cursor to add a task without leaving the terminal.",
      ],
      prompts: [
        "Add a P1 task to review the Q3 roadmap on Thursday, 45 minutes.",
        "Move everything I didn't finish today to tomorrow.",
        "What's left on my plate this afternoon?",
      ],
      tools: ["create_task", "list_tasks", "schedule_task", "complete_task", "update_task"],
      clip: "ai-plan",
      clipCaption: "Claude plans the afternoon over MCP. Tasks and time blocks appear live.",
      links: [
        { label: "Claude Code setup", href: "/docs/mcp/claude" },
        { label: "Cursor setup", href: "/docs/mcp/cursor" },
        { label: "All 24 tools", href: "/features/ai-integration" },
      ],
    },
    {
      kind: "comparison",
      id: "compare",
      eyebrow: "Compare",
      heading: "Open Sunsama pairs Cmd+K with an API, any agent and code you can run",
      lead: "Sunsama, Akiflow and Todoist all have a Cmd+K palette too. Akiflow's command bar also opens from any app. Here is what else each one gives you.",
      columns: ["Open Sunsama", "Sunsama", "Akiflow", "Todoist"],
      rows: [
        {
          feature: "Cmd+K command palette",
          cells: [
            { mark: "yes", text: "Tasks, ideas and events" },
            { mark: "yes", text: "Command bar" },
            { mark: "yes", text: "Command bar" },
            { mark: "yes", text: "Command menu" },
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
        {
          feature: "Public REST API",
          cells: ["yes", "no", { mark: "no", text: "None listed" }, "yes"],
        },
        { feature: "Code you can read and self-host", cells: ["yes", "no", "no", "no"] },
        {
          feature: "Desktop apps",
          cells: [
            { mark: "yes", text: "Mac, Windows, Linux" },
            { mark: "yes", text: "Mac, Windows, Linux" },
            { mark: "yes", text: "Mac, Windows" },
            { mark: "yes", text: "Desktop app" },
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
        "Competitor facts come from each app's help docs: [Sunsama command bar](https://help.sunsama.com/docs/command-palette), [Akiflow command bar](https://product.akiflow.com/help/articles/6483573-command-bar), [Todoist command menu](https://www.todoist.com/help/articles/navigate-faster-with-the-command-menu-and-your-keyboard-w3u8oBlmL) and our [MCP comparison](/blog/best-task-managers-with-mcp). Checked September 2026.",
    },
    {
      kind: "steps",
      id: "start",
      eyebrow: "Get started",
      heading: "You can learn the keys in your first day",
      lead: "Start with three keys. The rest come with use.",
      steps: [
        {
          title: "Create your account",
          body: "Sign up on the web or [download the desktop app](/download) for Mac, Windows or Linux.",
        },
        {
          title: "Press Cmd+K and type",
          body: "Find a task or type a new one and press Enter. That's the only key you need on day one.",
        },
        {
          title: "Learn A, D and C",
          body: "A adds a task. On a hovered task, D moves it to tomorrow and C completes it. Press ? when you want more.",
        },
      ],
    },
  ],

  faqs: {
    heading: "Questions about the command palette and shortcuts",
    lead: "Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues).",
    items: [
      {
        question: "What is the best keyboard-first task manager?",
        answer:
          "We build Open Sunsama, and we think it is the best pick for most people. Every action has a key, Cmd+K finds anything, and any AI agent can do the same actions for you. The desktop app adds a task or starts focus mode from any app. Pick Akiflow if you need its full command bar in every app.",
        link: { label: "Akiflow alternatives", href: "/blog/akiflow-alternatives" },
      },
      {
        question: "What is a command palette?",
        answer:
          "It is a search box that opens with a key, usually Cmd+K. You type what you want, a task or an action, and press Enter. You never hunt through menus.",
      },
      {
        question: "How do I open the command palette in Open Sunsama?",
        answer: "Press Cmd+K on a Mac or Ctrl+K on Windows and Linux. You can also click Search at the top of the app.",
      },
      {
        question: "How do I see every keyboard shortcut?",
        answer: "Press ? anywhere in the app. A sheet lists every shortcut by group: general, navigation, task actions, calendar and focus mode. In the desktop app it also lists the keys that work from any app.",
      },
      {
        question: "Can I change the keyboard shortcuts?",
        answer:
          "Not yet. The keys are fixed today. The code is public, so you can change them in a self-hosted copy.",
        link: { label: "Self-host with Docker", href: "/docs/self-hosting/docker" },
      },
      {
        question: "Do the shortcuts work on Windows and Linux?",
        answer:
          "Yes. Use Ctrl where a Mac uses Cmd, and Alt where a Mac uses Option. They work in the web app and the desktop apps.",
        link: { label: "Get the desktop app", href: "/download" },
      },
    ],
  },

  related: {
    heading: "Keep exploring",
    lead: "Features you drive from the keyboard, how we compare, and who it suits.",
    links: [
      {
        kind: "feature",
        title: "Kanban board",
        description: "Move cards between days with D, Z and Shift+Z.",
        href: "/features/kanban",
      },
      {
        kind: "feature",
        title: "Focus mode",
        description: "Press F, then Space, and the timer starts.",
        href: "/features/focus-mode",
      },
      {
        kind: "feature",
        title: "AI and MCP",
        description: "Let Claude, ChatGPT or Cursor run the same actions.",
        href: "/features/ai-integration",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Akiflow",
        description: "Keyboard-first planning with a public API.",
        href: "/alternative/akiflow",
      },
      {
        kind: "compare",
        title: "Open Sunsama vs Todoist",
        description: "A board of days and a calendar, not just a list.",
        href: "/alternative/todoist",
      },
      {
        kind: "persona",
        title: "For developers",
        description: "Keys, an API and an agent in your editor.",
        href: "/for/developers",
      },
      {
        kind: "guide",
        title: "Akiflow alternatives",
        description: "Keyboard-first planners compared side by side.",
        href: "/blog/akiflow-alternatives",
      },
    ],
  },

  cta: {
    heading: "Press Cmd+K and plan your day",
    body: "Find anything, move anything and focus on one task at a time, all from the keyboard, or ask the AI agent you already use.",
    shot: "command-palette",
    shotAlt: "The Open Sunsama command palette with search results for tasks and ideas",
  },

  software: {
    featureList: [
      "Cmd+K command palette for tasks, ideas and calendar events",
      "Single-key actions on the task under your cursor",
      "Google Calendar-style calendar keys",
      "Keyboard-driven focus mode",
      "Hosted MCP server for Claude, ChatGPT and any AI agent",
      "Public REST API",
      "Desktop apps for Mac, Windows and Linux",
    ],
  },
});
