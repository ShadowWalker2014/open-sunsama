import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@open-sunsama/types";
import { MobileTaskCardWithActualTime } from "./mobile-task-card";
import { cn } from "@/lib/utils";

interface SortableMobileTaskCardProps {
  task: Task;
  onTaskClick: (task: Task) => void;
}

export function SortableMobileTaskCard({ task, onTaskClick }: SortableMobileTaskCardProps) {
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
      source: "mobile-list",
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "touch-manipulation",
        isDragging && "opacity-50 z-50"
      )}
    >
      <MobileTaskCardWithActualTime
        task={task}
        onTaskClick={onTaskClick}
        actualMins={task.actualMins}
      />
    </div>
  );
}
