import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Check, Clock, GripVertical } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { cn, formatDuration } from "@/lib/utils";
import { useCompleteTask, useUpdateTask } from "@/hooks/useTasks";
import { Badge, Input } from "@/components/ui";

interface TaskCardProps {
  task: Task;
  onSelect: (task: Task) => void;
  isDragging?: boolean;
}

/**
 * Draggable task card for the kanban board.
 * Supports inline title editing on double-click, completion toggle, and drag-and-drop.
 */
export function TaskCard({ task, onSelect, isDragging: externalDragging }: TaskCardProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState(task.title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const updateTask = useUpdateTask();
  const completeTask = useCompleteTask();
  const isCompleted = !!task.completedAt;

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
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditTitle(task.title);
  };

  const handleTitleSave = async () => {
    if (editTitle.trim() && editTitle !== task.title) {
      await updateTask.mutateAsync({
        id: task.id,
        data: { title: editTitle.trim() },
      });
    }
    setIsEditing(false);
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleTitleSave();
    } else if (e.key === "Escape") {
      setEditTitle(task.title);
      setIsEditing(false);
    }
  };

  const handleToggleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await completeTask.mutateAsync({
      id: task.id,
      completed: !isCompleted,
    });
  };

  const handleClick = () => {
    if (!isEditing) {
      onSelect(task);
    }
  };

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const dragging = isDragging || externalDragging;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative flex items-start gap-2 rounded-lg border bg-card p-3 transition-all",
        "hover:border-primary/50 hover:shadow-md",
        dragging && "opacity-50 shadow-lg ring-2 ring-primary",
        isCompleted && "opacity-60"
      )}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
    >
      {/* Drag Handle - Touch-friendly size (44px minimum) */}
      <button
        {...attributes}
        {...listeners}
        className={cn(
          "mt-0.5 cursor-grab touch-none transition-opacity",
          // Always visible on touch devices, hover reveal on desktop
          "opacity-40 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100",
          "active:cursor-grabbing active:opacity-100",
          // Touch-friendly tap target
          "-ml-1 p-2 -m-2"
        )}
        onClick={(e) => e.stopPropagation()}
        aria-label="Drag to reorder task"
      >
        <GripVertical className="h-5 w-5 text-muted-foreground sm:h-4 sm:w-4" />
      </button>

      {/* Completion Checkbox - Touch-friendly size (44px tap target) */}
      <button
        onClick={handleToggleComplete}
        className={cn(
          // Visual checkbox size
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
          // Touch-friendly tap area (padding creates 44px target)
          "p-2 -m-2",
          isCompleted
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/50 hover:border-primary active:border-primary"
        )}
        aria-label={isCompleted ? "Mark as incomplete" : "Mark as complete"}
      >
        {isCompleted && <Check className="h-3.5 w-3.5" />}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {isEditing ? (
          <Input
            ref={inputRef}
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSave}
            onKeyDown={handleTitleKeyDown}
            className="h-auto border-none p-0 text-sm font-medium shadow-none focus-visible:ring-0"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <p
            className={cn(
              "text-sm font-medium leading-tight",
              isCompleted && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </p>
        )}

        {/* Estimated Time Badge */}
        {task.estimatedMins && (
          <Badge
            variant="secondary"
            className={cn(
              "mt-2 gap-1 text-xs",
              isCompleted && "opacity-70"
            )}
          >
            <Clock className="h-3 w-3" />
            {formatDuration(task.estimatedMins)}
          </Badge>
        )}
      </div>
    </div>
  );
}

/**
 * Placeholder card shown when dragging a task
 */
export function TaskCardPlaceholder() {
  return (
    <div className="rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-3">
      <div className="h-4 w-3/4 rounded bg-muted" />
      <div className="mt-2 h-3 w-1/4 rounded bg-muted" />
    </div>
  );
}
