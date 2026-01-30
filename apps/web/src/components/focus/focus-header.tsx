import * as React from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import { PriorityBadge } from "@/components/ui/priority-badge";
import type { TaskPriority } from "@open-sunsama/types";

interface FocusHeaderProps {
  title: string;
  priority: TaskPriority;
  isCompleted: boolean;
  onTitleChange: (title: string) => void;
  onToggleComplete: () => void;
  onClose: () => void;
}

/**
 * Focus mode header with large editable title and close button
 */
export function FocusHeader({
  title,
  priority,
  isCompleted,
  onTitleChange,
  onToggleComplete,
  onClose,
}: FocusHeaderProps) {
  const [editedTitle, setEditedTitle] = React.useState(title);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync with external title changes
  React.useEffect(() => {
    setEditedTitle(title);
  }, [title]);

  const handleBlur = () => {
    const trimmed = editedTitle.trim();
    if (trimmed && trimmed !== title) {
      onTitleChange(trimmed);
    } else {
      setEditedTitle(title);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
  };

  return (
    <div className="flex flex-col gap-3 py-4">
      {/* Top bar with close button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground/70">Focus</span>
          <PriorityBadge priority={priority} />
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close (Esc)</span>
        </Button>
      </div>

      {/* Editable title */}
      <div className="flex items-start gap-3">
        {/* Complete button */}
        <button
          onClick={onToggleComplete}
          className={cn(
            "mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all",
            isCompleted
              ? "border-primary bg-primary text-primary-foreground"
              : "border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
          )}
        >
          {isCompleted && <Check className="h-3 w-3" strokeWidth={2.5} />}
        </button>

        {/* Title input */}
        <Input
          ref={inputRef}
          value={editedTitle}
          onChange={(e) => setEditedTitle(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn(
            "border-none shadow-none text-xl font-medium p-0 h-auto focus-visible:ring-0 bg-transparent",
            isCompleted && "line-through text-muted-foreground"
          )}
          placeholder="Task title..."
        />
      </div>
    </div>
  );
}
