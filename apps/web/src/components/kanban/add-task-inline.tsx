import * as React from "react";
import { Plus } from "lucide-react";
import { Button, ShortcutHint } from "@/components/ui";
import { cn } from "@/lib/utils";
import { AddTaskModal } from "./add-task-modal";

interface AddTaskInlineProps {
  scheduledDate: string;
  className?: string;
  /** Compact mode for header display - Sunsama style */
  compact?: boolean;
}

/**
 * Add task button that opens a modal.
 * Supports compact mode for Sunsama-style column headers.
 */
export function AddTaskInline({ scheduledDate, className, compact }: AddTaskInlineProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <Button
        variant="ghost"
        size={compact ? "sm" : "default"}
        className={cn(
          "justify-start gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 group",
          compact ? "h-7 px-2 text-xs" : "w-full h-9 gap-2",
          className
        )}
        onClick={() => setIsModalOpen(true)}
      >
        <Plus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <span>Add task</span>
        {!compact && <ShortcutHint shortcutKey="quickAdd" className="ml-auto" showOnHover />}
      </Button>

      <AddTaskModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        scheduledDate={scheduledDate}
      />
    </>
  );
}
