import * as React from "react";
import { Plus, Eraser } from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@open-sunsama/types";
import { useTasks, useCompleteTask } from "@/hooks/useTasks";
import { TaskCardContent } from "@/components/kanban/task-card-content";
import { TaskContextMenu } from "@/components/kanban/task-context-menu";
import { useTasksDnd } from "@/lib/dnd/tasks-dnd-context";
import { cn } from "@/lib/utils";
import { Button, ScrollArea, Skeleton } from "@/components/ui";
import { AddTaskModal } from "@/components/kanban/add-task-modal.lazy";
import { TaskModal } from "@/components/kanban/task-modal.lazy";
import { CleanUpBacklogModal } from "@/components/backlog/clean-up-backlog-modal";

/**
 * The backlog (tasks without a date) as the content of a side panel: a drop
 * target for unscheduling, a sortable list, and add / clean-up actions.
 */
export function BacklogPanel({ className }: { className?: string }) {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [isCleanupOpen, setIsCleanupOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);

  // Use high limit to ensure we get all backlog tasks (API default is 50)
  const BACKLOG_LIMIT = 500;
  const { data: tasks, isLoading } = useTasks({
    backlog: true,
    limit: BACKLOG_LIMIT,
  });
  const { activeTask, isDragging } = useTasksDnd();

  // If we hit exactly the limit, there may be more tasks than shown
  const maybeTruncated = (tasks?.length ?? 0) >= BACKLOG_LIMIT;

  // Make backlog a drop target for unscheduling tasks
  const { setNodeRef, isOver } = useDroppable({
    id: "backlog",
    data: {
      type: "column",
      date: null, // null = unscheduled/backlog
    },
  });

  // Separate pending and completed tasks
  // CRITICAL: Preserve the actively dragged task to prevent removeChild DOM errors
  const { pendingTasks, completedTasks } = React.useMemo(() => {
    const all = tasks ?? [];
    let pending = all
      .filter((task) => !task.completedAt)
      .sort((a, b) => a.position - b.position);
    const completed = all.filter((task) => task.completedAt);

    // If dragging a backlog task, ensure it stays in the list
    if (isDragging && activeTask && activeTask.scheduledDate === null) {
      const isIncluded = pending.some((t) => t.id === activeTask.id);
      if (!isIncluded) {
        pending = [...pending, activeTask];
      }
    }

    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks, isDragging, activeTask]);

  return (
    <div
      ref={setNodeRef}
      aria-label="Backlog"
      className={cn(
        "relative flex h-full flex-col",
        isOver && "ring-1 ring-inset ring-primary/30",
        className
      )}
    >
      {/* Drop feedback when a task is dragged over the backlog */}
      {isOver && <div className="pointer-events-none absolute inset-0 z-10 bg-primary/5" />}

      {/* Header */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between px-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm font-semibold">Backlog</span>
          {pendingTasks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {pendingTasks.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-0.5">
          {pendingTasks.length > 0 && (
            <Button
              variant="ghost"
              size="icon-xs"
              className="h-7 w-7 text-muted-foreground"
              onClick={() => setIsCleanupOpen(true)}
              title="Clean up backlog"
            >
              <Eraser className="h-3.5 w-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon-xs"
            className="h-7 w-7 text-muted-foreground"
            onClick={() => setIsAddModalOpen(true)}
            title="Add a task to the backlog"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="space-y-2 px-2 pb-3">
          {isLoading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-md" />
              ))}
            </div>
          ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No unscheduled tasks
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Drag a card here to take it off its day
              </p>
            </div>
          ) : (
            <>
              <SortableContext
                items={pendingTasks.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {pendingTasks.map((task) => (
                  <SortableBacklogTaskCard
                    key={task.id}
                    task={task}
                    onSelect={() => setSelectedTask(task)}
                  />
                ))}
              </SortableContext>

              {/* Completed Tasks in Backlog */}
              {completedTasks.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    Completed ({completedTasks.length})
                  </p>
                  <div className="space-y-2">
                    {completedTasks.map((task) => (
                      <BacklogTaskCard
                        key={task.id}
                        task={task}
                        onSelect={() => setSelectedTask(task)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Truncation warning */}
              {maybeTruncated && (
                <p className="px-2 pt-3 text-center text-xs text-amber-600 dark:text-amber-400">
                  Showing first {BACKLOG_LIMIT} tasks. Some tasks may be hidden.
                </p>
              )}
            </>
          )}
        </div>
      </ScrollArea>

      <AddTaskModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        scheduledDate={null}
      />
      <CleanUpBacklogModal
        open={isCleanupOpen}
        onOpenChange={setIsCleanupOpen}
      />
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

interface SortableBacklogTaskCardProps {
  task: Task;
  onSelect: () => void;
}

/**
 * Sortable backlog task card that supports:
 * - Reordering within the backlog (drag to reorder)
 * - Dragging to kanban day columns (to schedule)
 * - Dragging to calendar view (to create time blocks)
 */
function SortableBacklogTaskCard({
  task,
  onSelect,
}: SortableBacklogTaskCardProps) {
  const completeTask = useCompleteTask();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
    index,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
      columnId: "backlog", // Fix: Must set columnId for consistent drag handler logic
      source: "backlog",
    },
  });

  // Determine if we should show a drop indicator
  const showIndicator = isOver && active?.id !== task.id;

  // Determine indicator position based on where the item will be inserted
  // Improved logic that works for both same-column and cross-column drags
  const activeColumn = active?.data?.current?.columnId;
  const currentColumn = "backlog";
  const isCrossColumnDrag = activeColumn !== currentColumn;

  let showDropIndicatorAbove = false;
  let showDropIndicatorBelow = false;

  if (showIndicator) {
    if (isCrossColumnDrag) {
      // Cross-column inserts happen before the hovered task.
      showDropIndicatorAbove = true;
    } else {
      // For same-column drags, use index-based logic
      const activeIndex = active?.data?.current?.sortable?.index ?? -1;
      showDropIndicatorAbove = activeIndex > index;
      showDropIndicatorBelow = activeIndex < index && activeIndex !== -1;
    }
  }

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const onTaskClick = () => onSelect();

  return (
    <TaskContextMenu task={task} onEdit={onTaskClick}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn("relative", isDragging && "opacity-30 z-50")}
      >
        {/* Drop indicator line - above */}
        {showDropIndicatorAbove && (
          <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
        )}

        <TaskCardContent
          task={task}
          isCompleted={!!task.completedAt}
          isHovered={false}
          onToggleComplete={(e) => {
            e.stopPropagation();
            completeTask.mutate({ id: task.id, completed: !task.completedAt });
          }}
          onClick={onTaskClick}
          onHoverChange={() => {}}
        />

        {/* Drop indicator line - below */}
        {showDropIndicatorBelow && (
          <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
        )}
      </div>
    </TaskContextMenu>
  );
}

interface BacklogTaskCardProps {
  task: Task;
  onSelect: () => void;
}

/**
 * Non-sortable backlog task card for completed tasks.
 * Has muted/lighter styling to indicate completion.
 */
function BacklogTaskCard({ task, onSelect }: BacklogTaskCardProps) {
  const completeTask = useCompleteTask();

  const onTaskClick = () => onSelect();

  return (
    <TaskContextMenu task={task} onEdit={onTaskClick}>
      <div>
        <TaskCardContent
          task={task}
          isCompleted={!!task.completedAt}
          isHovered={false}
          onToggleComplete={(e) => {
            e.stopPropagation();
            completeTask.mutate({ id: task.id, completed: !task.completedAt });
          }}
          onClick={onTaskClick}
          onHoverChange={() => {}}
        />
      </div>
    </TaskContextMenu>
  );
}
