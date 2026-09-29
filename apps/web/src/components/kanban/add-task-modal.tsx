import { format } from "date-fns";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui";
import { AddTaskComposer } from "./add-task-composer";

export type AddPosition = "top" | "bottom";

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Defaults to today; null adds to the backlog. */
  scheduledDate?: string | null;
  /** @deprecated The composer reads the stored preference itself. */
  addPosition?: AddPosition;
  /** @deprecated */
  onAddPositionChange?: (position: AddPosition) => void;
  /**
   * Pre-populate the title field on open. Used by the calendar event
   * detail sheet's "Create task from event" action.
   */
  initialTitle?: string;
}

/**
 * Quick add from anywhere (the A shortcut, the command palette, the
 * backlog): the same one-line composer as a column's add bar, shown near
 * the top of the screen.
 */
export function AddTaskModal({
  open,
  onOpenChange,
  scheduledDate,
  initialTitle,
}: AddTaskModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[18vh] max-w-xl translate-y-0 gap-0 overflow-visible rounded-xl border-border/40 bg-popover p-0 shadow-2xl [&>button]:hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Add task</DialogTitle>
        {open && (
          <AddTaskComposer
            scheduledDate={
              scheduledDate === undefined
                ? format(new Date(), "yyyy-MM-dd")
                : scheduledDate
            }
            initialTitle={initialTitle}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
