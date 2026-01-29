import * as React from "react";
import { Check, Clock } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { cn, formatDuration } from "@/lib/utils";
import { PriorityTag } from "@/components/ui/priority-badge";

interface TaskCardContentProps {
  task: Task;
  isCompleted: boolean;
  isHovered: boolean;
  isDragging?: boolean;
  onToggleComplete: (e: React.MouseEvent) => void;
  onClick: (e: React.MouseEvent) => void;
  onHoverChange: (hovered: boolean) => void;
  className?: string;
}

/**
 * Shared content component for task cards.
 * Used by both SortableTaskCard and TaskCard to eliminate duplication.
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
}: TaskCardContentProps) {
  return (
    <div
      className={cn(
        // Base styles - Linear-inspired minimal card
        "group relative flex items-start gap-3 rounded-lg px-3 py-2.5 transition-all duration-150",
        // Background and border
        "bg-card/50 hover:bg-card",
        "border border-transparent hover:border-border/50",
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
      {/* Checkbox - appears on hover */}
      <div
        className={cn(
          "relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-all duration-150",
          // Show/hide based on hover or completion
          isCompleted || isHovered ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          // Colors
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

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Title */}
        <p
          className={cn(
            "text-sm font-medium leading-snug text-foreground",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>

        {/* Meta info row with priority tag and estimated time */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Priority tag - only shows for P0/P1, hidden for P2/P3 */}
          {!isCompleted && (
            <PriorityTag priority={task.priority} />
          )}
          {/* Estimated time */}
          {task.estimatedMins && !isCompleted && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              {formatDuration(task.estimatedMins)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
