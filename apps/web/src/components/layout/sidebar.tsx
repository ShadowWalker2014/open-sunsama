import * as React from "react";
import { Plus, Inbox, Clock, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@open-sunsama/types";
import { useTasks } from "@/hooks/useTasks";
import { cn, formatDuration } from "@/lib/utils";
import {
  Button,
  ScrollArea,
  Skeleton,
} from "@/components/ui";
import { AddTaskModal } from "@/components/kanban/add-task-modal";
import { TaskModal } from "@/components/kanban/task-modal";

const SIDEBAR_COLLAPSED_KEY = "open-sunsama-sidebar-collapsed";

interface SidebarProps {
  className?: string;
}

/**
 * Linear-style sidebar showing the task backlog
 * Tasks without a scheduled date appear here
 */
export function Sidebar({ className }: SidebarProps) {
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [selectedTask, setSelectedTask] = React.useState<Task | null>(null);
  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
  });

  const { data: tasks, isLoading } = useTasks({ backlog: true });

  // Separate pending and completed tasks
  const { pendingTasks, completedTasks } = React.useMemo(() => {
    const all = tasks ?? [];
    const pending = all.filter((task) => !task.completedAt).sort((a, b) => a.position - b.position);
    const completed = all.filter((task) => task.completedAt);
    return { pendingTasks: pending, completedTasks: completed };
  }, [tasks]);

  // For backwards compatibility with collapsed view count
  const backlogTasks = pendingTasks;

  const toggleCollapsed = React.useCallback(() => {
    setIsCollapsed((prev) => {
      const newValue = !prev;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(newValue));
      return newValue;
    });
  }, []);

  // Collapsed view - thin bar with expand button
  if (isCollapsed) {
    return (
      <aside
        className={cn(
          "flex h-full w-10 flex-col items-center border-r border-border/40 bg-background/50 py-3 transition-all duration-300 ease-in-out",
          className
        )}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={toggleCollapsed}
          title="Expand backlog"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <div className="mt-2 flex flex-col items-center gap-1">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          {backlogTasks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {backlogTasks.length}
            </span>
          )}
        </div>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "flex h-full w-72 flex-col border-r border-border/40 bg-background/50 transition-all duration-300 ease-in-out",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
        <div className="flex items-center gap-2">
          <Inbox className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Backlog</span>
          {backlogTasks.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {backlogTasks.length}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setIsAddModalOpen(true)}
            title="Add task"
          >
            <Plus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={toggleCollapsed}
            title="Collapse backlog"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="space-y-2 p-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </div>
          ) : pendingTasks.length === 0 && completedTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No unscheduled tasks
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Tasks without a date appear here
              </p>
            </div>
          ) : (
            <>
              {/* Pending Tasks */}
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

              {/* Empty pending state when there are only completed tasks */}
              {pendingTasks.length === 0 && completedTasks.length > 0 && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    All tasks completed!
                  </p>
                </div>
              )}

              {/* Completed Tasks in Backlog */}
              {completedTasks.length > 0 && (
                <div className="pt-3 mt-3 border-t border-border/40">
                  <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
                    Completed ({completedTasks.length})
                  </p>
                  <div className="space-y-1">
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
            </>
          )}
        </div>
      </ScrollArea>

      {/* Add Task Modal */}
      <AddTaskModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        scheduledDate={null}
      />

      {/* Task Detail Modal */}
      <TaskModal
        task={selectedTask}
        open={selectedTask !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedTask(null);
        }}
      />
    </aside>
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
function SortableBacklogTaskCard({ task, onSelect }: SortableBacklogTaskCardProps) {
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
      source: "backlog",
    },
  });

  // Determine if we should show a drop indicator
  const showIndicator = isOver && active?.id !== task.id;
  
  // Determine indicator position based on where the item will be inserted
  const activeIndex = active?.data?.current?.sortable?.index ?? -1;
  const showDropIndicatorAbove = showIndicator && activeIndex > index;
  const showDropIndicatorBelow = showIndicator && activeIndex < index && activeIndex !== -1;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={cn(
        "relative",
        isDragging && "opacity-30 z-50"
      )}
    >
      {/* Drop indicator line - above */}
      {showDropIndicatorAbove && (
        <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10 shadow-[0_0_4px_rgba(var(--primary),0.5)]" />
      )}
      
      <div
        className={cn(
          "group flex items-start gap-3 rounded-lg px-3 py-2 transition-all duration-150",
          "bg-card/50 hover:bg-card",
          "border border-transparent hover:border-border/50",
          "cursor-grab active:cursor-grabbing touch-none select-none"
        )}
      >
        {/* Content */}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium leading-snug truncate">
            {task.title}
          </p>
          {task.estimatedMins && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Clock className="h-3 w-3" />
              {formatDuration(task.estimatedMins)}
            </span>
          )}
        </div>
      </div>
      
      {/* Drop indicator line - below */}
      {showDropIndicatorBelow && (
        <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10 shadow-[0_0_4px_rgba(var(--primary),0.5)]" />
      )}
    </div>
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
  const isCompleted = !!task.completedAt;

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group flex items-start gap-2.5 rounded-lg px-3 py-2 transition-all duration-200",
        "bg-card/30 hover:bg-card/50",
        "border border-transparent hover:border-border/30",
        "cursor-pointer select-none",
        // Completed state - muted styling
        isCompleted && "opacity-60 hover:opacity-70"
      )}
    >
      {/* Completion indicator */}
      {isCompleted && (
        <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/80 text-primary-foreground">
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        </div>
      )}

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-sm font-medium leading-snug truncate",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        {task.estimatedMins && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground/70 mt-1">
            <Clock className="h-3 w-3" />
            {formatDuration(task.estimatedMins)}
          </span>
        )}
      </div>
    </div>
  );
}
