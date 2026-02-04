import * as React from "react";
import { format, isToday, isTomorrow, isPast, isYesterday } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Clock } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { useTasks } from "@/hooks/useTasks";
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
}: DayColumnProps) {
  // Use explicit limit to prevent accidental truncation (API default is 50)
  const {
    data: tasks,
    isLoading,
    isError,
    refetch,
  } = useTasks({ scheduledDate: dateString, limit: 200 });
  const { activeTask, activeOverColumn, isDragging } = useTasksDnd();

  const { setNodeRef, isOver: isOverDroppable } = useDroppable({
    id: `day-${dateString}`,
    data: {
      type: "column",
      date: dateString,
    },
  });

  const today = isToday(date);
  const tomorrow = isTomorrow(date);
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
  const pendingTasks = React.useMemo(() => {
    let filtered = sortTasks(tasks?.filter((t) => !t.completedAt) ?? []);

    // If dragging a task that belongs to this column, ensure it stays in the list
    if (isDragging && activeTask?.scheduledDate === dateString) {
      const isIncluded = filtered.some((t) => t.id === activeTask.id);
      if (!isIncluded) {
        // Task was filtered out during drag - keep it at the end
        filtered = [...filtered, activeTask];
      }
    }

    return filtered;
  }, [tasks, sortTasks, isDragging, activeTask, dateString]);

  const completedTasks = React.useMemo(
    () => tasks?.filter((t) => t.completedAt) ?? [],
    [tasks]
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
  const totalTasks = pendingTasks.length + completedTasks.length;
  const progressPercent =
    totalTasks > 0 ? Math.round((completedTasks.length / totalTasks) * 100) : 0;

  // Get day label - "Today", "Tomorrow", or day name like "Thursday"
  const getDayLabel = () => {
    if (today) return "Today";
    if (tomorrow) return "Tomorrow";
    if (yesterday) return "Yesterday";
    return format(date, "EEEE");
  };

  // Get formatted date like "January 29"
  const getFormattedDate = () => {
    return format(date, "MMMM d");
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-[calc(100vw-1rem)] sm:w-[280px] sm:min-w-[280px] sm:max-w-[280px] flex-shrink-0 flex-col border-r border-border/40 transition-colors duration-150",
        // Today highlight
        today && "bg-primary/[0.02]",
        // Subtle highlight during any drag operation
        isDragging && !isDropTarget && "bg-muted/20",
        // Drop target highlight with ring
        isDropTarget && "bg-primary/5 ring-2 ring-primary/20 ring-inset",
        // Past days are slightly muted
        pastDay && "opacity-60"
      )}
    >
      {/* Day Header - Sunsama style */}
      <div
        className={cn(
          "sticky top-0 z-10 border-b border-border/40 bg-background px-3 pt-3 pb-2",
          today && "bg-primary/[0.03]"
        )}
      >
        {/* Top row: Day name and task count - clickable */}
        <button
          onClick={() => onDateClick?.(date)}
          className="flex items-center gap-2 hover:opacity-70 transition-opacity cursor-pointer text-left"
        >
          <span
            className={cn(
              "text-base font-semibold",
              today ? "text-foreground" : "text-foreground"
            )}
          >
            {getDayLabel()}
          </span>
          {totalTasks > 0 && (
            <span
              className={cn(
                "text-xs px-1.5 py-0.5 rounded",
                today
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {totalTasks}
            </span>
          )}
        </button>

        {/* Date - smaller text below */}
        <div className="text-sm text-muted-foreground mt-0.5">
          {getFormattedDate()}
        </div>

        {/* Progress bar - only show on Today column when there are tasks */}
        {today && totalTasks > 0 && (
          <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Add task row with total time - Sunsama style */}
        <div className="flex items-center justify-between mt-3">
          {/* Add task button */}
          <AddTaskInline scheduledDate={dateString} compact />

          {/* Total time estimate with clock icon */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span className="tabular-nums">
              {formatDuration(totalEstimatedMins)}
            </span>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
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
                  />
                ))}
              </SortableContext>

              {/* Drop indicator when empty */}
              {pendingTasks.length === 0 && isDropTarget && (
                <TaskCardPlaceholder />
              )}

              {/* Empty state */}
              {pendingTasks.length === 0 && !isDropTarget && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">No tasks</p>
                </div>
              )}

              {/* Completed Tasks */}
              {completedTasks.length > 0 && (
                <div className="pt-3 mt-3 border-t border-border/40">
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    Completed ({completedTasks.length})
                  </p>
                  <div className="space-y-1">
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
