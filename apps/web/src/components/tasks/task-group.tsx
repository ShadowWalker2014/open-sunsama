import * as React from "react";
import { ChevronRight } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { SortableTaskRow } from "./sortable-task-row";
import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export interface TaskGroupProps {
  label: string;
  tasks: Task[];
  isOverdue?: boolean;
  defaultExpanded?: boolean;
  onSelectTask: (task: Task) => void;
  onCompleteTask: (task: Task) => void;
  /** Date key for this group - "backlog" for no date, or "YYYY-MM-DD" date string */
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

  // Determine the date key for this group
  const groupDateKey = dateKey ?? (tasks[0]?.scheduledDate || "backlog");
  const groupId = `group-${groupDateKey}`;
  const taskIds = tasks.map((t) => t.id);

  // Make the group container droppable
  const { setNodeRef, isOver } = useDroppable({
    id: groupId,
    data: {
      type: "group",
      dateKey: groupDateKey,
    },
  });

  if (tasks.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "mb-2 rounded-lg border border-border/60 bg-card/40",
        isOver && "border-primary/40 bg-primary/5"
      )}
      ref={setNodeRef}
    >
      {/* Group Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={cn(
          "flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-sm font-medium transition-colors",
          "hover:bg-accent/30",
          isOverdue && "text-red-500",
          isOver && "bg-accent/40"
        )}
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
            isExpanded && "rotate-90"
          )}
        />
        <span className="truncate">{label}</span>
        <span className="ml-1 rounded-full bg-muted px-1.5 py-0.5 text-[11px] font-normal text-muted-foreground">
          {tasks.length}
        </span>
      </button>

      {/* Task List */}
      {isExpanded && (
        <div
          className={cn(
            "ml-3 mt-0.5 border-l border-border/50 pl-2 pr-2 pb-2",
            isOver && "border-primary/50"
          )}
        >
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
