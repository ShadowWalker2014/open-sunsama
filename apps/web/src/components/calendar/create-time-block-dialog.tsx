import * as React from "react";
import type { CalendarCreateAnchor } from "@/hooks/useDragToCreate";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import { TimeBlockForm } from "./create-dialog/time-block-form";
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

type CreateMode = "time-block" | "event";

/**
 * Dialog for creating a time block OR a calendar event from an empty
 * time slot. Tabs let the user pick which kind to create — the time
 * block path is the default (it's the app's primary motion), the
 * calendar-event path writes through to the connected provider.
 */
export function CreateTimeBlockDialog({
  open,
  onOpenChange,
  date,
  startTime,
  endTime,
  anchor,
}: CreateTimeBlockDialogProps) {
  const [mode, setMode] = React.useState<CreateMode>("time-block");

  // Reset mode when the dialog re-opens — most users want time block by
  // default; sticky-on-event would surprise the next session.
  React.useEffect(() => {
    if (open) setMode("time-block");
  }, [open]);

  const titleId = React.useId();
  const descriptionId = React.useId();
  const content = (
    <>
      <div>
        <h2 id={titleId} className="text-sm font-semibold">
          Create
        </h2>
        <p id={descriptionId} className="mt-1 text-xs text-muted-foreground">
          {format(date, "EEEE, MMMM d")} · {format(startTime, "h:mm a")} –{" "}
          {format(endTime, "h:mm a")}
        </p>
      </div>

      <Tabs
        value={mode}
        onValueChange={(v) => setMode(v as CreateMode)}
        className="mt-4 w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="time-block">
            <Clock className="mr-2 h-3.5 w-3.5" />
            Time block
          </TabsTrigger>
          <TabsTrigger value="event">
            <CalendarIcon className="mr-2 h-3.5 w-3.5" />
            Calendar event
          </TabsTrigger>
        </TabsList>

        <TabsContent value="time-block" className="mt-4">
          <TimeBlockForm
            date={date}
            startTime={startTime}
            endTime={endTime}
            onClose={() => onOpenChange(false)}
          />
        </TabsContent>

        <TabsContent value="event" className="mt-4">
          <EventForm
            date={date}
            startTime={startTime}
            endTime={endTime}
            onClose={() => onOpenChange(false)}
          />
        </TabsContent>
      </Tabs>
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
          aria-describedby={descriptionId}
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
        aria-describedby={descriptionId}
      >
        <DialogTitle className="sr-only">Create</DialogTitle>
        {content}
      </DialogContent>
    </Dialog>
  );
}
