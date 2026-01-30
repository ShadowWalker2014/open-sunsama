import * as React from "react";
import { Check, Clock } from "lucide-react";
import type { Task, TaskPriority } from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";

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

export function TaskRow({ task, onSelect, onComplete }: TaskRowProps) {
  const isCompleted = !!task.completedAt;

  return (
    <div
      className={cn(
        "group flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer transition-colors",
        "hover:bg-accent/50",
        isCompleted && "opacity-50"
      )}
      onClick={onSelect}
    >
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

      {/* Duration badge (optional) */}
      {task.estimatedMins && (
        <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <Clock className="h-3 w-3" />
          {formatDuration(task.estimatedMins)}
        </span>
      )}
    </div>
  );
}
