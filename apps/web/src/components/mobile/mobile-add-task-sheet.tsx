import * as React from "react";
import { Send } from "lucide-react";
import type { TaskPriority } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { useCreateTask } from "@/hooks/useTasks";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Input } from "@/components/ui";

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  P0: "bg-red-500 text-white",
  P1: "bg-orange-500 text-white",
  P2: "bg-blue-500 text-white",
  P3: "bg-slate-400 text-white",
};

const PRIORITY_RING: Record<TaskPriority, string> = {
  P0: "ring-red-500",
  P1: "ring-orange-500",
  P2: "ring-blue-500",
  P3: "ring-slate-400",
};

const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

interface MobileAddTaskSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduledDate?: string | null;
}

/**
 * Minimal bottom sheet for quickly adding tasks on mobile.
 * Slides up from the bottom with just a title input, priority chips, and send button.
 */
export function MobileAddTaskSheet({
  open,
  onOpenChange,
  scheduledDate,
}: MobileAddTaskSheetProps) {
  const [title, setTitle] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority>("P2");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();

  // Focus input when sheet opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [open]);

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setTitle("");
      setPriority("P2");
    }
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim() || createTask.isPending) return;

    await createTask.mutateAsync({
      title: title.trim(),
      scheduledDate: scheduledDate || undefined,
      priority,
    });

    // Reset for next task (keep sheet open for rapid entry)
    setTitle("");
    setPriority("P2");
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="px-4 pb-8 pt-3 rounded-t-2xl max-h-[40vh] [&>button]:hidden"
      >
        {/* Drag handle */}
        <div className="flex justify-center mb-3">
          <div className="w-8 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        {/* Title input row */}
        <div className="flex items-center gap-2">
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="What needs to be done?"
            className="flex-1 border-none p-0 text-base shadow-none focus-visible:ring-0 h-10 bg-transparent"
          />
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || createTask.isPending}
            className={cn(
              "shrink-0 flex items-center justify-center w-9 h-9 rounded-full transition-all",
              title.trim()
                ? "bg-primary text-primary-foreground active:scale-95"
                : "bg-muted text-muted-foreground"
            )}
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        {/* Priority chips */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-xs text-muted-foreground mr-1">Priority</span>
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => setPriority(p)}
              className={cn(
                "h-7 px-2.5 rounded-full text-xs font-medium transition-all",
                priority === p
                  ? cn(PRIORITY_COLORS[p], "ring-2 ring-offset-2 ring-offset-background", PRIORITY_RING[p])
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
