import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { TaskRow } from "./task-row";

export interface SortableTaskRowProps {
  task: Task;
  onSelect: () => void;
  onComplete: () => void;
}

/**
 * Sortable wrapper for TaskRow that enables drag-and-drop reordering.
 * The entire row is draggable with distance-based activation (8px).
 */
export function SortableTaskRow({
  task,
  onSelect,
  onComplete,
}: SortableTaskRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
    active,
    index,
  } = useSortable({
    id: task.id,
    data: {
      type: "task",
      task,
      columnId: task.scheduledDate || "backlog",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  // Match board-view indicator behavior for same-group and cross-group drops.
  const showIndicator = isOver && active?.id !== task.id;
  const activeColumn = active?.data?.current?.columnId;
  const currentColumn = task.scheduledDate || "backlog";
  const isCrossColumnDrag = activeColumn !== currentColumn;

  let showDropIndicatorAbove = false;
  let showDropIndicatorBelow = false;

  if (showIndicator) {
    if (isCrossColumnDrag) {
      showDropIndicatorAbove = true;
    } else {
      const activeIndex = active?.data?.current?.sortable?.index ?? -1;
      showDropIndicatorAbove = activeIndex > index;
      showDropIndicatorBelow = activeIndex < index && activeIndex !== -1;
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
