import type { Task } from "@open-sunsama/types";
import type { McpClient } from "@/lib/mcp-config";
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

  // MCP actions
  copyMcpConfig: (client: McpClient) => void;
  copyApiKey: () => void;
}

export const COMMANDS: Command[] = [
  // Navigation
  {
    id: "tasks",
    title: "Go to Tasks Board",
    category: "navigation",
    keywords: ["tasks", "board", "kanban", "home"],
    icon: "LayoutDashboard",
    priority: 20,
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
    priority: 21,
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
    priority: 22,
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
    priority: 23,
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
    priority: 25,
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
    priority: 26,
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
    priority: 28,
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
    priority: 29,
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
    priority: 30,
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
