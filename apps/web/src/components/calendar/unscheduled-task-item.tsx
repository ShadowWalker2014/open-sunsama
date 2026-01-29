import * as React from "react";
import { Clock, GripVertical } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { formatDuration } from "@/lib/utils";
import { Badge } from "@/components/ui";

interface UnscheduledTaskItemProps {
  task: Task;
  onDragStart?: (e: React.MouseEvent) => void;
  onClick?: () => void;
  isMobile?: boolean;
}

/**
 * Individual unscheduled task item
 */
export function UnscheduledTaskItem({
  task,
  onDragStart,
  onClick,
  isMobile = false,
}: UnscheduledTaskItemProps) {
  const [isDragging, setIsDragging] = React.useState(false);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    onDragStart?.(e);

    // Add global mouse up listener to reset dragging state
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener("mouseup", handleMouseUp);
    };
    document.addEventListener("mouseup", handleMouseUp);
  };

  // Touch handlers for mobile
  const handleTouchStart = (_e: React.TouchEvent) => {
    // Let the user scroll without triggering drag
    // Drag is initiated by holding
  };

  return (
    <div
      className={cn(
        "group relative rounded-lg border bg-card transition-all",
        // Larger padding on mobile for touch targets
        isMobile ? "p-4 min-h-[60px]" : "p-3",
        "hover:shadow-md hover:border-primary/30",
        "active:bg-accent/30", // Touch feedback
        isDragging && "opacity-50 cursor-grabbing shadow-lg",
        !isDragging && "cursor-grab"
      )}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Task: ${task.title}`}
    >
      {/* Drag handle indicator - always visible on mobile */}
      <div
        className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 transition-opacity",
          isMobile ? "opacity-40" : "opacity-0 group-hover:opacity-40"
        )}
      >
        <GripVertical className={cn(isMobile ? "h-5 w-5" : "h-4 w-4", "text-muted-foreground")} />
      </div>

      {/* Content */}
      <div className={cn(isMobile ? "pl-5" : "pl-4")}>
        {/* Title */}
        <p className={cn(
          "font-medium truncate pr-2",
          isMobile ? "text-base" : "text-sm"
        )}>
          {task.title}
        </p>

        {/* Estimated duration */}
        {task.estimatedMins && (
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{formatDuration(task.estimatedMins)}</span>
          </div>
        )}

        {/* Notes preview */}
        {task.notes && (
          <p className="mt-1.5 text-xs text-muted-foreground truncate">
            {task.notes}
          </p>
        )}
      </div>

      {/* Visual indicator that this can be dragged - hidden on mobile */}
      {!isMobile && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            Drag to schedule
          </Badge>
        </div>
      )}
    </div>
  );
}

/**
 * Loading skeleton for task items
 */
export function TaskItemSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-3">
      <div className="h-4 w-3/4 mb-2 bg-muted animate-pulse rounded" />
      <div className="h-3 w-1/4 bg-muted animate-pulse rounded" />
    </div>
  );
}
