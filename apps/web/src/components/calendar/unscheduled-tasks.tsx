import * as React from "react";
import { ListTodo } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { Badge, ScrollArea } from "@/components/ui";
import { UnscheduledTaskItem, TaskItemSkeleton } from "./unscheduled-task-item";
import { MobileUnscheduledSheet } from "./mobile-unscheduled-sheet";

interface UnscheduledTasksProps {
  tasks: Task[];
  isLoading?: boolean;
  onTaskDragStart?: (task: Task, e: React.MouseEvent) => void;
  onTaskClick?: (task: Task) => void;
  className?: string;
}

/**
 * UnscheduledTasksPanel - Left panel showing tasks scheduled for today but not time-blocked
 * On mobile, this becomes a bottom sheet that can be toggled
 */
export function UnscheduledTasksPanel({
  tasks,
  isLoading = false,
  onTaskDragStart,
  onTaskClick,
  className,
}: UnscheduledTasksProps) {
  const taskCount = tasks.length;

  // Desktop panel content
  const panelContent = (
    <>
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

    </>
  );

  return (
    <>
      {/* Desktop panel - hidden on mobile */}
      <div
        className={cn(
          "hidden md:flex w-72 flex-col border-r bg-muted/30",
          className
        )}
      >
        {panelContent}
      </div>

      {/* Mobile bottom sheet trigger */}
      <MobileUnscheduledSheet
        tasks={tasks}
        isLoading={isLoading}
        onTaskDragStart={onTaskDragStart}
        onTaskClick={onTaskClick}
      />
    </>
  );
}
