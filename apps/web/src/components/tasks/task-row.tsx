import * as React from "react";
import { Check, MoreHorizontal, Trash2, CalendarPlus } from "lucide-react";
import { format, isToday, isTomorrow, isPast } from "date-fns";
import type { Task, TaskPriority } from "@open-sunsama/types";
import { cn, formatDuration, stripHtmlTags } from "@/lib/utils";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  PRIORITY_LABELS,
} from "@/components/ui";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  P0: "text-red-500 bg-red-500/10",
  P1: "text-orange-500 bg-orange-500/10",
  P2: "text-blue-500 bg-blue-500/10",
  P3: "text-gray-500 bg-gray-500/10",
};

export interface TaskRowProps {
  task: Task;
  style: React.CSSProperties;
  onSelect: () => void;
  onComplete: () => void;
  onDelete: () => void;
  onMoveToToday: () => void;
}

export function TaskRow({ task, style, onSelect, onComplete, onDelete, onMoveToToday }: TaskRowProps) {
  const isCompleted = !!task.completedAt;

  const scheduleText = React.useMemo(() => {
    if (!task.scheduledDate) return "Backlog";
    const date = new Date(task.scheduledDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  }, [task.scheduledDate]);

  const isOverdue = task.scheduledDate && !isCompleted && isPast(new Date(task.scheduledDate + "T23:59:59"));

  return (
    <div
      style={style}
      className={cn(
        "flex items-center gap-4 px-6 py-2 border-b hover:bg-accent/50 cursor-pointer transition-colors",
        isCompleted && "opacity-60"
      )}
      onClick={onSelect}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onComplete(); }}
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-colors cursor-pointer",
          isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/50 hover:border-primary hover:bg-primary/10"
        )}
      >
        {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium truncate", isCompleted && "line-through")}>
          {task.title}
        </p>
        {task.notes && (
          <p className="text-xs text-muted-foreground truncate">
            {stripHtmlTags(task.notes)}
          </p>
        )}
      </div>

      {/* Priority */}
      <span className={cn("w-16 text-xs font-medium px-2 py-0.5 rounded", PRIORITY_COLORS[task.priority])}>
        {PRIORITY_LABELS[task.priority]}
      </span>

      {/* Date */}
      <span className={cn("w-24 text-xs", isOverdue && "text-red-500")}>
        {scheduleText}
      </span>

      {/* Duration */}
      <span className="w-16 text-xs text-muted-foreground">
        {task.estimatedMins ? formatDuration(task.estimatedMins) : "-"}
      </span>

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onMoveToToday(); }}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Move to Today
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
