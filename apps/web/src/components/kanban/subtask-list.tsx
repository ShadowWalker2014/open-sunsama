import * as React from "react";
import { X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SubtaskAddRow } from "./subtask-add-row";

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface SubtaskListProps {
  subtasks: Subtask[];
  onSubtasksChange: (subtasks: Subtask[]) => void;
  /** Lets a parent button focus the add field. */
  addInputRef?: React.Ref<HTMLInputElement>;
  className?: string;
}

/**
 * Local-state subtask list for forms that create a task or idea, styled to
 * match the live checklist in the task modal and focus mode.
 */
export function SubtaskList({
  subtasks,
  onSubtasksChange,
  addInputRef,
  className,
}: SubtaskListProps) {
  const addSubtasks = (titles: string[]) => {
    const now = Date.now();
    onSubtasksChange([
      ...subtasks,
      ...titles.map((title, i) => ({
        id: `temp-${now}-${i}`,
        title: title.slice(0, 500),
        completed: false,
      })),
    ]);
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
    <div className={className}>
      {subtasks.length > 0 && (
        <div className="space-y-px">
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
      <SubtaskAddRow ref={addInputRef} onAdd={addSubtasks} />
    </div>
  );
}

interface SubtaskItemProps {
  subtask: Subtask;
  onToggle: () => void;
  onDelete: () => void;
}

function SubtaskItem({ subtask, onToggle, onDelete }: SubtaskItemProps) {
  return (
    <div className="group -mx-2 flex min-h-8 items-start gap-2.5 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/40">
      <button
        type="button"
        role="checkbox"
        aria-checked={subtask.completed}
        aria-label={subtask.completed ? "Mark incomplete" : "Mark complete"}
        onClick={onToggle}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-150 active:scale-90",
          subtask.completed
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/35 hover:border-primary hover:bg-primary/10"
        )}
      >
        {subtask.completed && <Check className="h-2.5 w-2.5" strokeWidth={3} />}
      </button>
      <span
        className={cn(
          "min-w-0 flex-1 break-words text-sm leading-5",
          subtask.completed &&
            "text-muted-foreground line-through decoration-muted-foreground/50"
        )}
      >
        {subtask.title}
      </span>
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
