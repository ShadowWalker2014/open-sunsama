import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@chronoflow/types";
import { cn } from "@/lib/utils";
import { useCompleteTask } from "@/hooks/useTasks";
import { TaskContextMenu } from "./task-context-menu";
import { TaskCardContent } from "./task-card-content";

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
  
  const { active, over } = useDndContext();

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
    index,
    items,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  // Calculate if this item is the drop target
  const activeId = active?.id;
  const overId = over?.id;
  const isOver = overId === task.id && activeId !== task.id;
  
  // Get the active item's index to determine drop indicator position
  const activeIndex = activeId ? items.indexOf(String(activeId)) : -1;
  const currentIndex = index;
  
  // Show drop indicator based on relative positions
  const showDropIndicatorAbove = isOver && activeIndex > currentIndex;
  const showDropIndicatorBelow = isOver && activeIndex < currentIndex && activeIndex !== -1;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dragging = isCurrentlyDragging || externalDragging;

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeTask.mutateAsync({ id: task.id, completed: !isCompleted });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!dragging) {
      e.stopPropagation();
      onSelect(task);
    }
  };

  return (
    <TaskContextMenu task={task} onEdit={() => onSelect(task)}>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={cn(
          "relative",
          isCurrentlyDragging && "opacity-30 z-50"
        )}
      >
        {/* Drop indicator line - above */}
        {showDropIndicatorAbove && (
          <div className="absolute -top-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
        )}
        
        <TaskCardContent
          task={task}
          isCompleted={isCompleted}
          isHovered={isHovered}
          isDragging={externalDragging}
          onToggleComplete={handleToggleComplete}
          onClick={handleClick}
          onHoverChange={setIsHovered}
        />
        
        {/* Drop indicator line - below */}
        {showDropIndicatorBelow && (
          <div className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-primary rounded-full z-10" />
        )}
      </div>
    </TaskContextMenu>
  );
}

/**
 * Legacy TaskCard - used for DragOverlay display
 */
export function TaskCard({ task, onSelect, isDragging: externalDragging }: TaskCardProps) {
  const [isHovered, setIsHovered] = React.useState(false);
  const completeTask = useCompleteTask();
  const isCompleted = !!task.completedAt;

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeTask.mutateAsync({ id: task.id, completed: !isCompleted });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (!externalDragging) {
      e.stopPropagation();
      onSelect(task);
    }
  };

  return (
    <TaskCardContent
      task={task}
      isCompleted={isCompleted}
      isHovered={isHovered}
      isDragging={externalDragging}
      onToggleComplete={handleToggleComplete}
      onClick={handleClick}
      onHoverChange={setIsHovered}
    />
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
