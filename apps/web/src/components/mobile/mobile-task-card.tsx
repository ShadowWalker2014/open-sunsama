import * as React from "react";
import { Check } from "lucide-react";
import type { Task } from "@open-sunsama/types";
import { cn, formatDuration } from "@/lib/utils";
import { useCompleteTask } from "@/hooks/useTasks";
import { useSubtasks } from "@/hooks/useSubtasks";
import { useTaskTimerDisplay } from "@/components/kanban/task-time-badge";

interface MobileTaskCardProps {
  task: Task;
  onTaskClick: (task: Task) => void;
}

/**
 * Format relative date for display (e.g., "3 days ago", "Today", "Yesterday")
 */
function formatRelativeDate(date: Date | string | null): string | null {
  if (!date) return null;
  
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffTime = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// ============================================================================
// Shared Base Component
// ============================================================================

interface MobileTaskCardBaseProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  /** Render prop for the time display section */
  renderTimeDisplay: (props: {
    isCompleted: boolean;
    estimatedMins: number | null | undefined;
  }) => React.ReactNode;
}

/**
 * Base mobile task card component with shared layout and behavior.
 * Uses a render prop for the time display to support different variants.
 */
function MobileTaskCardBase({ 
  task, 
  onTaskClick,
  renderTimeDisplay,
}: MobileTaskCardBaseProps) {
  const completeTask = useCompleteTask();
  const { data: subtasks } = useSubtasks(task.id);
  
  const isCompleted = !!task.completedAt;
  const subtaskCount = subtasks?.length ?? 0;
  const completedSubtaskCount = subtasks?.filter((s) => s.completed).length ?? 0;
  
  // Build metadata items
  const metadataItems: string[] = [];
  
  // Subtask count
  if (subtaskCount > 0) {
    metadataItems.push(`${completedSubtaskCount}/${subtaskCount} subtasks`);
  }
  
  // Relative date from last update
  const relativeDate = formatRelativeDate(task.updatedAt);
  if (relativeDate && relativeDate !== "Today") {
    metadataItems.push(relativeDate);
  }
  
  const handleToggleComplete = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    completeTask.mutate({ id: task.id, completed: !isCompleted });
  };
  
  const handleCardClick = () => {
    onTaskClick(task);
  };
  
  return (
    <div
      className={cn(
        "flex items-start gap-3 px-4 py-3 min-h-[48px]",
        "border-b border-border/30",
        "active:bg-muted/50 transition-colors",
        "cursor-pointer select-none touch-manipulation"
      )}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      {/* Large circular checkbox - 20px with 44px touch target */}
      <div
        className="shrink-0 flex items-center justify-center w-11 h-11 -ml-2 -my-1"
        onClick={handleToggleComplete}
        onTouchEnd={(e) => {
          e.preventDefault();
          handleToggleComplete(e);
        }}
        role="checkbox"
        aria-checked={isCompleted}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleToggleComplete(e as unknown as React.MouseEvent);
          }
        }}
      >
        <div
          className={cn(
            "flex items-center justify-center w-5 h-5 rounded-full border-2 transition-all",
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/40"
          )}
        >
          {isCompleted && <Check className="h-3 w-3" strokeWidth={3} />}
        </div>
      </div>
      
      {/* Content area */}
      <div className="flex-1 min-w-0 py-0.5">
        {/* Task title - max 2 lines with truncation */}
        <p
          className={cn(
            "text-[15px] leading-snug line-clamp-2 break-words",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {task.title}
        </p>
        
        {/* Metadata row */}
        {metadataItems.length > 0 && (
          <div className="flex items-center gap-1.5 mt-1">
            <p className="text-xs text-muted-foreground truncate">
              {metadataItems.join(" • ")}
            </p>
          </div>
        )}
      </div>
      
      {/* Time display - delegated to render prop */}
      {renderTimeDisplay({ isCompleted, estimatedMins: task.estimatedMins })}
    </div>
  );
}

// ============================================================================
// Public Components
// ============================================================================

/**
 * Mobile-optimized task card component matching Sunsama mobile design.
 * Features large touch targets, circular checkbox, and metadata row.
 */
export function MobileTaskCard({ task, onTaskClick }: MobileTaskCardProps) {
  return (
    <MobileTaskCardBase
      task={task}
      onTaskClick={onTaskClick}
      renderTimeDisplay={({ isCompleted, estimatedMins }) => {
        if (estimatedMins == null || estimatedMins <= 0) return null;
        
        return (
          <div
            className={cn(
              "shrink-0 text-xs tabular-nums text-muted-foreground",
              isCompleted && "opacity-50"
            )}
          >
            {formatDuration(estimatedMins)}
          </div>
        );
      }}
    />
  );
}

interface MobileTaskCardWithActualTimeProps extends MobileTaskCardProps {
  /** Actual time spent (for display like "0:01 / 0:30") */
  actualMins?: number | null;
}

/**
 * Mobile task card variant that shows actual time spent alongside estimate.
 * Used in the main task list when tasks have been worked on.
 */
export function MobileTaskCardWithActualTime({ 
  task, 
  onTaskClick,
}: MobileTaskCardWithActualTimeProps) {
  const { isTimerRunning, displayText } = useTaskTimerDisplay(task);

  return (
    <MobileTaskCardBase
      task={task}
      onTaskClick={onTaskClick}
      renderTimeDisplay={({ isCompleted }) => {
        if (!displayText) return null;
        
        return (
          <div
            className={cn(
              "shrink-0 flex items-center gap-1 text-xs tabular-nums whitespace-nowrap",
              isTimerRunning
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-muted-foreground",
              isCompleted && "opacity-50"
            )}
          >
            {isTimerRunning && (
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
              </span>
            )}
            {displayText}
          </div>
        );
      }}
    />
  );
}
