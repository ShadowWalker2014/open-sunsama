import * as React from "react";
import { Plus } from "lucide-react";
import { useCreateTask } from "@/hooks/useTasks";
import { Button, Input } from "@/components/ui";
import { cn } from "@/lib/utils";

interface AddTaskInlineProps {
  scheduledDate: string;
  className?: string;
}

/**
 * Inline task creation component.
 * Shows a button that expands to an input field for quick task creation.
 */
export function AddTaskInline({ scheduledDate, className }: AddTaskInlineProps) {
  const [isAdding, setIsAdding] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!title.trim()) return;

    await createTask.mutateAsync({
      title: title.trim(),
      scheduledDate,
    });

    setTitle("");
    // Keep the input open for rapid task entry
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Escape") {
      setTitle("");
      setIsAdding(false);
    }
  };

  const handleBlur = () => {
    // Only close if empty
    if (!title.trim()) {
      setIsAdding(false);
    }
  };

  React.useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  if (!isAdding) {
    return (
      <Button
        variant="ghost"
        className={cn(
          "w-full justify-start gap-2 text-muted-foreground hover:text-foreground",
          "h-11 sm:h-9", // Touch-friendly height on mobile
          "active:bg-accent", // Touch feedback
          className
        )}
        onClick={() => setIsAdding(true)}
      >
        <Plus className="h-5 w-5 sm:h-4 sm:w-4" />
        Add task
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={cn("p-1", className)}>
      <Input
        ref={inputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        placeholder="What needs to be done?"
        className="h-11 sm:h-9 text-base sm:text-sm" // Touch-friendly on mobile
        disabled={createTask.isPending}
      />
    </form>
  );
}
