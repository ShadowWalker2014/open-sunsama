import * as React from "react";
import { Check } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { cn, formatDuration } from "@/lib/utils";

interface TaskCardContentProps {
  task: Task;
  isCompleted: boolean;
  isHovered: boolean;
  isDragging?: boolean;
  onToggleComplete: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onHoverChange: (hovered: boolean) => void;
  className?: string;
  /** Optional scheduled time to display (Date object or ISO string) */
  scheduledTime?: Date | string | null;
  /** Optional tag/project name to display */
  tag?: string | null;
  /** Optional tag color (hex or CSS color) */
  tagColor?: string | null;
}

/**
 * Shared content component for task cards.
 * Sunsama-inspired design with circle checkbox, duration badge, and tag support.
 */
export function TaskCardContent({
  task,
  isCompleted,
  isHovered,
  isDragging,
  onToggleComplete,
  onClick,
  onHoverChange,
  className,
  scheduledTime,
  tag,
  tagColor,
}: TaskCardContentProps) {
  // Format scheduled time to "2:50 pm" format
  const formattedTime = React.useMemo(() => {
    if (!scheduledTime) return null;
    const date = typeof scheduledTime === "string" ? new Date(scheduledTime) : scheduledTime;
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).toLowerCase();
  }, [scheduledTime]);

  return (
    <div
      className={cn(
        // Base styles - Sunsama-inspired card
        "group relative flex flex-col gap-1 rounded-lg px-3 py-2.5 transition-all duration-150",
        // Background and border
        "bg-card/50 hover:bg-card",
        "border border-border/30 hover:border-border/50",
        // Cursor
        "cursor-grab active:cursor-grabbing",
        // Touch support
        "touch-none select-none",
        // DragOverlay state (elevated)
        isDragging && "shadow-xl ring-2 ring-primary/20 rotate-[0.5deg] cursor-grabbing bg-card",
        // Completed state
        isCompleted && "opacity-50",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {/* Top row: Checkbox, Time/Title, Duration */}
      <div className="flex items-start gap-2.5">
        {/* Circle Checkbox */}
        <div
          className={cn(
            "relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-150",
            // Always visible circle outline
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/50 hover:border-primary hover:bg-primary/10"
          )}
          onClick={onToggleComplete}
          role="checkbox"
          aria-checked={isCompleted}
        >
          {isCompleted && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
        </div>

        {/* Content area */}
        <div className="min-w-0 flex-1">
          {/* Time (if scheduled) */}
          {formattedTime && !isCompleted && (
            <span className="text-xs text-muted-foreground mb-0.5 block">
              {formattedTime}
            </span>
          )}
          {/* Title */}
          <p
            className={cn(
              "text-sm font-medium leading-snug text-foreground",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
        </div>

        {/* Duration badge - right aligned */}
        {task.estimatedMins != null && task.estimatedMins > 0 && (
          <span
            className={cn(
              "shrink-0 text-xs text-muted-foreground/70 tabular-nums",
              isCompleted && "opacity-50"
            )}
          >
            {formatDuration(task.estimatedMins)}
          </span>
        )}
      </div>

      {/* Bottom row: Tag/Project (right-aligned) */}
      {tag && !isCompleted && (
        <div className="flex justify-end pl-6">
          <span
            className="text-xs"
            style={{ color: tagColor || "inherit" }}
          >
            # {tag}
          </span>
        </div>
      )}
    </div>
  );
}
