import * as React from "react";
import { MobileTaskListView } from "./task-list-view";
import { MobileBoardView } from "./mobile-board-view";
import type { MobileTasksViewMode } from "./mobile-view-controls";
import { useSortPreference } from "@/components/kanban/kanban-board-toolbar";

const VIEW_MODE_KEY = "open-sunsama-mobile-tasks-view";

/**
 * The mobile Tasks tab. Owns the two things the phone layout was missing —
 * the list/board switch and the sort order — and hands them to whichever view
 * is showing. The sort preference is the same DB-free localStorage preference
 * the desktop board uses, so switching devices keeps the chosen order.
 */
export function MobileTasksView() {
  const [viewMode, setViewMode] = React.useState<MobileTasksViewMode>(() => {
    if (typeof window === "undefined") return "list";
    return localStorage.getItem(VIEW_MODE_KEY) === "board" ? "board" : "list";
  });
  const [sortBy, setSortBy] = useSortPreference();

  const changeViewMode = React.useCallback((mode: MobileTasksViewMode) => {
    setViewMode(mode);
    localStorage.setItem(VIEW_MODE_KEY, mode);
  }, []);

  if (viewMode === "board") {
    return (
      <MobileBoardView
        viewMode={viewMode}
        onViewModeChange={changeViewMode}
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
    );
  }

  return (
    <MobileTaskListView
      viewMode={viewMode}
      onViewModeChange={changeViewMode}
      sortBy={sortBy}
      onSortChange={setSortBy}
    />
  );
}
