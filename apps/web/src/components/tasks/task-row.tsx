import * as React from "react";
import { Check, Clock, ChevronDown, ChevronRight, MoreHorizontal } from "lucide-react";
import type { Task, TaskPriority } from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";
import { useSubtasks, useUpdateSubtask } from "@/hooks/useSubtasks";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { useDeleteTask, useMoveTask } from "@/hooks/useTasks";
import { useNavigate } from "@tanstack/react-router";
import { addDays, format } from "date-fns";

const PRIORITY_DOT_COLORS: Record<TaskPriority, string> = {
  P0: "bg-red-500",
  P1: "bg-orange-500",
  P2: "bg-blue-400",
  P3: "bg-slate-300 dark:bg-slate-600",
};

export interface TaskRowProps {
  task: Task;
  onSelect: () => void;
  onComplete: () => void;
}

export function TaskRow({ 
  task, 
  onSelect, 
  onComplete,
}: TaskRowProps) {
  const isCompleted = !!task.completedAt;
  const [showSubtasks, setShowSubtasks] = React.useState(false);
  const { data: subtasks = [] } = useSubtasks(task.id);
  const updateSubtask = useUpdateSubtask();
  const deleteTask = useDeleteTask();
  const moveTask = useMoveTask();
  const navigate = useNavigate();

  // Sort subtasks by position
  const sortedSubtasks = React.useMemo(() => {
    return [...subtasks].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
  }, [subtasks]);

  const hasSubtasks = sortedSubtasks.length > 0;
  const completedSubtasksCount = sortedSubtasks.filter((s) => s.completed).length;

  const handleToggleSubtasks = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasSubtasks) {
      setShowSubtasks(!showSubtasks);
    }
  };

  const handleSubtaskToggle = (e: React.MouseEvent, subtaskId: string, completed: boolean) => {
    e.stopPropagation();
    updateSubtask.mutate({ 
      taskId: task.id, 
      subtaskId, 
      data: { completed: !completed } 
    });
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteTask.mutateAsync(task.id);
  };

  const handleDeferToNextWeek = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextWeek = addDays(new Date(), 7);
    const dateStr = format(nextWeek, "yyyy-MM-dd");
    await moveTask.mutateAsync({ id: task.id, targetDate: dateStr });
  };

  const handleMoveToBacklog = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await moveTask.mutateAsync({ id: task.id, targetDate: null });
  };

  const handleFocus = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate({ to: `/app/focus/${task.id}` });
  };

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer transition-colors",
          "hover:bg-accent/50",
          isCompleted && "opacity-50"
        )}
        onClick={onSelect}
      >
        {/* Subtasks Toggle */}
        {hasSubtasks ? (
          <button
            onClick={handleToggleSubtasks}
            className="shrink-0 p-0.5 -ml-0.5 rounded hover:bg-accent transition-colors"
          >
            {showSubtasks ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-4 shrink-0" />
        )}

        {/* Checkbox */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onComplete();
          }}
          className={cn(
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all cursor-pointer",
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary hover:bg-primary/5"
          )}
        >
          {isCompleted && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
        </button>

        {/* Priority Dot */}
        <span
          className={cn(
            "h-2 w-2 shrink-0 rounded-full",
            PRIORITY_DOT_COLORS[task.priority]
          )}
          title={task.priority}
        />

        {/* Title */}
        <span
          className={cn(
            "flex-1 text-sm truncate",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </span>

        {/* Subtask Progress Indicator */}
        {hasSubtasks && !showSubtasks && (
          <span className="text-xs text-muted-foreground shrink-0">
            {completedSubtasksCount}/{subtasks.length}
          </span>
        )}

        {/* Duration badge (optional) */}
        {task.estimatedMins && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <Clock className="h-3 w-3" />
            {formatDuration(task.estimatedMins)}
          </span>
        )}

        {/* Quick Actions Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 p-1 rounded hover:bg-accent"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            <DropdownMenuItem onClick={handleFocus}>
              Focus
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDeferToNextWeek}>
              Defer to next week
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleMoveToBacklog}>
              Move to backlog
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Compact Subtasks List (Linear-style) */}
      {showSubtasks && hasSubtasks && (
        <div className="ml-[3.25rem] pb-1">
          {sortedSubtasks.map((subtask) => (
            <div
              key={subtask.id}
              className="flex items-center gap-2 py-[3px] group/subtask"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={(e) => handleSubtaskToggle(e, subtask.id, subtask.completed)}
                className={cn(
                  "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border transition-colors cursor-pointer",
                  subtask.completed
                    ? "border-primary/60 bg-primary/60 text-primary-foreground"
                    : "border-muted-foreground/30 hover:border-primary"
                )}
              >
                {subtask.completed && <Check className="h-2 w-2" strokeWidth={3} />}
              </button>
              <span
                className={cn(
                  "text-xs text-muted-foreground truncate",
                  subtask.completed && "line-through opacity-50"
                )}
              >
                {subtask.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
