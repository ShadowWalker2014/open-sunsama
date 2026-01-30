import type { ThemeMode } from "@/lib/themes";

export interface Command {
  id: string;
  title: string;
  shortcut?: string; // Display string like "⌘K"
  category: "navigation" | "actions" | "settings";
  keywords: string[]; // For fuzzy search matching
  icon: string; // Lucide icon name
  action: (ctx: CommandContext) => void;
}

// Navigate function type from TanStack Router
type NavigateFn = (options: { to: string; search?: Record<string, string> }) => void;

export interface CommandContext {
  navigate: NavigateFn;
  setThemeMode: (mode: ThemeMode) => void;
  currentThemeMode: ThemeMode;
  openAddTask: () => void;
  openShortcuts: () => void;
  closeSearch: () => void;
}

export const COMMANDS: Command[] = [
  // Navigation
  {
    id: "tasks",
    title: "Go to Tasks Board",
    category: "navigation",
    keywords: ["tasks", "board", "kanban", "home"],
    icon: "LayoutDashboard",
    action: (ctx) => {
      ctx.navigate({ to: "/app" });
      ctx.closeSearch();
    },
  },
  {
    id: "calendar",
    title: "Go to Calendar",
    category: "navigation",
    keywords: ["calendar", "timeline", "schedule"],
    icon: "Calendar",
    action: (ctx) => {
      ctx.navigate({ to: "/app/calendar" });
      ctx.closeSearch();
    },
  },
  {
    id: "settings",
    title: "Go to Settings",
    category: "navigation",
    keywords: ["settings", "preferences", "config"],
    icon: "Settings",
    action: (ctx) => {
      ctx.navigate({ to: "/app/settings" });
      ctx.closeSearch();
    },
  },
  {
    id: "api-keys",
    title: "Go to API Keys",
    category: "navigation",
    keywords: ["api", "keys", "tokens", "developer"],
    icon: "Key",
    action: (ctx) => {
      ctx.navigate({ to: "/app/settings", search: { tab: "api-keys" } });
      ctx.closeSearch();
    },
  },

  // Actions
  {
    id: "add-task",
    title: "Add New Task",
    shortcut: "A",
    category: "actions",
    keywords: ["add", "create", "new", "task"],
    icon: "Plus",
    action: (ctx) => {
      ctx.closeSearch();
      ctx.openAddTask();
    },
  },
  {
    id: "shortcuts",
    title: "Show Keyboard Shortcuts",
    shortcut: "?",
    category: "actions",
    keywords: ["shortcuts", "keyboard", "help", "keys"],
    icon: "Keyboard",
    action: (ctx) => {
      ctx.closeSearch();
      ctx.openShortcuts();
    },
  },

  // Settings
  {
    id: "theme-light",
    title: "Switch to Light Mode",
    category: "settings",
    keywords: ["theme", "light", "mode", "appearance"],
    icon: "Sun",
    action: (ctx) => {
      ctx.setThemeMode("light");
      ctx.closeSearch();
    },
  },
  {
    id: "theme-dark",
    title: "Switch to Dark Mode",
    category: "settings",
    keywords: ["theme", "dark", "mode", "appearance"],
    icon: "Moon",
    action: (ctx) => {
      ctx.setThemeMode("dark");
      ctx.closeSearch();
    },
  },
  {
    id: "theme-system",
    title: "Use System Theme",
    category: "settings",
    keywords: ["theme", "system", "auto", "mode"],
    icon: "Monitor",
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
