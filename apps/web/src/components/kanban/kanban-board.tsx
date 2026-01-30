import * as React from "react";
import type { Task } from "@open-sunsama/types";
import { useKanbanDates } from "@/hooks/useKanbanDates";
import { useTasksDnd } from "@/lib/dnd/tasks-dnd-context";
import { DayColumn } from "./day-column";
import { TaskModal } from "./task-modal";
import { KanbanBoardToolbar, useSortPreference } from "./kanban-board-toolbar";
import { KanbanNavigationProvider } from "./kanban-navigation-context";

interface KanbanBoardProps {
  /**
   * Children rendered inside the navigation provider scope.
   * Useful for components that need access to kanban navigation context.
   */
  children?: React.ReactNode;
  /**
   * Callback when the first visible date changes (for syncing calendar panel)
   */
  onFirstVisibleDateChange?: (date: Date | null) => void;
  /**
   * Callback to navigate to a specific date
   */
  onDateSelect?: (date: Date) => void;
}

/**
 * Linear-style infinite horizontal kanban board with day columns.
 * DnD is handled by the parent TasksDndProvider context.
 */
export function KanbanBoard({ children, onFirstVisibleDateChange }: KanbanBoardProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [sortBy, onSortChange] = useSortPreference();
  const { isDragging } = useTasksDnd();

  // Use the kanban dates hook for date management and navigation
  // Pass isDragging to prevent infinite scroll during drag operations
  const {
    dates,
    virtualizer,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    handleScroll,
    firstVisibleDate,
  } = useKanbanDates({ containerRef, isDragging });

  // Notify parent of first visible date changes
  React.useEffect(() => {
    onFirstVisibleDateChange?.(firstVisibleDate);
  }, [firstVisibleDate, onFirstVisibleDateChange]);

  // Navigate to a specific date
  const navigateToDate = React.useCallback((targetDate: Date) => {
    const targetIndex = dates.findIndex((d) => 
      d.dateString === targetDate.toISOString().split('T')[0]
    );
    if (targetIndex >= 0) {
      virtualizer.scrollToIndex(targetIndex, {
        align: "start",
        behavior: "smooth",
      });
    }
  }, [dates, virtualizer]);

  // Memoize navigation context value
  const navigationContextValue = React.useMemo(
    () => ({
      navigatePrevious,
      navigateNext,
      navigateToToday,
      navigateToDate,
      selectTask: setSelectedTask,
    }),
    [navigatePrevious, navigateNext, navigateToToday, navigateToDate]
  );

  return (
    <KanbanNavigationProvider value={navigationContextValue}>
      <div className="flex h-full flex-col bg-background">
        {/* Toolbar */}
        <KanbanBoardToolbar
          onNavigatePrevious={navigatePrevious}
          onNavigateNext={navigateNext}
          onNavigateToday={navigateToToday}
          sortBy={sortBy}
          onSortChange={onSortChange}
        />

        {/* Kanban Board - DndContext is provided by TasksDndProvider */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory sm:snap-none"
          onScroll={handleScroll}
        >
          <div
            className="relative h-full"
            style={{
              width: `${virtualizer.getTotalSize()}px`,
            }}
          >
            {virtualizer.getVirtualItems().map((virtualItem) => {
              const dateInfo = dates[virtualItem.index];
              if (!dateInfo) return null;

              return (
                <div
                  key={dateInfo.dateString}
                  className="absolute left-0 top-0 h-full snap-start snap-always"
                  style={{
                    width: `${virtualItem.size}px`,
                    transform: `translateX(${virtualItem.start}px)`,
                  }}
                >
                  <DayColumn
                    date={dateInfo.date}
                    dateString={dateInfo.dateString}
                    onSelectTask={setSelectedTask}
                    onDateClick={navigateToDate}
                    sortBy={sortBy}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Task Detail Modal */}
        <TaskModal
          task={selectedTask}
          open={selectedTask !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        />
      </div>

      {/* Render children inside the navigation provider scope */}
      {children}
    </KanbanNavigationProvider>
  );
}
