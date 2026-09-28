import * as React from "react";
import { addDays, format } from "date-fns";
import { Plus } from "lucide-react";
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
import { MobileDateHeader, usePagerSettle } from "./mobile-date-header";

interface MobileBoardViewProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  viewMode: MobileTasksViewMode;
  onViewModeChange: (mode: MobileTasksViewMode) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  className?: string;
}

/**
 * Board (day-column) view for the phone Tasks tab: one full-width day per
 * screen, the week strip above it, and swipes that move a day at a time
 * without end. The columns are the desktop `DayColumn`, so cards, inline add,
 * drag-to-reorder and drops behave exactly like the desktop board.
 */
export function MobileBoardView({
  selectedDate,
  onSelectDate,
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  className,
}: MobileBoardViewProps) {
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isComposerOpen, setIsComposerOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const pagerRef = React.useRef<HTMLDivElement>(null);

  const selectedString = format(selectedDate, "yyyy-MM-dd");
  const settle = usePagerSettle(pagerRef, selectedString, (offset) =>
    onSelectDate(addDays(selectedDate, offset))
  );

  return (
    <TasksDndProvider>
      <div className={cn("flex h-full flex-col bg-background", className)}>
        <MobileDateHeader
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          hideStrip={!!searchQuery}
          trailing={
            <>
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
            </>
          }
        />

        {/* Yesterday · selected · tomorrow. Swiping lands on a neighbour,
            which becomes the selected day, and the pager re-centres. */}
        <div
          ref={pagerRef}
          onScroll={settle.onScroll}
          onTouchStart={settle.onTouchStart}
          onTouchEnd={settle.onTouchEnd}
          className="flex min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          // Clear the bottom tab bar, including the iPhone home-indicator area.
          style={{ paddingBottom: "calc(72px + env(safe-area-inset-bottom, 0px))" }}
        >
          {[-1, 0, 1].map((offset) => {
            const date = addDays(selectedDate, offset);
            const dateString = format(date, "yyyy-MM-dd");
            return (
              <div
                key={dateString}
                className="h-full w-full shrink-0 snap-center snap-always"
                aria-hidden={offset !== 0}
              >
                <DayColumn
                  date={date}
                  dateString={dateString}
                  onSelectTask={setSelectedTask}
                  sortBy={sortBy}
                  searchQuery={searchQuery}
                  fill
                />
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => setIsComposerOpen(true)}
          className="fab-above-nav fixed right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95 lg:hidden"
          aria-label={`Add task on ${format(selectedDate, "EEEE, MMMM d")}`}
        >
          <Plus className="h-6 w-6" />
        </button>

        <TaskModal
          task={selectedTask}
          open={selectedTask !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedTask(null);
          }}
        />
        <TaskModal
          task={null}
          open={isComposerOpen}
          onOpenChange={setIsComposerOpen}
          createDefaults={{ scheduledDate: selectedString }}
        />
      </div>
    </TasksDndProvider>
  );
}
