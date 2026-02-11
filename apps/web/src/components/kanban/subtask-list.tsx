import * as React from "react";
import { Plus, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface SubtaskListProps {
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
  className?: string;
}

/**
 * Reusable subtask list component for creating/editing tasks.
 * Provides add, toggle, and delete functionality without drag-and-drop.
 */
export function SubtaskList({
  subtasks,
  onSubtasksChange,
  className,
}: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");

  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: `temp-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    onSubtasksChange([...subtasks, newSubtask]);
    setNewSubtaskTitle("");
  };

  const toggleSubtask = (id: string) => {
    onSubtasksChange(
      subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    );
  };

  const deleteSubtask = (id: string) => {
    onSubtasksChange(subtasks.filter((st) => st.id !== id));
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Subtask list */}
      {subtasks.length > 0 && (
        <div className="space-y-1 mb-2">
          {subtasks.map((subtask) => (
            <SubtaskItem
              key={subtask.id}
              subtask={subtask}
              onToggle={() => toggleSubtask(subtask.id)}
              onDelete={() => deleteSubtask(subtask.id)}
            />
          ))}
        </div>
      )}

      {/* Add subtask input */}
      <div className="flex items-center gap-2">
        <Plus className="h-4 w-4 text-muted-foreground" />
        <Input
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addSubtask();
            }
          }}
          onBlur={addSubtask}
          placeholder="Add a subtask..."
          className="border-none p-0 h-auto text-sm shadow-none focus-visible:ring-0"
        />
      </div>
    </div>
  );
}

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
}

/**
 * Individual subtask item with checkbox and delete button.
 */
function SubtaskItem({ subtask, onToggle, onDelete }: SubtaskItemProps) {
  return (
    <div className="group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/50">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
          subtask.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/40 hover:border-primary"
        )}
      >
        {subtask.completed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </button>
      <span
        className={cn(
          "flex-1 text-sm",
          subtask.completed && "line-through text-muted-foreground"
        )}
      >
        {subtask.title}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6 opacity-0 group-hover:opacity-100"
        onClick={onDelete}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
