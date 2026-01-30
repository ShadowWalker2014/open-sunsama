import * as React from "react";
import { Check, Calendar } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { PRIORITY_LABELS } from "@/components/ui/priority-badge";

export interface TaskSearchItemProps {
  task: Task;
  isSelected: boolean;
  isCompleted: boolean;
  onClick: () => void;
  onComplete: (e: React.MouseEvent) => void;
}

const priorityColors: Record<string, string> = {
  P0: "bg-red-500/15 text-red-600 dark:text-red-400",
  P1: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
  P2: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
  P3: "bg-gray-500/10 text-gray-500",
};

export function TaskSearchItem({ task, isSelected, isCompleted, onClick, onComplete }: TaskSearchItemProps) {
  const scheduleText = React.useMemo(() => {
    if (!task.scheduledDate) return null;
    const date = new Date(task.scheduledDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return format(date, "MMM d");
    return format(date, "MMM d");
  }, [task.scheduledDate]);

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3 h-[44px] cursor-pointer transition-colors",
        isSelected ? "bg-accent" : "hover:bg-accent/50",
        isCompleted && "opacity-50"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={onComplete}
        className={cn(
          "flex h-[14px] w-[14px] shrink-0 items-center justify-center rounded-[4px] border transition-colors",
          isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 hover:border-muted-foreground/50"
        )}
      >
        {isCompleted && <Check className="h-2.5 w-2.5" strokeWidth={2.5} />}
      </button>

      {/* Priority badge */}
      <span className={cn(
        "text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0",
        priorityColors[task.priority]
      )}>
        {PRIORITY_LABELS[task.priority]}
      </span>

      {/* Title */}
      <span className={cn(
        "text-[13px] truncate flex-1",
        isCompleted && "line-through text-muted-foreground"
      )}>
        {task.title}
      </span>

      {/* Schedule date */}
      {scheduleText && (
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground shrink-0">
          <Calendar className="h-3 w-3" />
          {scheduleText}
        </span>
      )}
    </div>
  );
}
