import * as React from "react";
import { ChevronRight } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { SortableTaskRow } from "./sortable-task-row";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useReorderTasks } from "@/hooks/useTasks";

export interface TaskGroupProps {
  label: string;
  tasks: Task[];
  isOverdue?: boolean;
  defaultExpanded?: boolean;
  onSelectTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  /** Date key for this group (for reordering) - "backlog" for no date, or date string */
  dateKey?: string;
}

export function TaskGroup({
  label,
  tasks,
  isOverdue = false,
  defaultExpanded = true,
  onSelectTask,
  onCompleteTask,
  dateKey,
}: TaskGroupProps) {
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  const reorderTasks = useReorderTasks();

  if (tasks.length === 0) {
    return null;
  }

  // Determine the date key for reordering
  const groupDateKey = dateKey ?? (tasks[0]?.scheduledDate || "backlog");
  const taskIds = tasks.map((t) => t.id);

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
          <SortableContext
            items={taskIds}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <SortableTaskRow
                key={task.id}
                task={task}
                onSelect={() => onSelectTask(task)}
                onComplete={() => onCompleteTask(task)}
              />
            ))}
          </SortableContext>
        </div>
      )}
    </div>
  );
}
