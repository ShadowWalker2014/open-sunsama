import * as React from "react";
import { Clock, GripVertical, ListTodo } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import { Badge, ScrollArea, Skeleton } from "@/components/ui";

interface UnscheduledTasksProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskDragStart?: (task: Task, e: React.MouseEvent) => void;
  onTaskClick?: (task: Task) => void;
  className?: string;
}

/**
 * UnscheduledTasksPanel - Left panel showing tasks scheduled for today but not time-blocked
 */
export function UnscheduledTasksPanel({
  tasks,
  isLoading = false,
  onTaskDragStart,
  onTaskClick,
  className,
}: UnscheduledTasksProps) {
  const taskCount = tasks.length;

  return (
    <div
      className={cn(
        "flex w-72 flex-col border-r bg-muted/30",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <ListTodo className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Unscheduled</h3>
        </div>
        {taskCount > 0 && (
          <Badge variant="secondary" className="h-5 min-w-[20px] justify-center">
            {taskCount}
          </Badge>
        )}
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {isLoading ? (
            // Loading skeletons
            <>
              <TaskItemSkeleton />
              <TaskItemSkeleton />
              <TaskItemSkeleton />
            </>
          ) : tasks.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
              <div className="rounded-full bg-muted p-3 mb-3">
                <ListTodo className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No unscheduled tasks
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag tasks here from the backlog or create new ones
              </p>
            </div>
          ) : (
            // Task items
            tasks.map((task) => (
              <UnscheduledTaskItem
                key={task.id}
                task={task}
                onDragStart={(e) => onTaskDragStart?.(task, e)}
                onClick={() => onTaskClick?.(task)}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* Footer with instructions */}
      {!isLoading && tasks.length > 0 && (
        <div className="border-t px-4 py-2">
          <p className="text-xs text-muted-foreground text-center">
            Drag tasks to the timeline to schedule them
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Individual unscheduled task item
 */
interface UnscheduledTaskItemProps {
  task: Task;
  onDragStart?: (e: React.MouseEvent) => void;
  onClick?: () => void;
}

function UnscheduledTaskItem({
  task,
  onDragStart,
  onClick,
}: UnscheduledTaskItemProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    onDragStart?.(e);

    // Add global mouse up listener to reset dragging state
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mouseup", handleMouseUp);
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card p-3 transition-all",
        "hover:shadow-md hover:border-primary/30",
        isDragging && "opacity-50 cursor-grabbing shadow-lg",
        !isDragging && "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
    >
      {/* Drag handle indicator */}
      <div className="absolute left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-40 transition-opacity">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Content */}
      <div className="pl-4">
        {/* Title */}
        <p className="text-sm font-medium truncate pr-2">
          {task.title}
        </p>

        {/* Estimated duration */}
        {task.estimatedMins && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(task.estimatedMins)}</span>
          </div>
        )}

        {/* Notes preview */}
        {task.notes && (
          <p className="mt-1.5 text-xs text-muted-foreground truncate">
            {task.notes}
          </p>
        )}
      </div>

      {/* Visual indicator that this can be dragged */}
      <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
          Drag to schedule
        </Badge>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for task items
 */
function TaskItemSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3">
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-3 w-1/4" />
    </div>
  );
}
