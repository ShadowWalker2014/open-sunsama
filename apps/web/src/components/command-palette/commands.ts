import type { Task } from "@open-sunsama/types";
import type { CurrentView } from "@/lib/route-utils";
import type { ThemeMode } from "@/lib/themes";

export interface Command {
  id: string;
  title: string;
  shortcut?: string; // Display string like "⌘K"
  category: "navigation" | "actions" | "settings";
  keywords: string[]; // For fuzzy search matching
  icon: string; // Lucide icon name
  action: (ctx: CommandContext) => void;
  requiresHoveredTask?: boolean; // Only show when task is hovered
  showInViews?: CurrentView[]; // View-specific commands
  priority?: number; // Lower = more prominent (0-100, default 50)
}

// Navigate function type from TanStack Router
type NavigateFn = (options: { to: string; search?: Record<string, string> }) => void;

export interface CommandContext {
  // Navigation & UI
  navigate: NavigateFn;
  setThemeMode: (mode: ThemeMode) => void;
  currentThemeMode: ThemeMode;
  openAddTask: () => void;
  openShortcuts: () => void;
  closeSearch: () => void;

  // Context awareness
  hoveredTask: Task | null;
  currentView: CurrentView;

  // Task actions
  completeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  duplicateTask: (task: Task) => void;
  deferTask: (id: string, date: string | null) => void;
  scheduleTask: (id: string) => void;
}

export const COMMANDS: Command[] = [
  // Actions (most useful first)
  {
    id: "add-task",
    title: "Add New Task",
    shortcut: "A",
    category: "actions",
    keywords: ["add", "create", "new", "task"],
    icon: "Plus",
    priority: 1,
    action: (ctx) => {
      ctx.closeSearch();
      ctx.openAddTask();
    },
  },
  {
    id: "shortcuts",
    title: "Keyboard Shortcuts",
    shortcut: "?",
    category: "actions",
    keywords: ["shortcuts", "keyboard", "help", "keys", "hotkeys"],
    icon: "Keyboard",
    priority: 2,
    action: (ctx) => {
      ctx.closeSearch();
      ctx.openShortcuts();
    },
  },

  // Navigation
  {
    id: "tasks",
    title: "Tasks",
    category: "navigation",
    keywords: ["tasks", "board", "kanban", "home", "today"],
    icon: "CheckSquare",
    priority: 10,
    action: (ctx) => {
      ctx.navigate({ to: "/app" });
      ctx.closeSearch();
    },
  },
  {
    id: "calendar",
    title: "Calendar",
    category: "navigation",
    keywords: ["calendar", "timeline", "schedule", "time", "blocks"],
    icon: "Calendar",
    priority: 11,
    action: (ctx) => {
      ctx.navigate({ to: "/app/calendar" });
      ctx.closeSearch();
    },
  },
  {
    id: "tasks-list",
    title: "All Tasks",
    category: "navigation",
    keywords: ["all", "tasks", "list", "view", "manage"],
    icon: "List",
    priority: 12,
    action: (ctx) => {
      ctx.navigate({ to: "/app/tasks" });
      ctx.closeSearch();
    },
  },
  {
    id: "settings",
    title: "Settings",
    category: "navigation",
    keywords: ["settings", "preferences", "config", "account"],
    icon: "Settings",
    priority: 20,
    action: (ctx) => {
      ctx.navigate({ to: "/app/settings" });
      ctx.closeSearch();
    },
  },

  // Theme (lower priority, revealed by search)
  {
    id: "theme-light",
    title: "Light Mode",
    category: "settings",
    keywords: ["theme", "light", "mode", "appearance", "bright"],
    icon: "Sun",
    priority: 30,
    action: (ctx) => {
      ctx.setThemeMode("light");
      ctx.closeSearch();
    },
  },
  {
    id: "theme-dark",
    title: "Dark Mode",
    category: "settings",
    keywords: ["theme", "dark", "mode", "appearance", "night"],
    icon: "Moon",
    priority: 31,
    action: (ctx) => {
      ctx.setThemeMode("dark");
      ctx.closeSearch();
    },
  },
  {
    id: "theme-system",
    title: "System Theme",
    category: "settings",
    keywords: ["theme", "system", "auto", "mode"],
    icon: "Monitor",
    priority: 32,
    action: (ctx) => {
      ctx.setThemeMode("system");
      ctx.closeSearch();
    },
  },
];

// Fuzzy filter commands based on query
export function filterCommands(commands: Command[], query: string): Command[] {
  if (!query.trim()) return commands;
  const lowerQuery = query.toLowerCase();
  return commands.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(lowerQuery) ||
      cmd.keywords.some((k) => k.includes(lowerQuery))
  );
}
