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
 * Mobile bottom sheet for quick task creation.
 * Always mounted in DOM so focus works within user gesture context.
 * Priority buttons use preventDefault to keep keyboard open.
 */
export function MobileAddTaskSheet({
  open,
  onOpenChange,
  scheduledDate,
}: MobileAddTaskSheetProps) {
  const [title, setTitle] = React.useState("");
  const [priority, setPriority] = React.useState<TaskPriority>("P2");
  const [bottomOffset, setBottomOffset] = React.useState(0);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const createTask = useCreateTask();

  // Focus input when opened — runs synchronously in the user gesture chain
  // because the component is always mounted (not conditionally rendered)
  React.useEffect(() => {
    if (open) {
      inputRef.current?.focus();
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

    // Blur input first to dismiss keyboard before closing sheet
    inputRef.current?.blur();

    await createTask.mutateAsync({
      title: title.trim(),
      scheduledDate: scheduledDate || undefined,
      priority,
    });

    onOpenChange(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 transition-all duration-200",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-black/50 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={() => {
          inputRef.current?.blur();
          onOpenChange(false);
        }}
      />

      {/* Sheet panel */}
      <div
        className={cn(
          "absolute inset-x-0 bg-background border-t rounded-t-2xl shadow-lg",
          "transition-transform duration-200 ease-out",
          open ? "translate-y-0" : "translate-y-full"
        )}
        style={{ bottom: bottomOffset }}
        // Prevent taps inside sheet from closing it
        onClick={(e) => e.stopPropagation()}
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
              className="flex-1 text-base bg-transparent outline-none placeholder:text-muted-foreground/50 h-10 caret-primary"
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="send"
              inputMode="text"
            />
            {/* Send button — preventDefault keeps keyboard open until submit completes */}
            <button
              onPointerDown={(e) => e.preventDefault()}
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

          {/* Priority chips — onPointerDown preventDefault keeps keyboard open */}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground mr-1">Priority</span>
            {PRIORITIES.map((p) => (
              <button
                key={p}
                onPointerDown={(e) => e.preventDefault()}
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
    </div>,
    document.body
  );
}
