import * as React from "react";
import type { Task } from "@open-sunsama/types";
import { useKanbanDates } from "@/hooks/useKanbanDates";
import { useKanbanRangePrefetch } from "@/hooks/useKanbanRangePrefetch";
import { useTasksDnd } from "@/lib/dnd/tasks-dnd-context";
import { DayColumn } from "./day-column";
import { TaskModal } from "./task-modal.lazy";
import { KanbanBoardToolbar, useSortPreference } from "./kanban-board-toolbar";
import { KanbanNavigationProvider } from "./kanban-navigation-context";
import { addDays, format, startOfDay, subDays } from "date-fns";

export type BoardMode = "board" | "day";
const MODE_KEY = "open-sunsama-board-mode";

/** Board (several days side by side) or Today (one day), remembered here. */
function useBoardMode(): [BoardMode, (mode: BoardMode) => void] {
  const [mode, setMode] = React.useState<BoardMode>(() => {
    try {
      return localStorage.getItem(MODE_KEY) === "day" ? "day" : "board";
    } catch {
      return "board";
    }
  });
  const update = React.useCallback((next: BoardMode) => {
    setMode(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      // The choice lasts for this visit only.
    }
  }, []);
  return [mode, update];
}

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
  const [searchQuery, setSearchQuery] = React.useState("");
  const { isDragging } = useTasksDnd();

  // Use the kanban dates hook for date management and navigation
  // Pass isDragging to prevent infinite scroll during drag operations
  const {
    dates,
    virtualizer,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    navigateToDate,
    getLeadingDate,
    handleScroll,
    firstVisibleDate,
  } = useKanbanDates({ containerRef, isDragging });

  // Prefetch the entire visible date range in one request. Each DayColumn
  // also calls useTasks({ scheduledDate }) — but because this hook seeds
  // those per-day caches as soon as the range query resolves, the columns
  // render immediately instead of waterfalling 30+ parallel requests.
  useKanbanRangePrefetch({
    centerDate: firstVisibleDate ?? new Date(),
  });



  // Today view: one day at a time. Navigation steps that day instead of
  // scrolling the board.
  const [mode, setMode] = useBoardMode();
  const isDay = mode === "day";
  const [day, setDay] = React.useState(() => startOfDay(new Date()));
  const nav = React.useMemo(
    () =>
      isDay
        ? {
            navigatePrevious: () => setDay((d) => subDays(d, 1)),
            navigateNext: () => setDay((d) => addDays(d, 1)),
            navigateToToday: () => setDay(startOfDay(new Date())),
            navigateToDate: (d: Date) => setDay(startOfDay(d)),
          }
        : { navigatePrevious, navigateNext, navigateToToday, navigateToDate },
    [isDay, navigatePrevious, navigateNext, navigateToToday, navigateToDate]
  );

  // Switching views keeps you on the same day. The board's scroll area only
  // exists once it renders, so the jump waits for that.
  const boardDateRef = React.useRef<Date | null>(null);
  const switchMode = (next: BoardMode) => {
    if (next === mode) return;
    if (next === "day") setDay(startOfDay(getLeadingDate() ?? new Date()));
    else boardDateRef.current = day;
    setMode(next);
  };
  React.useEffect(() => {
    if (isDay || !boardDateRef.current) return;
    // After the virtualizer has placed its initial scroll. Cleared only when
    // the jump runs: a re-render cancels the timer and this effect sets it
    // again. (Not requestAnimationFrame, which waits while a tab is hidden.)
    const timer = setTimeout(() => {
      const target = boardDateRef.current;
      boardDateRef.current = null;
      if (target) navigateToDate(target, { instant: true });
    }, 0);
    return () => clearTimeout(timer);
  }, [isDay, navigateToDate]);

  // Tell the parent which day leads, so the side calendar follows it.
  const leadingDate = isDay ? day : firstVisibleDate;
  const leadingKey = leadingDate ? format(leadingDate, "yyyy-MM-dd") : "";
  React.useEffect(() => {
    onFirstVisibleDateChange?.(leadingDate);
    // leadingKey stands in for the Date, which is a new object each render.
  }, [leadingKey, onFirstVisibleDateChange]);

  // Memoize navigation context value
  const navigationContextValue = React.useMemo(
    () => ({ ...nav, selectTask: setSelectedTask }),
    [nav]
  );

  return (
    <KanbanNavigationProvider value={navigationContextValue}>
      <div className="flex h-full flex-col bg-canvas">
        {/* Toolbar */}
        <KanbanBoardToolbar
          onNavigatePrevious={nav.navigatePrevious}
          onNavigateNext={nav.navigateNext}
          onNavigateToday={nav.navigateToToday}
          onNavigateToDate={nav.navigateToDate}
          firstVisibleDate={leadingDate}
          mode={mode}
          onModeChange={switchMode}
          sortBy={sortBy}
          onSortChange={onSortChange}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
        />

        {isDay ? (
          <div className="flex min-h-0 flex-1 justify-center overflow-hidden">
            <DayColumn
              key={format(day, "yyyy-MM-dd")}
              date={day}
              dateString={format(day, "yyyy-MM-dd")}
              onSelectTask={setSelectedTask}
              sortBy={sortBy}
              searchQuery={searchQuery}
              wide
            />
          </div>
        ) : (
        /* Kanban Board - DndContext is provided by TasksDndProvider */
        <div
          ref={containerRef}
          className="scrollbar-thin flex-1 overflow-x-auto overflow-y-hidden snap-x snap-mandatory sm:snap-none"
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
                    searchQuery={searchQuery}
                  />
                </div>
              );
            })}
          </div>
        </div>
        )}

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
