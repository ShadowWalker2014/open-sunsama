import * as React from "react";
import { CheckSquare } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";

interface TaskItemProps {
  task: Task;
  isSelected: boolean;
  onClick: () => void;
}

export function TaskItem({ task, isSelected, onClick }: TaskItemProps) {
  const isCompleted = !!task.completedAt;

  return (
    <button
      data-selected={isSelected}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-3 h-[40px] w-full text-left transition-colors cursor-pointer",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <CheckSquare
        className={cn(
          "h-4 w-4 shrink-0",
          isCompleted ? "text-green-500" : "text-muted-foreground"
        )}
      />
      <span
        className={cn(
          "text-[13px] flex-1 truncate",
          isCompleted && "line-through text-muted-foreground"
        )}
      >
        {task.title}
      </span>
    </button>
  );
}
