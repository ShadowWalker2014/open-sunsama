import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { useCompleteTask } from "@/hooks/useTasks";
import { useSubtasks, useUpdateSubtask } from "@/hooks/useSubtasks";
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

  // Fetch subtasks for this task
  const { data: subtasks } = useSubtasks(task.id);
  const updateSubtask = useUpdateSubtask();

  const handleToggleSubtask = async (subtaskId: string) => {
    const subtask = subtasks?.find(s => s.id === subtaskId);
    if (subtask) {
      await updateSubtask.mutateAsync({
        taskId: task.id,
        subtaskId,
        data: { completed: !subtask.completed },
      });
    }
  };

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isCurrentlyDragging,
    isOver,
    active,
    index,
  } = useSortable({
    id: task.id,
    data: { type: "task", task },
  });

  // Determine if we should show a drop indicator
  // isOver is true when this item is being hovered by the dragged item
  const showIndicator = isOver && active?.id !== task.id;
  
  // Determine indicator position based on where the item will be inserted
  // If dragging from above (higher index) to current position -> show indicator above
  // If dragging from below (lower index) to current position -> show indicator below
  const activeIndex = active?.data?.current?.sortable?.index ?? -1;
  const showDropIndicatorAbove = showIndicator && activeIndex > index;
  const showDropIndicatorBelow = showIndicator && activeIndex < index && activeIndex !== -1;

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
          <div className="absolute -top-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10 shadow-[0_0_4px_rgba(var(--primary),0.5)]" />
        )}
        
        <TaskCardContent
          task={task}
          isCompleted={isCompleted}
          isHovered={isHovered}
          isDragging={externalDragging}
          onToggleComplete={handleToggleComplete}
          onClick={handleClick}
          onHoverChange={setIsHovered}
          subtasks={subtasks}
          onToggleSubtask={handleToggleSubtask}
        />
        
        {/* Drop indicator line - below */}
        {showDropIndicatorBelow && (
          <div className="absolute -bottom-1 left-0 right-0 h-0.5 bg-primary rounded-full z-10 shadow-[0_0_4px_rgba(var(--primary),0.5)]" />
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

  // Fetch subtasks for this task
  const { data: subtasks } = useSubtasks(task.id);
  const updateSubtask = useUpdateSubtask();

  const handleToggleSubtask = async (subtaskId: string) => {
    const subtask = subtasks?.find(s => s.id === subtaskId);
    if (subtask) {
      await updateSubtask.mutateAsync({
        taskId: task.id,
        subtaskId,
        data: { completed: !subtask.completed },
      });
    }
  };

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
      subtasks={subtasks}
      onToggleSubtask={handleToggleSubtask}
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
