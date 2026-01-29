import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  actualMins?: number | null;
  plannedMins?: number | null;
}

interface SortableSubtaskItemProps {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
  showTimeColumns?: boolean;
}

// Helper to format time display (e.g., "0:10" for 10 minutes)
function formatTimeColumn(mins: number | null | undefined): string {
  if (!mins) return "--:--";
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Sortable subtask item with drag handle for use in task modals.
 * Uses @dnd-kit/sortable for drag-and-drop reordering.
 * Supports Sunsama-style time columns when showTimeColumns is true.
 */
export function SortableSubtaskItem({
  subtask,
  onToggle,
  onDelete,
  showTimeColumns = false,
}: SortableSubtaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: subtask.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors",
        isDragging && "opacity-50 bg-muted/30"
      )}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Checkbox - circular style for Sunsama look */}
      <button
        onClick={onToggle}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
          subtask.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {subtask.completed && (
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        )}
      </button>

      {/* Title */}
      <span
        className={cn(
          "flex-1 text-sm",
          subtask.completed && "line-through text-muted-foreground"
        )}
      >
        {subtask.title}
      </span>

      {/* Delete button - shows on hover */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={onDelete}
      >
        <X className="h-3 w-3" />
      </Button>

      {/* Time columns for Sunsama-style layout */}
      {showTimeColumns && (
        <div className="flex gap-4 text-center shrink-0">
          <div className="w-14 text-sm font-mono text-muted-foreground">
            {formatTimeColumn(subtask.actualMins)}
          </div>
          <div className="w-14 text-sm font-mono text-muted-foreground">
            {formatTimeColumn(subtask.plannedMins)}
          </div>
        </div>
      )}
    </div>
  );
}
