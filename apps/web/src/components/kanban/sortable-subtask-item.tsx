import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical, Check } from "lucide-react";
import type { Subtask } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { useHoveredTask } from "@/hooks/useKeyboardShortcuts";

// Re-export for convenience
export type { Subtask };

interface SortableSubtaskItemProps {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
  onUpdate?: (title: string) => void;
}

/**
 * Sortable subtask row: gutter drag handle, round checkbox, click-to-edit
 * title and a delete button. Shared by the task modal and focus mode.
 */
export function SortableSubtaskItem({
  subtask,
  onToggle,
  onDelete,
  onUpdate,
}: SortableSubtaskItemProps) {
  const { setHoveredSubtaskId } = useHoveredTask();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(subtask.title);
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  React.useEffect(() => {
    setEditValue(subtask.title);
  }, [subtask.title]);

  const handleSave = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== subtask.title && onUpdate) {
      onUpdate(trimmed);
    } else {
      setEditValue(subtask.title);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      setEditValue(subtask.title);
      setIsEditing(false);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      data-subtask-id={subtask.id}
      className={cn(
        "group relative -mx-2 flex min-h-8 items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors",
        "hover:bg-muted/40",
        isEditing && "bg-muted/40",
        isDragging && "z-10 bg-muted/60 shadow-sm"
      )}
      onMouseEnter={() => setHoveredSubtaskId(subtask.id)}
      onMouseLeave={() => setHoveredSubtaskId(null)}
    >
      {/* Drag handle sits in the left gutter so checkboxes line up with the
          add row. Hidden on touch, where there is no hover to reveal it. */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label="Reorder subtask"
        className={cn(
          "absolute -left-4 top-1.5 hidden h-5 w-4 items-center justify-center rounded sm:flex",
          "cursor-grab touch-none text-muted-foreground/40 opacity-0 transition-opacity",
          "hover:text-muted-foreground group-hover:opacity-100 focus-visible:opacity-100 active:cursor-grabbing",
          isDragging && "opacity-100"
        )}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        role="checkbox"
        aria-checked={subtask.completed}
        aria-label={subtask.completed ? "Mark incomplete" : "Mark complete"}
        onClick={onToggle}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 cursor-pointer items-center justify-center rounded-full border-[1.5px] transition-all duration-150 active:scale-90",
          subtask.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/35 hover:border-primary hover:bg-primary/10"
        )}
      >
        {subtask.completed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </button>

      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          data-escape-local="true"
          aria-label="Edit subtask"
          className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm leading-5 outline-none focus:ring-0"
        />
      ) : (
        <span
          onClick={() => onUpdate && setIsEditing(true)}
          className={cn(
            "min-w-0 flex-1 break-words text-sm leading-5 transition-colors",
            onUpdate && "cursor-text",
            subtask.completed &&
              "text-muted-foreground line-through decoration-muted-foreground/50"
          )}
        >
          {subtask.title}
        </span>
      )}

      <button
        type="button"
        aria-label="Delete subtask"
        onClick={onDelete}
        className={cn(
          "-my-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded text-muted-foreground/60",
          "opacity-0 transition-opacity hover:bg-muted hover:text-foreground",
          "group-hover:opacity-100 focus-visible:opacity-100 [@media(hover:none)]:opacity-100"
        )}
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
