import * as React from "react";
import { 
  Plus, 
  Inbox, 
  Clock, 
  ChevronLeft, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Check, 
  Home, 
  Calendar, 
  Target,
  Sunrise,
  Sunset,
  Sparkles,
  LayoutList,
  ClipboardCheck,
  FolderPlus,
  UserPlus,
} from "lucide-react";
import { useDroppable } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@open-sunsama/types";
import { useTasks } from "@/hooks/useTasks";
import { useHoveredTask } from "@/hooks/useKeyboardShortcuts";
import { useTasksDnd } from "@/lib/dnd/tasks-dnd-context";
import { cn, formatDuration } from "@/lib/utils";
import {
  Button,
  ScrollArea,
  Skeleton,
} from "@/components/ui";
import { AddTaskModal } from "@/components/kanban/add-task-modal";
import { TaskModal } from "@/components/kanban/task-modal";

const SIDEBAR_COLLAPSED_KEY = "open-sunsama-sidebar-collapsed";
const BACKLOG_EXPANDED_KEY = "open-sunsama-backlog-expanded";

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

  // Use high limit to ensure we get all backlog tasks (API default is 50)
  const BACKLOG_LIMIT = 500;
  const { data: tasks, isLoading } = useTasks({ backlog: true, limit: BACKLOG_LIMIT });
  const { activeTask, isDragging } = useTasksDnd();
  
  // If we hit exactly the limit, there may be more tasks than shown
  const maybeTruncated = (tasks?.length ?? 0) >= BACKLOG_LIMIT;

  // Make backlog a drop target for unscheduling tasks
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
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
    let pending = all.filter((task) => !task.completedAt).sort((a, b) => a.position - b.position);
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
        ref={setDroppableRef}
        className={cn(
          "flex h-full w-10 flex-col items-center border-r border-border/40 bg-background/50 py-3 transition-all duration-300 ease-in-out",
          isOver && "bg-primary/5 border-primary/30", // Visual feedback when dragging over
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
      ref={setDroppableRef}
      className={cn(
        "flex h-full w-72 flex-col border-r border-border/40 bg-background/50 transition-all duration-300 ease-in-out",
        isOver && "bg-primary/5 border-primary/30", // Visual feedback when dragging over
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

              {/* Truncation warning */}
              {maybeTruncated && (
                <div className="pt-3 mt-3 border-t border-border/40 px-2 text-center">
                  <p className="text-xs text-amber-600 dark:text-amber-400">
                    Showing first {BACKLOG_LIMIT} tasks. Some tasks may be hidden.
                  </p>
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
  const { setHoveredTask } = useHoveredTask();
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
      onMouseEnter={() => setHoveredTask(task)}
      onMouseLeave={() => setHoveredTask(null)}
      className={cn(
        "relative",
        isDragging && "opacity-30 z-50"
      )}
    >
      {/* Drop indicator line - above */}
      {showDropIndicatorAbove && (
        <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
      )}
      
      <div
        className={cn(
          "group flex items-center justify-between gap-2 rounded px-2 py-1.5 transition-all duration-150",
          "hover:bg-muted/50",
          "cursor-grab active:cursor-grabbing touch-none select-none"
        )}
      >
        {/* Content - compact */}
        <div className="min-w-0 flex-1 flex items-center gap-2">
          <div className="h-3.5 w-3.5 rounded-full border border-muted-foreground/40 shrink-0" />
          <p className="text-xs leading-snug truncate text-foreground/90">
            {task.title}
          </p>
        </div>
        
        {/* Duration - compact */}
        {task.estimatedMins && task.estimatedMins > 0 && (
          <span className="shrink-0 text-[10px] text-muted-foreground/60 tabular-nums">
            {formatDuration(task.estimatedMins)}
          </span>
        )}
      </div>
      
      {/* Drop indicator line - below */}
      {showDropIndicatorBelow && (
        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
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
  const { setHoveredTask } = useHoveredTask();
  const isCompleted = !!task.completedAt;

  return (
    <div
      onClick={onSelect}
      onMouseEnter={() => setHoveredTask(task)}
      onMouseLeave={() => setHoveredTask(null)}
      className={cn(
        "group flex items-center justify-between gap-2 rounded px-2 py-1.5 transition-all duration-150",
        "hover:bg-muted/30",
        "cursor-pointer select-none",
        isCompleted && "opacity-50 hover:opacity-60"
      )}
    >
      {/* Content - compact */}
      <div className="min-w-0 flex-1 flex items-center gap-2">
        {/* Completion indicator */}
        {isCompleted && (
          <div className="h-3.5 w-3.5 rounded-full bg-primary/60 flex items-center justify-center shrink-0">
            <Check className="h-2 w-2 text-primary-foreground" strokeWidth={3} />
          </div>
        )}
        <p
          className={cn(
            "text-xs leading-snug truncate",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
      </div>
      
      {/* Duration - compact */}
      {task.estimatedMins && task.estimatedMins > 0 && (
        <span className="shrink-0 text-[10px] text-muted-foreground/50 tabular-nums">
          {formatDuration(task.estimatedMins)}
        </span>
      )}
    </div>
  );
}
