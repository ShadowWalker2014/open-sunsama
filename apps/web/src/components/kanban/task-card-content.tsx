import * as React from "react";
import { Check, Circle } from "lucide-react";
import type { Task, Subtask } from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";
import { useHoveredTask } from "@/hooks/useKeyboardShortcuts";

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
  /** Optional subtasks to display inline */
  subtasks?: Subtask[];
}

/**
 * Shared content component for task cards.
 * Sunsama-inspired design with circle checkbox, duration badge, and tag support.
 */
export function TaskCardContent({
  task,
  isCompleted,
  isHovered: _isHovered,
  isDragging,
  onToggleComplete,
  onClick,
  onHoverChange,
  className,
  scheduledTime,
  tag,
  tagColor,
  subtasks,
}: TaskCardContentProps) {
  const { setHoveredTask } = useHoveredTask();

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

  // Get first 3 subtasks for preview
  const subtasksPreview = subtasks?.slice(0, 3);
  const hasMoreSubtasks = subtasks && subtasks.length > 3;

  return (
    <div
      className={cn(
        // Base styles - Sunsama-inspired card
        "group relative flex flex-col gap-1.5 rounded-lg px-3 py-2.5 transition-all duration-200",
        // Background and border
        "bg-card hover:bg-card/80",
        "border border-border/40 hover:border-border/60",
        // Cursor
        "cursor-grab active:cursor-grabbing",
        // Touch support
        "touch-none select-none",
        // DragOverlay state (elevated)
        isDragging && "shadow-xl ring-2 ring-primary/20 rotate-[0.5deg] cursor-grabbing",
        // Completed state - muted styling with smooth transition
        isCompleted && "opacity-50 hover:opacity-60 bg-card/50",
        className
      )}
      onClick={onClick}
      onMouseEnter={() => {
        onHoverChange(true);
        setHoveredTask(task);
      }}
      onMouseLeave={() => {
        onHoverChange(false);
        setHoveredTask(null);
      }}
    >
      {/* Time row (if scheduled) - above checkbox/title like Sunsama */}
      {formattedTime && !isCompleted && (
        <span className="text-[11px] text-muted-foreground">
          {formattedTime}
        </span>
      )}

      {/* Main row: Checkbox, Title, Duration */}
      <div className="flex items-start gap-2.5">
        {/* Circle Checkbox */}
        <div
          className={cn(
            "relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-150",
            "cursor-pointer",
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
          )}
          onClick={onToggleComplete}
          role="checkbox"
          aria-checked={isCompleted}
        >
          {isCompleted && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
        </div>

        {/* Title */}
        <p
          className={cn(
            "min-w-0 flex-1 text-sm leading-snug text-foreground",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>

        {/* Duration badge - right aligned with background pill */}
        {task.estimatedMins != null && task.estimatedMins > 0 && (
          <span
            className={cn(
              "shrink-0 rounded px-1.5 py-0.5 text-[11px] tabular-nums",
              "bg-muted/50 text-muted-foreground",
              isCompleted && "opacity-50"
            )}
          >
            {formatDuration(task.estimatedMins)}
          </span>
        )}
      </div>

      {/* Subtasks preview - inline with small checkboxes */}
      {subtasksPreview && subtasksPreview.length > 0 && !isCompleted && (
        <div className="pl-6 space-y-0.5">
          {subtasksPreview.map((subtask) => (
            <div key={subtask.id} className="flex items-center gap-1.5">
              {subtask.completed ? (
                <div className="h-3 w-3 rounded-full bg-primary/60 flex items-center justify-center">
                  <Check className="h-2 w-2 text-primary-foreground" strokeWidth={3} />
                </div>
              ) : (
                <Circle className="h-3 w-3 text-muted-foreground/40" strokeWidth={1.5} />
              )}
              <span
                className={cn(
                  "text-xs text-muted-foreground truncate",
                  subtask.completed && "line-through opacity-60"
                )}
              >
                {subtask.title}
              </span>
            </div>
          ))}
          {hasMoreSubtasks && (
            <span className="text-[10px] text-muted-foreground/50 pl-4">
              +{subtasks!.length - 3} more
            </span>
          )}
        </div>
      )}

      {/* Bottom row: Tag/Project (right-aligned) */}
      {tag && !isCompleted && (
        <div className="flex justify-end">
          <span
            className="text-[11px] px-1.5 py-0.5 rounded"
            style={{ 
              color: tagColor || 'hsl(var(--muted-foreground))',
              backgroundColor: tagColor ? `${tagColor}15` : 'transparent'
            }}
          >
            # {tag}
          </span>
        </div>
      )}
    </div>
  );
}
