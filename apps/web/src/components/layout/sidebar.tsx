import * as React from "react";
import { Plus, Inbox, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import type { Task } from "@chronoflow/types";
import { useTasks } from "@/hooks/useTasks";
import { cn, formatDuration } from "@/lib/utils";
import {
  Button,
  ScrollArea,
  Skeleton,
} from "@/components/ui";
import { AddTaskModal } from "@/components/kanban/add-task-modal";
import { TaskModal } from "@/components/kanban/task-modal";

const SIDEBAR_COLLAPSED_KEY = "chronoflow-sidebar-collapsed";

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

  const backlogTasks = React.useMemo(() => {
    return tasks?.filter((task) => !task.completedAt) ?? [];
  }, [tasks]);

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
          ) : backlogTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-sm text-muted-foreground">
                No unscheduled tasks
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Tasks without a date appear here
              </p>
            </div>
          ) : (
            backlogTasks.map((task) => (
              <BacklogTaskCard
                key={task.id}
                task={task}
                onSelect={() => setSelectedTask(task)}
              />
            ))
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

interface BacklogTaskCardProps {
  task: Task;
  onSelect: () => void;
}

function BacklogTaskCard({ task, onSelect }: BacklogTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
  } = useDraggable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onSelect}
      className={cn(
        "group flex items-start gap-3 rounded-lg px-3 py-2 transition-all duration-150",
        "bg-card/50 hover:bg-card",
        "border border-transparent hover:border-border/50",
        "cursor-grab active:cursor-grabbing touch-none select-none",
        isDragging && "opacity-30"
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
  );
}
