import * as React from "react";
import { startOfDay } from "date-fns";
import { MobileTaskListView } from "./task-list-view";
import { MobileBoardView } from "./mobile-board-view";
import type { MobileTasksViewMode } from "./mobile-view-controls";
import { useSortPreference } from "@/components/kanban/kanban-board-toolbar";
import { prefetchTaskModal } from "@/components/kanban/task-modal.lazy";

const VIEW_MODE_KEY = "open-sunsama-mobile-tasks-view";

/**
 * The mobile Tasks tab. Owns the list/board switch, the sort order and the
 * selected day, so switching views keeps you on the same date.
 */
export function MobileTasksView() {
  const [viewMode, setViewMode] = React.useState<MobileTasksViewMode>(() => {
    if (typeof window === "undefined") return "list";
    return localStorage.getItem(VIEW_MODE_KEY) === "board" ? "board" : "list";
  });
  const [sortBy, setSortBy] = useSortPreference();
  const [selectedDate, setSelectedDate] = React.useState(() => startOfDay(new Date()));

  const changeViewMode = React.useCallback((mode: MobileTasksViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
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
