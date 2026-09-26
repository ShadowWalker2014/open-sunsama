import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Task } from "@open-sunsama/types";
import { taskKeys } from "@/lib/query-keys";

export interface ShortcutDefinition {
  key: string;
  modifiers?: {
    shift?: boolean;
    cmd?: boolean; // Meta key (Cmd on Mac, Ctrl on Windows)
    alt?: boolean;
    super?: boolean; // Cmd on Mac, Win/Super elsewhere (desktop global shortcuts)
  };
  description: string;
  category: "navigation" | "task" | "general" | "focus" | "calendar" | "desktop";
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
    modifiers: { alt: true, shift: true },
    description: "Move task to top",
    category: "task",
  },
  moveToBottom: {
    key: "ArrowDown",
    modifiers: { alt: true, shift: true },
    description: "Move task to bottom",
    category: "task",
  },
  moveToBacklog: {
    key: "z",
    description: "Move to backlog (while hovering)",
    category: "task",
  },
  deferToTomorrow: {
    key: "d",
    description: "Defer to tomorrow (while hovering)",
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
  undo: {
    key: "z",
    modifiers: { cmd: true },
    description: "Undo last action",
    category: "general",
  },
  redo: {
    key: "z",
    modifiers: { cmd: true, shift: true },
    description: "Redo last action",
    category: "general",
  },
  // Focus Mode shortcuts
  toggleFocusTimer: {
    key: " ",
    description: "Start/pause timer",
    category: "focus",
  },
  editActualTime: {
    key: "e",
    description: "Edit actual time",
    category: "focus",
  },
  editPlannedTime: {
    key: "w",
    description: "Edit planned time",
    category: "focus",
  },
  // Calendar view-mode shortcuts (matches Google Calendar's defaults
  // so the muscle memory transfers cleanly). The actual handler lives
  // in `apps/web/src/components/calendar/calendar-view.tsx` because
  // the hook here is a registry — the calendar-view's local listener
  // owns the dispatch since it needs access to `setViewMode`,
  // `goToToday`, etc. The entries here exist so the `?` shortcuts
  // modal can list them.
  calendarDayView: {
    key: "d",
    description: "Switch to day view",
    category: "calendar",
  },
  calendarThreeDayView: {
    key: "x",
    description: "Switch to 3-day view",
    category: "calendar",
  },
  calendarWeekView: {
    key: "w",
    description: "Switch to week view",
    category: "calendar",
  },
  calendarMonthView: {
    key: "m",
    description: "Switch to month view",
    category: "calendar",
  },
  calendarToday: {
    key: "t",
    description: "Jump to today",
    category: "calendar",
  },
  calendarPrevious: {
    key: "j",
    description: "Previous range",
    category: "calendar",
  },
  calendarNext: {
    key: "k",
    description: "Next range",
    category: "calendar",
  },
  // Desktop app shortcuts. Global ones (super) are registered system-wide in
  // apps/desktop/src-tauri/src/lib.rs; the cmd ones are app-menu accelerators
  // in menu.rs. Both reach the web app via DesktopShortcutsHandler, and the
  // `?` modal only lists them when running in the desktop app.
  desktopQuickAdd: {
    key: "t",
    modifiers: { super: true, shift: true },
    description: "Add task for today, from any app",
    category: "desktop",
  },
  desktopStartFocus: {
    key: "f",
    modifiers: { super: true, shift: true },
    description: "Focus on current task, from any app",
    category: "desktop",
  },
  desktopToggleWindow: {
    key: "o",
    modifiers: { super: true, shift: true },
    description: "Show or hide Open Sunsama",
    category: "desktop",
  },
  desktopNewTask: {
    key: "n",
    modifiers: { cmd: true },
    description: "New task",
    category: "desktop",
  },
  desktopToday: {
    key: "1",
    modifiers: { cmd: true },
    description: "Go to Today",
    category: "desktop",
  },
  desktopCalendar: {
    key: "2",
    modifiers: { cmd: true },
    description: "Go to Calendar",
    category: "desktop",
  },
};

// Format shortcut for display (e.g., "Shift + Space", "Cmd + Delete")
export function formatShortcut(shortcut: ShortcutDefinition): string {
  const parts: string[] = [];
  const isMac = navigator.platform.includes("Mac");

  if (shortcut.modifiers?.super) {
    parts.push(isMac ? "⌘" : navigator.platform.includes("Win") ? "Win" : "Super");
  }
  if (shortcut.modifiers?.cmd) {
    parts.push(isMac ? "⌘" : "Ctrl");
  }
  if (shortcut.modifiers?.shift) {
    parts.push("⇧");
  }
  if (shortcut.modifiers?.alt) {
    parts.push(isMac ? "⌥" : "Alt");
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
export function matchesShortcut(
  event: KeyboardEvent,
  shortcut: ShortcutDefinition
): boolean {
  const isMac = navigator.platform.includes("Mac");
  const cmdKey = isMac ? event.metaKey : event.ctrlKey;

  const cmdMatches = shortcut.modifiers?.cmd ? cmdKey : !cmdKey;
  const shiftMatches = shortcut.modifiers?.shift
    ? event.shiftKey
    : !event.shiftKey;
  const altMatches = shortcut.modifiers?.alt ? event.altKey : !event.altKey;

  return event.key === shortcut.key && cmdMatches && shiftMatches && altMatches;
}

// Context for hovered task
interface HoveredTaskContextValue {
  hoveredTask: Task | null;
  hoveredSubtaskId: string | null;
  setHoveredTask: (task: Task | null) => void;
  setHoveredSubtaskId: (id: string | null) => void;
}

const HoveredTaskContext = React.createContext<HoveredTaskContextValue | null>(
  null
);

export function HoveredTaskProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hoveredTask, setHoveredTask] = React.useState<Task | null>(null);
  const [hoveredSubtaskId, setHoveredSubtaskId] = React.useState<string | null>(
    null
  );
  const queryClient = useQueryClient();
  const lastCursor = React.useRef<{ x: number; y: number } | null>(null);

  // Track the cursor so we can recompute the hovered card without a mouse move.
  React.useEffect(() => {
    const onMove = (e: MouseEvent) => {
      lastCursor.current = { x: e.clientX, y: e.clientY };
    };
    document.addEventListener("mousemove", onMove, { passive: true });
    return () => document.removeEventListener("mousemove", onMove);
  }, []);

  // Recompute which task card sits under the cursor, reading the fresh task
  // object from the query cache. Used after a shortcut moves/removes a card:
  // the DOM under a stationary cursor changes but no mouseenter fires, so the
  // hovered target would otherwise go stale and the next shortcut would no-op.
  const recomputeHoveredFromCursor = React.useCallback(() => {
    const cur = lastCursor.current;
    if (!cur) return;
    const el = document.elementFromPoint(cur.x, cur.y);
    const card =
      el && "closest" in el
        ? (el as Element).closest<HTMLElement>("[data-task-id]")
        : null;
    const id = card?.dataset.taskId ?? null;
    if (!id) {
      setHoveredTask((prev) => (prev ? null : prev));
      return;
    }
    let next: Task | null = null;
    const lists = queryClient.getQueriesData<Task[]>({
      queryKey: taskKeys.lists(),
    });
    for (const [, data] of lists) {
      const found = data?.find((t) => t.id === id);
      if (found) {
        next = found;
        break;
      }
    }
    // The list view keeps its tasks in the infinite-search cache rather than
    // taskKeys.lists(), so search there too — otherwise the hovered card goes
    // stale (or null) after a shortcut completes/uncompletes it.
    if (!next) {
      const infinite = queryClient.getQueriesData({
        queryKey: ["tasks", "search", "infinite"],
      });
      outer: for (const [, data] of infinite) {
        if (!data || typeof data !== "object" || !("pages" in data)) continue;
        const pages = (data as { pages: Array<{ data: Task[] }> }).pages;
        for (const page of pages) {
          const found = page.data?.find((t) => t.id === id);
          if (found) {
            next = found;
            break outer;
          }
        }
      }
    }
    setHoveredTask((prev) => (prev?.id === next?.id && prev === next ? prev : next));
    setHoveredSubtaskId(null);
  }, [queryClient]);

  // Re-evaluate the hovered card whenever the task lists change (e.g. a
  // shortcut completed/deferred/deleted a card), coalesced to one per frame.
  React.useEffect(() => {
    let raf = 0;
    const unsub = queryClient.getQueryCache().subscribe((event) => {
      const key = event?.query?.queryKey as unknown[] | undefined;
      // Board view uses ["tasks","list",...]; list view uses
      // ["tasks","search","infinite",...]. Recompute on either.
      if (!key || key[0] !== "tasks" || (key[1] !== "list" && key[1] !== "search"))
        return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(recomputeHoveredFromCursor);
    });
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
  }, [queryClient, recomputeHoveredFromCursor]);

  const value = React.useMemo(
    () => ({
      hoveredTask,
      hoveredSubtaskId,
      setHoveredTask,
      setHoveredSubtaskId,
    }),
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

const ShortcutsContext = React.createContext<ShortcutsContextValue | null>(
  null
);

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
