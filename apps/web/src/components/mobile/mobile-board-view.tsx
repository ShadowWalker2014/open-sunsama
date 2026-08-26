import * as React from "react";
import { addDays, format, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { ViewSearch } from "@/components/ui";
import { DayColumn } from "@/components/kanban/day-column";
import { TaskModal } from "@/components/kanban/task-modal.lazy";
import { TasksDndProvider } from "@/lib/dnd/tasks-dnd-context";
import type { SortOption } from "@/components/kanban/kanban-board-toolbar";
import {
  MobileViewControls,
  type MobileTasksViewMode,
} from "./mobile-view-controls";

/** How many days the mobile board holds at once. */
const VISIBLE_DAYS = 7;

interface MobileBoardViewProps {
  viewMode: MobileTasksViewMode;
  onViewModeChange: (mode: MobileTasksViewMode) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  className?: string;
}

/**
 * Board (day-column) view for the mobile Tasks tab.
 *
 * Same shape as the Ideas board: a horizontal snap-scroller with one column
 * per screen, so a swipe moves exactly one day. The columns are the desktop
 * `DayColumn` — it already sizes itself to the viewport below `sm`, so cards,
 * inline add, drag-to-reorder and cross-day drops behave identically to the
 * desktop board rather than being reimplemented.
 */
export function MobileBoardView({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  className,
}: MobileBoardViewProps) {
  const [anchorDate, setAnchorDate] = React.useState(() => startOfDay(new Date()));
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [searchQuery, setSearchQuery] = React.useState("");
  const scrollerRef = React.useRef<HTMLDivElement>(null);

  const days = React.useMemo(
    () =>
      Array.from({ length: VISIBLE_DAYS }, (_, i) => {
        const date = addDays(anchorDate, i);
        return { date, dateString: format(date, "yyyy-MM-dd") };
      }),
    [anchorDate]
  );

  const scrollToStart = React.useCallback(() => {
    scrollerRef.current?.scrollTo({ left: 0, behavior: "smooth" });
  }, []);

  const goToToday = () => {
    setAnchorDate(startOfDay(new Date()));
    scrollToStart();
  };

  const shiftDays = (delta: number) => {
    setAnchorDate((prev) => startOfDay(addDays(prev, delta)));
    scrollToStart();
  };

  return (
    <TasksDndProvider>
      <div className={cn("flex h-full flex-col bg-background", className)}>
        {/* Header: week nav on the left, view controls on the right */}
        <header className="sticky top-0 z-40 border-b border-border/40 bg-background">
          <div className="flex items-center justify-between gap-2 px-3 py-2.5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => shiftDays(-VISIBLE_DAYS)}
                aria-label="Previous week"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground active:bg-muted"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={goToToday}
                className="flex h-8 items-center gap-1.5 rounded-lg px-2 text-sm font-medium active:bg-muted"
              >
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                Today
              </button>
              <button
                onClick={() => shiftDays(VISIBLE_DAYS)}
                aria-label="Next week"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground active:bg-muted"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <ViewSearch
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search tasks…"
              />
              {!searchQuery && (
                <MobileViewControls
                  viewMode={viewMode}
                  onViewModeChange={onViewModeChange}
                  sortBy={sortBy}
                  onSortChange={onSortChange}
                />
              )}
            </div>
          </div>
        </header>

        {/* One day per screen; swiping snaps between them. */}
        <div
          ref={scrollerRef}
          className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden pb-20"
        >
          {days.map(({ date, dateString }) => (
            <div key={dateString} className="h-full shrink-0 snap-start">
              <DayColumn
                date={date}
                dateString={dateString}
                onSelectTask={setSelectedTask}
                sortBy={sortBy}
                searchQuery={searchQuery}
              />
            </div>
          ))}
        </div>

        <TaskModal
          task={selectedTask}
          open={selectedTask !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        />
      </div>
    </TasksDndProvider>
  );
}
