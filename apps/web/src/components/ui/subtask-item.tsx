import * as React from "react";
import { X, Check } from "lucide-react";
import type { Subtask } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui";

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: () => void;
  onDelete?: () => void;
  onUpdate?: (title: string) => void;
  /** Compact mode for smaller views like time block sheets */
  compact?: boolean;
  className?: string;
}

/**
 * Subtask item with checkbox and optional inline editing.
 * Used in time block details and other non-draggable contexts.
 * For drag-and-drop, use SortableSubtaskItem instead.
 */
export function SubtaskItem({
  subtask,
  onToggle,
  onDelete,
  onUpdate,
  compact = false,
  className,
}: SubtaskItemProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [editValue, setEditValue] = React.useState(subtask.title);
  const inputRef = React.useRef<HTMLInputElement>(null);

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

  const handleTitleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const checkboxSize = compact ? "h-3.5 w-3.5" : "h-4 w-4";
  const checkSize = compact ? "h-2 w-2" : "h-2.5 w-2.5";
  const textSize = compact ? "text-sm" : "text-sm";

  return (
    <div
      className={cn(
        "group flex items-center gap-2 rounded-md transition-colors",
        compact ? "py-1 px-1 -mx-1" : "py-1.5 px-2 -mx-2",
        "hover:bg-muted/50",
        className
      )}
    >
      {/* Checkbox */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full border-2 transition-all",
          checkboxSize,
          subtask.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30 hover:border-primary"
        )}
      >
        {subtask.completed && <Check className={checkSize} strokeWidth={3} />}
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
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "flex-1 bg-transparent border-none outline-none focus:ring-0 p-0",
            textSize
          )}
        />
      ) : (
        <span
          onClick={handleTitleClick}
          className={cn(
            "flex-1 truncate",
            textSize,
            onUpdate && "cursor-text",
            subtask.completed && "line-through text-muted-foreground"
          )}
        >
          {subtask.title}
        </span>
      )}

      {/* Delete button */}
      {onDelete && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "opacity-0 group-hover:opacity-100 transition-opacity shrink-0",
            compact ? "h-5 w-5" : "h-6 w-6"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <X className={compact ? "h-2.5 w-2.5" : "h-3 w-3"} />
        </Button>
      )}
    </div>
  );
}
