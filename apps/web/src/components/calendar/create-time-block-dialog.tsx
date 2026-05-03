import * as React from "react";
import { format } from "date-fns";
import { Clock, Calendar as CalendarIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui";
import { TimeBlockForm } from "./create-dialog/time-block-form";
import { EventForm } from "./create-dialog/event-form";

interface CreateTimeBlockDialogProps {
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
}: CreateTimeBlockDialogProps) {
  const [mode, setMode] = React.useState<CreateMode>("time-block");

  // Reset mode when the dialog re-opens — most users want time block by
  // default; sticky-on-event would surprise the next session.
  React.useEffect(() => {
    if (open) setMode("time-block");
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Create</DialogTitle>
          <DialogDescription>
            {format(date, "EEEE, MMMM d")} · {format(startTime, "h:mm a")} –{" "}
            {format(endTime, "h:mm a")}
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={mode}
          onValueChange={(v) => setMode(v as CreateMode)}
          className="w-full"
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
      </DialogContent>
    </Dialog>
  );
}
