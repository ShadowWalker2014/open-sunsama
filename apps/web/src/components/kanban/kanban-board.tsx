import * as React from "react";
import type { Task } from "@open-sunsama/types";
import { useKanbanDates } from "@/hooks/useKanbanDates";
import { useTasksDnd } from "@/lib/dnd/tasks-dnd-context";
import { DayColumn } from "./day-column";
import { TaskModal } from "./task-modal";
import { KanbanBoardToolbar, useSortPreference } from "./kanban-board-toolbar";

/**
 * Linear-style infinite horizontal kanban board with day columns.
 * DnD is handled by the parent TasksDndProvider context.
 */
export function KanbanBoard() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [sortBy, onSortChange] = useSortPreference();

  // Get DnD state from shared context
  const { activeTask, activeOverColumn } = useTasksDnd();

  // Use the kanban dates hook for date management and navigation
  const {
    dates,
    virtualizer,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    handleScroll,
    firstVisibleDate,
    lastVisibleDate,
  } = useKanbanDates({ containerRef });

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Toolbar */}
      <KanbanBoardToolbar
        firstVisibleDate={firstVisibleDate}
        lastVisibleDate={lastVisibleDate}
        onNavigatePrevious={navigatePrevious}
        onNavigateNext={navigateNext}
        onNavigateToday={navigateToToday}
        sortBy={sortBy}
        onSortChange={onSortChange}
      />

      {/* Kanban Board - DndContext is provided by TasksDndProvider */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden"
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
                className="absolute left-0 top-0 h-full"
                style={{
                  width: `${virtualItem.size}px`,
                  transform: `translateX(${virtualItem.start}px)`,
                }}
              >
                <DayColumn
                  date={dateInfo.date}
                  dateString={dateInfo.dateString}
                  onSelectTask={setSelectedTask}
                  isOver={activeOverColumn === dateInfo.dateString}
                  activeTaskId={activeTask?.id}
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
  );
}
