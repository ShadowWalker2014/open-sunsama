import * as React from "react";
import { startOfDay } from "date-fns";
import { MobileTaskListView } from "./task-list-view";
import { MobileBoardView } from "./mobile-board-view";
import type { MobileTasksViewMode } from "./mobile-view-controls";
import { useSortPreference } from "@/components/kanban/kanban-board-toolbar";
import { prefetchTaskModal } from "@/components/kanban/task-modal.lazy";

// v2: devices that still remember the old list default open on the board.
const VIEW_MODE_KEY = "open-sunsama-mobile-tasks-view-v2";

/**
 * The mobile Tasks tab. Owns the list/board switch, the sort order and the
 * selected day, so switching views keeps you on the same date.
 */
export function MobileTasksView() {
  // The board, like desktop, unless this device chose the list.
  const [viewMode, setViewMode] = React.useState<MobileTasksViewMode>(() => {
    if (typeof window === "undefined") return "board";
    try {
      return localStorage.getItem(VIEW_MODE_KEY) === "list" ? "list" : "board";
    } catch {
      return "board";
    }
  });
  const [sortBy, setSortBy] = useSortPreference();
  const [selectedDate, setSelectedDate] = React.useState(() => startOfDay(new Date()));

  const changeViewMode = React.useCallback((mode: MobileTasksViewMode) => {
    setViewMode(mode);
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {
      // Private mode: the choice lasts for this visit.
    }
  }, []);

  // Load the task sheet up front: iOS only raises the keyboard for a focus
  // that happens inside the tap, which a chunk download would break.
  React.useEffect(() => {
    void prefetchTaskModal();
  }, []);

  const shared = {
    selectedDate,
    onSelectDate: setSelectedDate,
    viewMode,
    onViewModeChange: changeViewMode,
    sortBy,
    onSortChange: setSortBy,
  };

  return viewMode === "board" ? (
    <MobileBoardView {...shared} />
  ) : (
    <MobileTaskListView {...shared} />
  );
}
