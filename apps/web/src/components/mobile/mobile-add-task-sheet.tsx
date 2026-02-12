import * as React from "react";
import { createPortal } from "react-dom";
import { Send } from "lucide-react";
import type { TaskPriority } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { useCreateTask } from "@/hooks/useTasks";

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
 * Custom bottom sheet for mobile task creation that stays above the virtual keyboard.
 * Uses visualViewport API to detect keyboard height and position itself correctly.
 */
export function MobileAddTaskSheet({
  open,
  onOpenChange,
  scheduledDate,
}: MobileAddTaskSheetProps) {
  const [title, setTitle] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority>("P2");
  const [bottomOffset, setBottomOffset] = React.useState(0);
  const [visible, setVisible] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();

  // Animate in after mount
  React.useEffect(() => {
    if (open) {
      // Small delay to trigger CSS transition
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setVisible(true));
      });
      setTimeout(() => inputRef.current?.focus(), 200);
    } else {
      setVisible(false);
    }
  }, [open]);

  // Reset on close
  React.useEffect(() => {
    if (!open) {
      setTitle("");
      setPriority("P2");
      setBottomOffset(0);
    }
  }, [open]);

  // Track keyboard via visualViewport
  React.useEffect(() => {
    if (!open) return;

    const vv = window.visualViewport;
    if (!vv) return;

    const handleResize = () => {
      // Difference between layout viewport and visual viewport = keyboard height
      const keyboardHeight = window.innerHeight - vv.height - vv.offsetTop;
      setBottomOffset(Math.max(0, keyboardHeight));
    };

    vv.addEventListener("resize", handleResize);
    vv.addEventListener("scroll", handleResize);
    handleResize();

    return () => {
      vv.removeEventListener("resize", handleResize);
      vv.removeEventListener("scroll", handleResize);
    };
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

  if (!open) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-50 bg-black/50 transition-opacity duration-200",
          visible ? "opacity-100" : "opacity-0"
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Sheet panel */}
      <div
        className={cn(
          "fixed inset-x-0 z-50 bg-background border-t rounded-t-2xl shadow-lg",
          "transition-transform duration-200 ease-out",
          visible ? "translate-y-0" : "translate-y-full"
        )}
        style={{ bottom: bottomOffset }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-8 h-1 rounded-full bg-muted-foreground/20" />
        </div>

        <div className="px-4 pb-6">
          {/* Title input row */}
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="What needs to be done?"
              className="flex-1 text-base bg-transparent outline-none placeholder:text-muted-foreground/50 h-10"
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="send"
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
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground mr-1">Priority</span>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={cn(
                  "h-7 px-2.5 rounded-full text-xs font-medium transition-all",
                  priority === p
                    ? cn(PRIORITY_COLORS[p], "ring-2 ring-offset-2 ring-offset-background", PRIORITY_RING[p])
                    : "bg-muted text-muted-foreground"
                )}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
