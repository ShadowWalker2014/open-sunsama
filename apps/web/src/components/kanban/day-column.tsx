import * as React from "react";
import { format, isToday } from "date-fns";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { Clock } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { useTasks } from "@/hooks/useTasks";
import { cn, formatDuration } from "@/lib/utils";
import { Badge, ScrollArea, Skeleton } from "@/components/ui";
import { TaskCard, TaskCardPlaceholder } from "./task-card";
import { AddTaskInline } from "./add-task-inline";

interface DayColumnProps {
  date: Date;
  dateString: string;
  onSelectTask: (task: Task) => void;
  isOver?: boolean | undefined;
  activeTaskId?: string | null | undefined;
}

/**
 * Individual day column in the kanban board.
 * Shows tasks for a specific date with drag-and-drop support.
 */
export function DayColumn({
  date,
  dateString,
  onSelectTask,
  isOver,
  activeTaskId,
}: DayColumnProps) {
  const { data: tasks, isLoading } = useTasks({ scheduledDate: dateString });

  const { setNodeRef, isOver: isOverDroppable } = useDroppable({
    id: `day-${dateString}`,
    data: {
      type: "day",
      date: dateString,
    },
  });

  const today = isToday(date);
  const isDropTarget = isOver || isOverDroppable;

  // Separate pending and completed tasks
  const pendingTasks = React.useMemo(
    () => tasks?.filter((t) => !t.completedAt).sort((a, b) => a.position - b.position) ?? [],
    [tasks]
  );
  const completedTasks = React.useMemo(
    () => tasks?.filter((t) => t.completedAt) ?? [],
    [tasks]
  );

  // Calculate total estimated time
  const totalEstimatedMins = React.useMemo(
    () => pendingTasks.reduce((sum, t) => sum + (t.estimatedMins ?? 0), 0),
    [pendingTasks]
  );

  // Get task IDs for sortable context
  const taskIds = React.useMemo(
    () => pendingTasks.map((t) => t.id),
    [pendingTasks]
  );

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-w-[280px] max-w-[280px] flex-col border-r last:border-r-0 transition-colors",
        today && "bg-primary/5",
        isDropTarget && "bg-primary/10"
      )}
    >
      {/* Day Header */}
      <div
        className={cn(
          "sticky top-0 z-10 border-b bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/60",
          today && "bg-primary/5"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Day name and date */}
            <div>
              <p
                className={cn(
                  "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                  today && "text-primary"
                )}
              >
                {format(date, "EEE")}
              </p>
              <p
                className={cn(
                  "text-2xl font-bold tabular-nums",
                  today && "text-primary"
                )}
              >
                {format(date, "d")}
              </p>
            </div>
            
            {/* Today indicator */}
            {today && (
              <Badge variant="default" className="text-xs">
                Today
              </Badge>
            )}
          </div>

          {/* Stats */}
          <div className="text-right">
            {/* Task count */}
            {pendingTasks.length > 0 && (
              <p className="text-sm font-medium text-muted-foreground">
                {pendingTasks.length} task{pendingTasks.length !== 1 ? "s" : ""}
              </p>
            )}
            {/* Total estimated time */}
            {totalEstimatedMins > 0 && (
              <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {formatDuration(totalEstimatedMins)}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tasks */}
      <ScrollArea className="flex-1">
        <div className="p-2 pb-4">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          ) : (
            <SortableContext
              items={taskIds}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {/* Pending Tasks */}
                {pendingTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onSelect={onSelectTask}
                    isDragging={activeTaskId === task.id}
                  />
                ))}

                {/* Drop indicator when empty */}
                {pendingTasks.length === 0 && isDropTarget && (
                  <TaskCardPlaceholder />
                )}

                {/* Empty state */}
                {pendingTasks.length === 0 && !isDropTarget && (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <p className="text-sm text-muted-foreground">
                      No tasks scheduled
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      Drag tasks here or add new ones
                    </p>
                  </div>
                )}

                {/* Completed Tasks Section */}
                {completedTasks.length > 0 && (
                  <div className="pt-4">
                    <div className="flex items-center gap-2 pb-2">
                      <div className="h-px flex-1 bg-border" />
                      <span className="text-xs font-medium text-muted-foreground">
                        Completed ({completedTasks.length})
                      </span>
                      <div className="h-px flex-1 bg-border" />
                    </div>
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
              </div>
            </SortableContext>
          )}
        </div>
      </ScrollArea>

      {/* Add Task Button */}
      <div className="border-t p-2">
        <AddTaskInline scheduledDate={dateString} />
      </div>
    </div>
  );
}
