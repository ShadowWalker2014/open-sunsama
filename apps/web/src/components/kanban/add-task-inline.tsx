import * as React from "react";
import { Plus } from "lucide-react";
import { ShortcutHint } from "@/components/ui";
import { cn } from "@/lib/utils";
import { prefetchRichTextEditor } from "@/components/ui/rich-text-editor.lazy";
import { useIsMobile } from "@/hooks/useIsMobile";
import { TaskModal, prefetchTaskModal } from "./task-modal.lazy";
import { AddTaskModal, prefetchAddTaskModal } from "./add-task-modal.lazy";

export type { AddPosition } from "./add-task-modal";

interface AddTaskInlineProps {
  scheduledDate: string;
  className?: string;
  /** Compact mode for header display - Sunsama style */
  compact?: boolean;
  /**
   * "bar": fills a Sunsama-style add bar at the top of a day column. The
   * "Add task" label shows when `showLabel` is set, otherwise on hover.
   */
  variant?: "bar";
  showLabel?: boolean;
}

/**
 * The "+ Add task" control. On desktop it opens the same centered quick-add
 * composer as the A shortcut, set to this column's day; on phones it opens
 * the task sheet in create mode.
 */
export function AddTaskInline({
  scheduledDate,
  className,
  compact,
  variant,
  showLabel = true,
}: AddTaskInlineProps) {
  const isBar = variant === "bar";
  const [open, setOpen] = React.useState(false);
  const isMobile = useIsMobile();

  const trigger = (
    <button
      type="button"
      onClick={() => {
        if (isMobile) {
          void prefetchTaskModal();
          void prefetchRichTextEditor();
        } else {
          void prefetchAddTaskModal();
        }
        setOpen(true);
      }}
      className={cn(
        "group/add flex w-full items-center gap-2 text-muted-foreground transition-colors hover:text-foreground focus:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
        isBar
          ? "h-full min-w-0 flex-1 rounded-md px-3 text-sm"
          : compact
            ? "h-7 rounded-md px-2 text-xs"
            : "h-9 rounded-md px-3 text-sm hover:bg-muted/50",
        className
      )}
    >
      <Plus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span
        className={cn(
          isBar &&
            !showLabel &&
            "opacity-0 transition-opacity group-hover/add:opacity-100"
        )}
      >
        Add task
      </span>
      <ShortcutHint shortcutKey="addTask" showOnHover />
    </button>
  );

  if (isMobile) {
    return (
      <>
        {trigger}
        <TaskModal
          task={null}
          open={open}
          onOpenChange={setOpen}
          createDefaults={{ scheduledDate }}
        />
      </>
    );
  }

  return (
    <>
      {trigger}
      <AddTaskModal
        open={open}
        onOpenChange={setOpen}
        scheduledDate={scheduledDate}
      />
    </>
  );
}
