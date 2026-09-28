import * as React from "react";
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  isYesterday,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Task } from "@open-sunsama/types";
import { useTasks } from "@/hooks/useTasks";
import { useTimeBlocks } from "@/hooks/useTimeBlocks";
import { useCalendarEvents } from "@/hooks/useCalendars";
import { useAuth } from "@/hooks/useAuth";
import { projectTaskStarts } from "@/lib/task-projection";
import { cn, formatDuration } from "@/lib/utils";
import { ScrollArea, Skeleton } from "@/components/ui";
import { SortableTaskCard, TaskCard, TaskCardPlaceholder } from "./task-card";
import { AddTaskInline } from "./add-task-inline";
import { type SortOption, parseSortOption } from "./kanban-board-toolbar";
import { useTasksDnd } from "@/lib/dnd/tasks-dnd-context";

// Priority order for sorting (lower number = higher priority)
const PRIORITY_ORDER: Record<string, number> = {
  P0: 0,
  P1: 1,
  P2: 2,
  P3: 3,
};

interface DayColumnProps {
  date: Date;
  dateString: string;
  onSelectTask: (task: Task) => void;
  onDateClick?: (date: Date) => void;
  sortBy?: SortOption;
  /** Case-insensitive substring filter on title + notes; "" shows everything. */
  searchQuery?: string;
  /** Fill the parent's width (the phone board shows one day per screen). */
  fill?: boolean;
}

/**
 * Linear-style day column with clean header and task list.
 */
export function DayColumn({
  date,
  dateString,
  onSelectTask,
  onDateClick,
  sortBy = "position",
  searchQuery = "",
  fill = false,
}: DayColumnProps) {
  // Use explicit limit to prevent accidental truncation (API default is 50)
  const {
    data: tasks,
    isLoading,
    isError,
    refetch,
  } = useTasks({ scheduledDate: dateString, limit: 200 });
  const { activeTask, activeOverColumn, isDragging } = useTasksDnd();

  // A task's time block is its place on the calendar; the card shows the
  // earliest block's start so the board and calendar tell the same story.
  const { data: timeBlocks } = useTimeBlocks({ date: dateString });
  const blockStartByTaskId = React.useMemo(() => {
    const starts = new Map<string, Date>();
    for (const block of timeBlocks ?? []) {
      if (!block.taskId) continue;
      const start = new Date(block.startTime);
      const current = starts.get(block.taskId);
      if (!current || start < current) starts.set(block.taskId, start);
    }
    return starts;
  }, [timeBlocks]);

  const { setNodeRef, isOver: isOverDroppable } = useDroppable({
    id: `day-${dateString}`,
    data: {
      type: "column",
      date: dateString,
    },
  });

  const today = isToday(date);
  const yesterday = isYesterday(date);
  const pastDay = isPast(date) && !today && !yesterday;
  const isDropTarget = isOverDroppable || activeOverColumn === dateString;
  const activeTaskId = activeTask?.id;

  // Sort function based on sortBy with direction support
  const sortTasks = React.useCallback(
    (taskList: Task[]) => {
      const sorted = [...taskList];
      const { field, direction } = parseSortOption(sortBy);

      switch (field) {
        case "priority":
          return sorted.sort((a, b) => {
            const priorityA = PRIORITY_ORDER[a.priority] ?? 2;
            const priorityB = PRIORITY_ORDER[b.priority] ?? 2;
            const priorityDiff =
              direction === "desc"
                ? priorityA - priorityB // High to Low (P0=0 first)
                : priorityB - priorityA; // Low to High (P3=3 first)
            if (priorityDiff !== 0) return priorityDiff;
            return a.position - b.position;
          });
        case "createdAt":
          return sorted.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return direction === "desc"
              ? dateB - dateA // Newest first
              : dateA - dateB; // Oldest first
          });
        case "position":
        default:
          return sorted.sort((a, b) => a.position - b.position);
      }
    },
    [sortBy]
  );

  // Separate pending and completed tasks
  // CRITICAL: Preserve the actively dragged task to prevent removeChild DOM errors
  // when React Query refetches or optimistic updates change the data mid-drag
  // Board-level search: match on the title and the plain text of the notes.
  const query = searchQuery.trim().toLowerCase();
  const matchesQuery = React.useCallback(
    (task: Task) => {
      if (!query) return true;
      const notes = task.notes?.replace(/<[^>]*>/g, " ") ?? "";
      return (
        task.title.toLowerCase().includes(query) ||
        notes.toLowerCase().includes(query)
      );
    },
    [query]
  );

  const pendingTasks = React.useMemo(() => {
    let filtered = sortTasks(
      tasks?.filter((t) => !t.completedAt && matchesQuery(t)) ?? []
    );

    // If dragging a task that belongs to this column, ensure it stays in the list
    if (isDragging && activeTask?.scheduledDate === dateString) {
      const isIncluded = filtered.some((t) => t.id === activeTask.id);
      if (!isIncluded) {
        // Task was filtered out during drag - keep it at the end
        filtered = [...filtered, activeTask];
      }
    }

    return filtered;
  }, [tasks, sortTasks, isDragging, activeTask, dateString, matchesQuery]);

  const completedTasks = React.useMemo(
    () => tasks?.filter((t) => t.completedAt && matchesQuery(t)) ?? [],
    [tasks, matchesQuery]
  );

  // Task IDs for sortable context - must include dragged task
  const taskIds = React.useMemo(
    () => pendingTasks.map((t) => t.id),
    [pendingTasks]
  );

  // Calculate total estimated time for all tasks (pending + completed)
  const totalEstimatedMins = React.useMemo(
    () =>
      [...pendingTasks, ...completedTasks].reduce(
        (sum, t) => sum + (t.estimatedMins ?? 0),
        0
      ),
    [pendingTasks, completedTasks]
  );

  // Calculate progress for today column
  // Open tasks without a block get Sunsama-style projected start times:
  // laid end to end from the workday start around blocks and meetings.
  const { user } = useAuth();
  const workStartHour = user?.preferences?.workStartHour ?? 9;
  // One request per week, shared by that week's seven columns.
  const { data: weekEvents } = useCalendarEvents(
    startOfWeek(date, { weekStartsOn: 1 }).toISOString(),
    endOfWeek(date, { weekStartsOn: 1 }).toISOString()
  );
  const dayEvents = React.useMemo(() => {
    const from = startOfDay(date).getTime();
    const to = endOfDay(date).getTime();
    return (weekEvents ?? []).filter(
      (e) =>
        new Date(e.startTime).getTime() <= to &&
        new Date(e.endTime).getTime() >= from
    );
  }, [weekEvents, date]);
  const projectedStartByTaskId = React.useMemo(
    () =>
      projectTaskStarts({
        day: date,
        tasks: pendingTasks,
        blockedTaskIds: new Set(blockStartByTaskId.keys()),
        busy: [
          ...(timeBlocks ?? []).map((b) => ({
            start: new Date(b.startTime),
            end: new Date(b.endTime),
          })),
          ...dayEvents
            .filter((e) => !e.isAllDay && e.responseStatus !== "declined")
            .map((e) => ({ start: new Date(e.startTime), end: new Date(e.endTime) })),
        ],
        workStartHour,
      }),
    [date, pendingTasks, blockStartByTaskId, timeBlocks, dayEvents, workStartHour]
  );

  const totalTasks = pendingTasks.length + completedTasks.length;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Get formatted date like "January 29"
  const getFormattedDate = () => {
    return format(date, "MMMM d");
  };

  return (
    <div
      ref={setNodeRef}
      data-board-day={dateString}
      className={cn(
        "flex h-full flex-shrink-0 flex-col transition-colors duration-150",
        fill
          ? "w-full"
          : "w-[calc(100vw-1rem)] sm:w-[280px] sm:min-w-[280px] sm:max-w-[280px] sm:px-1",
        // Subtle highlight during any drag operation
        isDragging && !isDropTarget && "bg-muted/20",
        // Drop target highlight with ring
        isDropTarget && "bg-primary/5 ring-2 ring-primary/20 ring-inset",
        // Today is warm-tinted top to bottom so the eye lands on it.
        today && !isDropTarget && "bg-primary/[0.045] sm:rounded-lg",
        // Past days are slightly muted
        pastDay && "opacity-60"
      )}
    >
      {/* Day header, as in Sunsama: weekday and date, a progress bar on
          today, then a solid "Add task" bar that anchors the column. */}
      <div className="px-2 pt-4 pb-2">
        {/* The phone board shows the day in its week strip instead. */}
        {!fill && (
          <button
            onClick={() => onDateClick?.(date)}
            className="block px-1 text-left transition-opacity hover:opacity-70"
          >
            <div className="flex items-center gap-2 text-xl font-semibold tracking-tight text-foreground">
              {today ? "Today" : isTomorrow(date) ? "Tomorrow" : format(date, "EEEE")}
              {pendingTasks.length > 0 && (
                <span
                  className={cn(
                    "rounded px-1.5 py-px text-xs font-semibold tabular-nums",
                    today
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}
                  aria-label={`${pendingTasks.length} open tasks`}
                >
                  {pendingTasks.length}
                </span>
              )}
            </div>
            <div className="text-sm text-muted-foreground">
              {getFormattedDate()}
            </div>
          </button>
        )}

        {/* Reserved on every day so the add bars line up across columns */}
        <div className="mx-1 mt-2.5 h-1.5 overflow-hidden rounded-full">
          {today && (
            <div className="h-full w-full bg-muted">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>

        <div className="mt-3 flex h-9 items-center rounded-md bg-surface pr-1.5 shadow-card">
          <AddTaskInline scheduledDate={dateString} variant="bar" showLabel={today} />
          {totalEstimatedMins > 0 && (
            <span
              className="shrink-0 rounded bg-black/[0.06] px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-muted-foreground dark:bg-black/30"
              title="Planned time"
            >
              {formatDuration(totalEstimatedMins)}
            </span>
          )}
        </div>
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-xs text-destructive">Failed to load</p>
              <button
                onClick={() => refetch()}
                className="text-xs text-muted-foreground hover:text-foreground mt-2 underline"
              >
                Retry
              </button>
            </div>
          ) : isLoading ? (
            <div className="space-y-2 p-1">
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </div>
          ) : (
            <>
              {/* Pending Tasks with sortable context for reordering */}
              <SortableContext
                items={taskIds}
                strategy={verticalListSortingStrategy}
              >
                {pendingTasks.map((task) => (
                  <SortableTaskCard
                    key={task.id}
                    task={task}
                    onSelect={onSelectTask}
                    isDragging={activeTaskId === task.id}
                    scheduledTime={
                      blockStartByTaskId.get(task.id) ??
                      projectedStartByTaskId.get(task.id) ??
                      null
                    }
                    timeIsProjected={!blockStartByTaskId.has(task.id)}
                  />
                ))}
              </SortableContext>

              {/* Drop indicator when empty */}
              {pendingTasks.length === 0 && isDropTarget && (
                <TaskCardPlaceholder />
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="mt-5">
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    Completed ({completedTasks.length})
                  </p>
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onSelect={onSelectTask}
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
