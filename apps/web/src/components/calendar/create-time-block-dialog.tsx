import * as React from "react";
import { format } from "date-fns";
import { Clock, ListTodo, Calendar as CalendarIcon, Loader2 } from "lucide-react";
import { useCreateTimeBlock, useTasks } from "@/hooks";
import {
  useCalendars,
  useCalendarAccounts,
  useCreateCalendarEvent,
} from "@/hooks/useCalendars";
import { toast } from "@/hooks/use-toast";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { startOfDay, endOfDay } from "date-fns";

const PROVIDERS_WITH_WRITE_BACK = new Set(["google"]);

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
  // default, sticky-on-event would surprise the next session.
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

/**
 * Time block sub-form — preserves the prior single-purpose dialog UX.
 * Optionally links the block to an existing unscheduled task on the
 * same day.
 */
function TimeBlockForm({
  date,
  startTime,
  endTime,
  onClose,
}: {
  date: Date;
  startTime: Date;
  endTime: Date;
  onClose: () => void;
}) {
  const [title, setTitle] = React.useState("");
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(
    null
  );
  const [showTaskList, setShowTaskList] = React.useState(false);

  const createTimeBlock = useCreateTimeBlock();

  const dateString = format(date, "yyyy-MM-dd");
  const { data: tasks = [] } = useTasks({
    scheduledDate: dateString,
    limit: 200,
  });
  const availableTasks = tasks.filter((task) => !task.completedAt);

  // Reset on mount of this tab.
  React.useEffect(() => {
    setTitle("");
    setSelectedTaskId(null);
    setShowTaskList(false);
  }, [date, startTime, endTime]);

  React.useEffect(() => {
    if (selectedTaskId) {
      const task = availableTasks.find((t) => t.id === selectedTaskId);
      if (task) setTitle(task.title);
    }
  }, [selectedTaskId, availableTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    await createTimeBlock.mutateAsync({
      title: title.trim(),
      startTime,
      endTime,
      taskId: selectedTaskId ?? undefined,
    });
    onClose();
  };

  const selectedTask = selectedTaskId
    ? availableTasks.find((t) => t.id === selectedTaskId)
    : null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="tb-title">Title</Label>
        <Input
          id="tb-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you working on?"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ListTodo className="h-4 w-4" />
          Link to task (optional)
        </Label>

        {selectedTask ? (
          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
            <span className="truncate text-sm">{selectedTask.title}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedTaskId(null);
                setTitle("");
              }}
            >
              Remove
            </Button>
          </div>
        ) : (
          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full justify-start"
              onClick={() => setShowTaskList(!showTaskList)}
            >
              {availableTasks.length > 0
                ? "Select a task..."
                : "No tasks available"}
            </Button>

            {showTaskList && availableTasks.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border bg-background shadow-md">
                {availableTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    className="w-full truncate px-3 py-2 text-left text-sm transition-colors hover:bg-muted"
                    onClick={() => {
                      setSelectedTaskId(task.id);
                      setShowTaskList(false);
                    }}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!title.trim() || createTimeBlock.isPending}
        >
          {createTimeBlock.isPending ? "Creating..." : "Create"}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Calendar event sub-form. Picks among the user's writable calendars
 * (Google for now) and writes through to the provider.
 */
function EventForm({
  date,
  startTime,
  endTime,
  onClose,
}: {
  date: Date;
  startTime: Date;
  endTime: Date;
  onClose: () => void;
}) {
  const { data: calendars = [] } = useCalendars();
  const { data: accounts = [] } = useCalendarAccounts();
  const createMutation = useCreateCalendarEvent();

  const writableCalendars = React.useMemo(() => {
    const providerByAccount = new Map<string, string>();
    for (const a of accounts) providerByAccount.set(a.id, a.provider);
    return calendars
      .filter((c) => {
        const provider = providerByAccount.get(c.accountId);
        return (
          !!provider &&
          PROVIDERS_WITH_WRITE_BACK.has(provider) &&
          !c.isReadOnly &&
          c.isEnabled
        );
      })
      .sort((a, b) => {
        if (a.isDefaultForEvents && !b.isDefaultForEvents) return -1;
        if (!a.isDefaultForEvents && b.isDefaultForEvents) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [calendars, accounts]);

  const [title, setTitle] = React.useState("");
  const [calendarId, setCalendarId] = React.useState<string | undefined>(
    writableCalendars[0]?.id
  );
  const [location, setLocation] = React.useState("");

  React.useEffect(() => {
    setTitle("");
    setLocation("");
  }, [date, startTime, endTime]);

  React.useEffect(() => {
    if (!calendarId && writableCalendars[0]?.id) {
      setCalendarId(writableCalendars[0].id);
    }
  }, [calendarId, writableCalendars]);

  const dayStart = React.useMemo(() => startOfDay(date), [date]);
  const dayEnd = React.useMemo(() => endOfDay(date), [date]);
  const rangeFrom = dayStart.toISOString();
  const rangeTo = dayEnd.toISOString();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    if (!calendarId) {
      toast({
        variant: "destructive",
        title: "Pick a calendar",
        description: "Choose which calendar to add this event to.",
      });
      return;
    }
    try {
      await createMutation.mutateAsync({
        calendarId,
        rangeFrom,
        rangeTo,
        payload: {
          title: trimmed,
          location: location.trim() || null,
          startTime,
          endTime,
          isAllDay: false,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
      toast({ title: "Event created" });
      onClose();
    } catch {
      // Mutation hook handled the toast.
    }
  };

  if (writableCalendars.length === 0) {
    return (
      <div className="space-y-3 text-sm">
        <p className="text-muted-foreground">
          No writable calendars connected. Connect a Google account in
          Settings → Calendar to create events from here.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ev-title">Title</Label>
        <Input
          id="ev-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          autoFocus
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-cal">Calendar</Label>
        <Select value={calendarId} onValueChange={setCalendarId}>
          <SelectTrigger id="ev-cal">
            <SelectValue placeholder="Select calendar" />
          </SelectTrigger>
          <SelectContent>
            {writableCalendars.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                <span className="inline-flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: c.color ?? "#6B7280" }}
                    aria-hidden
                  />
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="ev-location">Location (optional)</Label>
        <Input
          id="ev-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Add location"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!title.trim() || !calendarId || createMutation.isPending}
        >
          {createMutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {createMutation.isPending ? "Creating..." : "Create event"}
        </Button>
      </DialogFooter>
    </form>
  );
}
