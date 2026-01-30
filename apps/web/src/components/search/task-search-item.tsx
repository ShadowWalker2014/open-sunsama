import * as React from "react";
import { Check, Clock, Calendar, ChevronRight } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import type { Task } from "@open-sunsama/types";
import { cn, formatDuration, stripHtmlTags } from "@/lib/utils";

export interface TaskSearchItemProps {
  task: Task;
  isSelected: boolean;
  isCompleted: boolean;
  onClick: () => void;
  onComplete: (e: React.MouseEvent) => void;
}

export function TaskSearchItem({ task, isSelected, isCompleted, onClick, onComplete }: TaskSearchItemProps) {
  const scheduleText = React.useMemo(() => {
    if (!task.scheduledDate) return "Backlog";
    const date = new Date(task.scheduledDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    if (isPast(date)) return format(date, "MMM d") + " (overdue)";
    return format(date, "MMM d");
  }, [task.scheduledDate]);

  const priorityColor = {
    P0: "text-red-500",
    P1: "text-orange-500",
    P2: "text-blue-500",
    P3: "text-gray-400",
  }[task.priority];

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
        isSelected ? "bg-accent" : "hover:bg-accent/50",
        isCompleted && "opacity-60"
      )}
    >
      {/* Checkbox */}
      <button
        onClick={onComplete}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors cursor-pointer",
          isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/50 hover:border-primary hover:bg-primary/10"
        )}
      >
        {isCompleted && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium truncate", isCompleted && "line-through")}>
            {task.title}
          </span>
          <span className={cn("text-xs font-medium", priorityColor)}>
            {task.priority}
          </span>
        </div>
        {task.notes && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {stripHtmlTags(task.notes)}
          </p>
        )}
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        {task.estimatedMins && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {formatDuration(task.estimatedMins)}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar className="h-3 w-3" />
          {scheduleText}
        </span>
        <ChevronRight className="h-4 w-4 opacity-50" />
      </div>
    </div>
  );
}
