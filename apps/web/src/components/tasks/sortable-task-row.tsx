import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { TaskRow } from "./task-row";

export interface SortableTaskRowProps {
  task: Task;
  /** Stable index from the parent's map — not affected by dnd-kit's internal sorting */
  originalIndex: number;
  onSelect: () => void;
  onComplete: () => void;
}

/**
 * Sortable wrapper for TaskRow that enables drag-and-drop reordering.
 * Items stay in place during drag — the indicator line alone shows the insertion point.
 */
export function SortableTaskRow({
  task,
  originalIndex,
  onSelect,
  onComplete,
}: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    isDragging,
    isOver,
    active,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
      columnId: task.scheduledDate || "backlog",
      originalIndex,
    },
  });

  const style: React.CSSProperties = {
    // Don't apply transforms to non-dragging items — items stay in place
    // so the indicator line renders at the correct visual position
    opacity: isDragging ? 0.4 : 1,
  };

  // Determine indicator placement using stable original indices
  const showIndicator = isOver && active?.id !== task.id;
  const activeColumn = active?.data?.current?.columnId;
  const currentColumn = task.scheduledDate || "backlog";
  const isCrossColumnDrag = activeColumn !== currentColumn;

  let showDropIndicatorAbove = false;
  let showDropIndicatorBelow = false;

  if (showIndicator) {
    if (isCrossColumnDrag) {
      // Cross-group: always insert before the target (matches handleDragEnd logic)
      showDropIndicatorAbove = true;
    } else {
      // Same group: use original indices for stable direction comparison
      const activeOriginalIndex = active?.data?.current?.originalIndex ?? -1;
      if (activeOriginalIndex !== -1) {
        // Dragging up → show above (insert before target)
        // Dragging down → show below (insert after target)
        showDropIndicatorAbove = activeOriginalIndex > originalIndex;
        showDropIndicatorBelow = activeOriginalIndex < originalIndex;
      }
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn("relative", isDragging && "z-50")}
    >
      {showDropIndicatorAbove && (
        <div className="absolute -top-0.5 left-0 right-0 h-0.5 rounded-full bg-primary z-10 shadow-[0_0_4px_rgba(var(--primary),0.5)]" />
      )}
      <TaskRow
        task={task}
        onSelect={onSelect}
        onComplete={onComplete}
      />
      {showDropIndicatorBelow && (
        <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 rounded-full bg-primary z-10 shadow-[0_0_4px_rgba(var(--primary),0.5)]" />
      )}
    </div>
  );
}
