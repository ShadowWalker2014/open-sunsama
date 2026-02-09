import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@open-sunsama/types";
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

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskRow
        task={task}
        onSelect={onSelect}
        onComplete={onComplete}
      />
    </div>
  );
}
