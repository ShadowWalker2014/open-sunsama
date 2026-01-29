import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Clock } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { cn, formatDuration } from "@/lib/utils";
import { useCompleteTask } from "@/hooks/useTasks";
import { PriorityDot } from "@/components/ui/priority-badge";
import { TaskContextMenu } from "./task-context-menu";

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  isDragging?: boolean;
}

/**
 * Sortable task card for drag-and-drop reordering within columns.
 * Uses @dnd-kit/sortable for smooth animations.
 */
export function SortableTaskCard({ task, onSelect, isDragging: externalDragging }: TaskCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const completeTask = useCompleteTask();
  const isCompleted = !!task.completedAt;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isCurrentlyDragging || externalDragging;

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeTask.mutateAsync({
      id: task.id,
      completed: !isCompleted,
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!dragging) {
      e.stopPropagation();
      onSelect(task);
    }
  };

  // Only show high priority indicators (P0, P1) to keep it minimal
  const showPriority = task.priority === "P0" || task.priority === "P1";

  return (
    <TaskContextMenu task={task} onEdit={() => onSelect(task)}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
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
          // Dragging state
          isCurrentlyDragging && "opacity-30 z-50",
          // DragOverlay state (elevated)
          externalDragging && "shadow-xl ring-2 ring-primary/20 rotate-[0.5deg] cursor-grabbing bg-card",
          // Completed state
          isCompleted && "opacity-50"
        )}
        onClick={handleClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
          onClick={handleToggleComplete}
          role="checkbox"
          aria-checked={isCompleted}
        >
          {isCompleted && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
        </div>

        {/* Content */}
        <div className="min-w-0 flex-1 space-y-1">
          {/* Title row with priority */}
          <div className="flex items-start gap-2">
            <p
              className={cn(
                "flex-1 text-sm font-medium leading-snug text-foreground",
                isCompleted && "line-through text-muted-foreground"
              )}
            >
              {task.title}
            </p>
            {/* Priority dot - only show for P0/P1 */}
            {showPriority && !isCompleted && (
              <PriorityDot priority={task.priority} size="sm" className="mt-1.5 shrink-0" />
            )}
          </div>

          {/* Meta info */}
          <div className="flex items-center gap-2">
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
    </TaskContextMenu>
  );
}

/**
 * Legacy TaskCard - used for DragOverlay display
 * Linear-style task card with hover-reveal checkbox.
 * Clean, minimal design with subtle interactions.
 */
export function TaskCard({ task, onSelect, isDragging: externalDragging }: TaskCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const completeTask = useCompleteTask();
  const isCompleted = !!task.completedAt;

  const dragging = externalDragging || false;

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeTask.mutateAsync({
      id: task.id,
      completed: !isCompleted,
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!dragging) {
      e.stopPropagation();
      onSelect(task);
    }
  };

  // Only show high priority indicators (P0, P1) to keep it minimal
  const showPriority = task.priority === "P0" || task.priority === "P1";

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
        externalDragging && "shadow-xl ring-2 ring-primary/20 rotate-[0.5deg] cursor-grabbing bg-card",
        // Completed state
        isCompleted && "opacity-50"
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
        onClick={handleToggleComplete}
        role="checkbox"
        aria-checked={isCompleted}
      >
        {isCompleted && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 space-y-1">
        {/* Title row with priority */}
        <div className="flex items-start gap-2">
          <p
            className={cn(
              "flex-1 text-sm font-medium leading-snug text-foreground",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
          {/* Priority dot - only show for P0/P1 */}
          {showPriority && !isCompleted && (
            <PriorityDot priority={task.priority} size="sm" className="mt-1.5 shrink-0" />
          )}
        </div>

        {/* Meta info */}
        <div className="flex items-center gap-2">
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

/**
 * Placeholder card shown when dragging into empty column
 */
export function TaskCardPlaceholder() {
  return (
    <div className="rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-3 py-2.5">
      <div className="h-4 w-2/3 rounded bg-primary/10" />
    </div>
  );
}
