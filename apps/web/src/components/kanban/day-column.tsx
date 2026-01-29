import * as React from "react";
import { format, isToday, isTomorrow, isPast, isYesterday } from "date-fns";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Clock } from "lucide-react";
import type { Task, TaskSortBy } from "@chronoflow/types";
import { useTasks } from "@/hooks/useTasks";
import { cn, formatDuration } from "@/lib/utils";
import { ScrollArea, Skeleton } from "@/components/ui";
import { TaskCard, TaskCardPlaceholder } from "./task-card";
import { AddTaskInline } from "./add-task-inline";

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
  isOver?: boolean;
  activeTaskId?: string | null;
  sortBy?: TaskSortBy;
}

/**
 * Linear-style day column with clean header and task list.
 */
export function DayColumn({
  date,
  dateString,
  onSelectTask,
  isOver,
  activeTaskId,
  sortBy = "position",
}: DayColumnProps) {
  const { data: tasks, isLoading } = useTasks({ scheduledDate: dateString });

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
  const isDropTarget = isOver || isOverDroppable;

  // Sort function based on sortBy
  const sortTasks = React.useCallback(
    (taskList: Task[]) => {
      const sorted = [...taskList];
      switch (sortBy) {
        case "priority":
          return sorted.sort((a, b) => {
            const priorityDiff =
              (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
            if (priorityDiff !== 0) return priorityDiff;
            return a.position - b.position;
          });
        case "createdAt":
          return sorted.sort((a, b) => {
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return dateB - dateA; // Newest first
          });
        case "position":
        default:
          return sorted.sort((a, b) => a.position - b.position);
      }
    },
    [sortBy]
  );

  // Separate pending and completed tasks
  const pendingTasks = React.useMemo(
    () => sortTasks(tasks?.filter((t) => !t.completedAt) ?? []),
    [tasks, sortTasks]
  );
  const completedTasks = React.useMemo(
    () => tasks?.filter((t) => t.completedAt) ?? [],
    [tasks]
  );

  // Task IDs for sortable context
  const taskIds = React.useMemo(
    () => pendingTasks.map((t) => t.id),
    [pendingTasks]
  );

  // Calculate total estimated time
  const totalEstimatedMins = React.useMemo(
    () => pendingTasks.reduce((sum, t) => sum + (t.estimatedMins ?? 0), 0),
    [pendingTasks]
  );

  // Get day label
  const getDayLabel = () => {
    if (today) return "Today";
    if (tomorrow) return "Tomorrow";
    if (yesterday) return "Yesterday";
    return format(date, "EEEE");
  };

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-w-[280px] max-w-[280px] flex-col border-r border-border/40 transition-colors",
        // Today highlight
        today && "bg-primary/[0.02]",
        // Drop target highlight
        isDropTarget && "bg-primary/5",
        // Past days are slightly muted
        pastDay && "opacity-60"
      )}
    >
      {/* Day Header - Linear style */}
      <div
        className={cn(
          "sticky top-0 z-10 border-b border-border/40 bg-background/95 px-3 py-3 backdrop-blur-sm",
          today && "bg-primary/[0.02]"
        )}
      >
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            {/* Day name */}
            <span
              className={cn(
                "text-sm font-medium",
                today ? "text-primary" : "text-foreground"
              )}
            >
              {getDayLabel()}
            </span>
            {/* Date number */}
            <span className="text-sm text-muted-foreground">
              {format(date, "MMM d")}
            </span>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {pendingTasks.length > 0 && (
              <span>{pendingTasks.length}</span>
            )}
            {totalEstimatedMins > 0 && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(totalEstimatedMins)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
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
                  <TaskCard
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
                  <p className="text-sm text-muted-foreground">
                    No tasks
                  </p>
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

      {/* Add Task Button */}
      <div className="border-t border-border/40 p-2">
        <AddTaskInline scheduledDate={dateString} />
      </div>
    </div>
  );
}
