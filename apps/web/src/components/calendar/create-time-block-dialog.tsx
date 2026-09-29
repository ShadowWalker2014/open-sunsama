import * as React from "react";
import type { CalendarCreateAnchor } from "@/hooks/useDragToCreate";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui";
import { EventForm } from "./create-dialog/event-form";

interface CreateTimeBlockDialogProps {
  anchor?: CalendarCreateAnchor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The date for which to create the time block / event */
  date: Date;
  /** Pre-filled start time */
  startTime: Date;
  /** Pre-filled end time */
  endTime: Date;
}

export function CreateTimeBlockDialog({
  open,
  onOpenChange,
  date,
  startTime,
  endTime,
  anchor,
}: CreateTimeBlockDialogProps) {
  const titleId = React.useId();
  const content = (
    <>
      <h2 id={titleId} className="sr-only">
        Add event
      </h2>
      <EventForm
        date={date}
        startTime={startTime}
        endTime={endTime}
        onClose={() => onOpenChange(false)}
      />
    </>
  );
  const virtualRef = React.useMemo(
    () => ({
      current: {
        getBoundingClientRect: () =>
          new DOMRect(anchor?.x ?? 0, anchor?.y ?? 0, 0, 0),
      },
    }),
    [anchor?.x, anchor?.y]
  );
  if (anchor)
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverAnchor virtualRef={virtualRef} />
        <PopoverContent
          side="right"
          align="start"
          sideOffset={12}
          collisionPadding={12}
          aria-labelledby={titleId}
          className="w-[360px] max-w-[calc(100vw-24px)] max-h-[calc(100vh-24px)] overflow-y-auto p-4"
        >
          {content}
        </PopoverContent>
      </Popover>
    );
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-[460px]"
        aria-labelledby={titleId}
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Add event</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}
