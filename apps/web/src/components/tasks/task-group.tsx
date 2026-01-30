import * as React from "react";
import { ChevronRight } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { TaskRow } from "./task-row";

export interface TaskGroupProps {
  label: string;
  tasks: Task[];
  isOverdue?: boolean;
  defaultExpanded?: boolean;
  onSelectTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
}

export function TaskGroup({
  label,
  tasks,
  isOverdue = false,
  defaultExpanded = true,
  onSelectTask,
  onCompleteTask,
}: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div className="mb-1">
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex items-center gap-2 w-full px-3 py-2 text-sm font-medium rounded-md transition-colors",
          "hover:bg-accent/30",
          isOverdue && "text-red-500"
        )}
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
        <span className="truncate">{label}</span>
        <span className="text-xs text-muted-foreground font-normal ml-1">
          {tasks.length}
        </span>
      </button>

      {/* Task List */}
      {isExpanded && (
        <div className="ml-3 border-l border-border/50 pl-2 mt-0.5">
          {tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onSelect={() => onSelectTask(task)}
              onComplete={() => onCompleteTask(task)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
