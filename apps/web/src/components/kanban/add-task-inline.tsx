import * as React from "react";
import { Plus, ArrowUp, ArrowDown } from "lucide-react";
import { Button, ShortcutHint, Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  AddTaskModal,
  prefetchAddTaskModal,
  type AddPosition,
} from "./add-task-modal.lazy";
import { prefetchRichTextEditor } from "@/components/ui/rich-text-editor.lazy";
import { useAddTaskPosition } from "@/hooks/useAddTaskPosition";
import { useIsMobile } from "@/hooks/useIsMobile";
import { TaskModal, prefetchTaskModal } from "./task-modal.lazy";

interface AddTaskInlineProps {
  scheduledDate: string;
  className?: string;
  /** Compact mode for header display - Sunsama style */
  compact?: boolean;
}

/**
 * Add task button that opens a modal.
 * Supports compact mode for Sunsama-style column headers.
 * Includes a position toggle (top/bottom) backed by a global, DB-persisted
 * user preference, so the choice is remembered across accounts and logins.
 */
export function AddTaskInline({ scheduledDate, className, compact }: AddTaskInlineProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const { addPosition, setAddPosition } = useAddTaskPosition();
  // Phones get the same bottom sheet used to edit tasks.
  const isMobile = useIsMobile();

  const handlePositionChange = (position: AddPosition) => {
    setAddPosition(position);
  };

  const togglePosition = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next: AddPosition = addPosition === "top" ? "bottom" : "top";
    handlePositionChange(next);
  };

  const isTop = addPosition === "top";

  return (
    <>
      <div className={cn("flex items-center gap-1", className)}>
        <Button
          variant="ghost"
          size={compact ? "sm" : "default"}
          className={cn(
            "justify-start gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 group",
            compact ? "h-7 px-2 text-xs" : "flex-1 h-9 gap-2"
          )}
          onClick={() => {
            if (isMobile) void prefetchTaskModal();
            else void prefetchAddTaskModal();
            void prefetchRichTextEditor();
            setIsModalOpen(true);
          }}
          onMouseEnter={() => {
            void prefetchAddTaskModal();
          }}
        >
          <Plus className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span>Add task</span>
          {!compact && <ShortcutHint shortcutKey="quickAdd" className="ml-auto" showOnHover />}
        </Button>

        {/* Position toggle: add to top or bottom */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn(
                  "shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 p-0",
                  compact ? "h-7 w-7" : "h-9 w-9",
                  isTop && "text-primary hover:text-primary"
                )}
                onClick={togglePosition}
              >
                {isTop ? (
                  <ArrowUp className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                ) : (
                  <ArrowDown className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="flex flex-col items-start gap-0.5 text-xs max-w-[200px]">
              <span className="font-medium">
                {isTop ? "Add to top" : "Add to bottom"}
              </span>
              <span className="text-muted-foreground">
                Click to toggle · use <kbd className="font-mono">⌥↑</kbd>/<kbd className="font-mono">⌥↓</kbd> in dialog
              </span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isMobile ? (
        <TaskModal
          task={null}
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          createDefaults={{ scheduledDate }}
        />
      ) : (
        <AddTaskModal
          open={isModalOpen}
          onOpenChange={setIsModalOpen}
          scheduledDate={scheduledDate}
          addPosition={addPosition}
          onAddPositionChange={handlePositionChange}
        />
      )}
    </>
  );
}
