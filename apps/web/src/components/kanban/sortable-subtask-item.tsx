import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X, GripVertical, Check } from "lucide-react";
import type { Subtask } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";
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
 * Sortable subtask item with drag handle and inline editing.
 * Click on title to edit directly.
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

  // Focus input when entering edit mode
  React.useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Sync edit value when subtask changes
  React.useEffect(() => {
    setEditValue(subtask.title);
  }, [subtask.title]);

  const handleTitleClick = () => {
    if (onUpdate) {
      setIsEditing(true);
    }
  };

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
      className={cn(
        "group flex items-center gap-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors",
        isDragging && "opacity-50 bg-muted/30"
      )}
      onMouseEnter={() => setHoveredSubtaskId(subtask.id)}
      onMouseLeave={() => setHoveredSubtaskId(null)}
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
          "cursor-pointer",
          subtask.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
        )}
      >
        {subtask.completed && (
          <Check className="h-2.5 w-2.5" strokeWidth={3} />
        )}
      </button>

      {/* Title - click to edit */}
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex-1 text-[13px] bg-transparent border-none outline-none",
            "focus:ring-0 p-0"
          )}
        />
      ) : (
        <span
          onClick={handleTitleClick}
          className={cn(
            "flex-1 text-[13px] cursor-text",
            subtask.completed && "line-through text-muted-foreground",
            onUpdate && "hover:bg-muted/30 rounded px-1 -mx-1"
          )}
        >
          {subtask.title}
        </span>
      )}

      {/* Delete button - shows on hover */}
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
        onClick={onDelete}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
