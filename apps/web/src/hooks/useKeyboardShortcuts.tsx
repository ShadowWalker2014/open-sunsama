import * as React from "react";
import type { Task } from "@open-sunsama/types";

export interface ShortcutDefinition {
  key: string;
  modifiers?: {
    shift?: boolean;
    cmd?: boolean;  // Meta key (Cmd on Mac, Ctrl on Windows)
    alt?: boolean;
  };
  description: string;
  category: "navigation" | "task" | "general";
}

// Define all shortcuts
export const SHORTCUTS: Record<string, ShortcutDefinition> = {
  addTask: {
    key: "a",
    description: "Add new task",
    category: "general",
  },
  focusToday: {
    key: " ", // Space
    modifiers: { shift: true },
    description: "Focus on Today",
    category: "navigation",
  },
  completeTask: {
    key: "c",
    description: "Complete task (while hovering)",
    category: "task",
  },
  nextDay: {
    key: "ArrowRight",
    modifiers: { shift: true },
    description: "Go to next day",
    category: "navigation",
  },
  previousDay: {
    key: "ArrowLeft",
    modifiers: { shift: true },
    description: "Go to previous day",
    category: "navigation",
  },
  deleteTask: {
    key: "Backspace",
    modifiers: { cmd: true },
    description: "Delete task (while hovering)",
    category: "task",
  },
  editEstimate: {
    key: "e",
    description: "Edit time estimate (while hovering)",
    category: "task",
  },
  moveToTop: {
    key: "ArrowUp",
    modifiers: { cmd: true, shift: true },
    description: "Move task to top",
    category: "task",
  },
  moveToBottom: {
    key: "ArrowDown",
    modifiers: { cmd: true, shift: true },
    description: "Move task to bottom",
    category: "task",
  },
  moveToBacklog: {
    key: "z",
    description: "Move to backlog (while hovering)",
    category: "task",
  },
  deferToNextWeek: {
    key: "Z",
    modifiers: { shift: true },
    description: "Defer to next week (while hovering)",
    category: "task",
  },
  focus: {
    key: "f",
    description: "Focus on task (while hovering)",
    category: "task",
  },
  addToCalendar: {
    key: "x",
    description: "Add to calendar (while hovering)",
    category: "task",
  },
  duplicate: {
    key: "d",
    modifiers: { cmd: true },
    description: "Duplicate task (while hovering)",
    category: "task",
  },
  hideSubtasks: {
    key: "h",
    description: "Toggle hide subtasks (while hovering)",
    category: "task",
  },
  showShortcuts: {
    key: "?",
    modifiers: { shift: true },
    description: "Show keyboard shortcuts",
    category: "general",
  },
  search: {
    key: "k",
    modifiers: { cmd: true },
    description: "Search tasks",
    category: "general",
  },
};

// Format shortcut for display (e.g., "Shift + Space", "Cmd + Delete")
export function formatShortcut(shortcut: ShortcutDefinition): string {
  const parts: string[] = [];
  
  if (shortcut.modifiers?.cmd) {
    parts.push(navigator.platform.includes("Mac") ? "⌘" : "Ctrl");
  }
  if (shortcut.modifiers?.shift) {
    parts.push("⇧");
  }
  if (shortcut.modifiers?.alt) {
    parts.push(navigator.platform.includes("Mac") ? "⌥" : "Alt");
  }
  
  // Format the key nicely
  let keyDisplay = shortcut.key;
  switch (shortcut.key) {
    case " ":
      keyDisplay = "Space";
      break;
    case "ArrowRight":
      keyDisplay = "→";
      break;
    case "ArrowLeft":
      keyDisplay = "←";
      break;
    case "ArrowUp":
      keyDisplay = "↑";
      break;
    case "ArrowDown":
      keyDisplay = "↓";
      break;
    case "Backspace":
      keyDisplay = "⌫";
      break;
    default:
      keyDisplay = shortcut.key.toUpperCase();
  }
  
  parts.push(keyDisplay);
  return parts.join(" ");
}

// Check if a keyboard event matches a shortcut
export function matchesShortcut(event: KeyboardEvent, shortcut: ShortcutDefinition): boolean {
  const isMac = navigator.platform.includes("Mac");
  const cmdKey = isMac ? event.metaKey : event.ctrlKey;
  
  const cmdMatches = shortcut.modifiers?.cmd ? cmdKey : !cmdKey;
  const shiftMatches = shortcut.modifiers?.shift ? event.shiftKey : !event.shiftKey;
  const altMatches = shortcut.modifiers?.alt ? event.altKey : !event.altKey;
  
  return (
    event.key === shortcut.key &&
    cmdMatches &&
    shiftMatches &&
    altMatches
  );
}

// Context for hovered task
interface HoveredTaskContextValue {
  hoveredTask: Task | null;
  hoveredSubtaskId: string | null;
  setHoveredTask: (task: Task | null) => void;
  setHoveredSubtaskId: (id: string | null) => void;
}

const HoveredTaskContext = React.createContext<HoveredTaskContextValue | null>(null);

export function HoveredTaskProvider({ children }: { children: React.ReactNode }) {
  const [hoveredTask, setHoveredTask] = React.useState<Task | null>(null);
  const [hoveredSubtaskId, setHoveredSubtaskId] = React.useState<string | null>(null);

  const value = React.useMemo(
    () => ({ hoveredTask, hoveredSubtaskId, setHoveredTask, setHoveredSubtaskId }),
    [hoveredTask, hoveredSubtaskId]
  );

  return (
    <HoveredTaskContext.Provider value={value}>
      {children}
    </HoveredTaskContext.Provider>
  );
}

export function useHoveredTask() {
  const context = React.useContext(HoveredTaskContext);
  if (!context) {
    throw new Error("useHoveredTask must be used within HoveredTaskProvider");
  }
  return context;
}

// Shortcuts context for showing the modal
interface ShortcutsContextValue {
  showShortcutsModal: boolean;
  setShowShortcutsModal: (show: boolean) => void;
}

const ShortcutsContext = React.createContext<ShortcutsContextValue | null>(null);

export function ShortcutsProvider({ children }: { children: React.ReactNode }) {
  const [showShortcutsModal, setShowShortcutsModal] = React.useState(false);

  const value = React.useMemo(
    () => ({ showShortcutsModal, setShowShortcutsModal }),
    [showShortcutsModal]
  );

  return (
    <ShortcutsContext.Provider value={value}>
      {children}
    </ShortcutsContext.Provider>
  );
}

export function useShortcutsModal() {
  const context = React.useContext(ShortcutsContext);
  if (!context) {
    throw new Error("useShortcutsModal must be used within ShortcutsProvider");
  }
  return context;
}

// Hook to check if we should ignore shortcuts (when in input/textarea)
export function shouldIgnoreShortcut(event: KeyboardEvent): boolean {
  const target = event.target as HTMLElement;
  const tagName = target.tagName.toLowerCase();
  
  // Ignore if in input, textarea, or contenteditable
  if (
    tagName === "input" ||
    tagName === "textarea" ||
    target.isContentEditable
  ) {
    return true;
  }
  
  return false;
}
