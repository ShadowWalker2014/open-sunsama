import * as React from "react";
import { startOfDay, endOfDay, format, isSameDay } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  useCalendars,
  useCalendarAccounts,
  useCreateCalendarEvent,
} from "@/hooks/useCalendars";
import { useCreateTimeBlock } from "@/hooks/useTimeBlocks";
import { toast } from "@/hooks/use-toast";
import {
  Button,
  DialogFooter,
  Input,
  Label,
  Switch,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui";
import { isCalendarReadOnlyForUi } from "@/lib/calendar-providers";

export function EventForm({
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
  const { data: calendars = [], isLoading: calendarsLoading } = useCalendars();
  const { data: accounts = [], isLoading: accountsLoading } =
    useCalendarAccounts();
  const createMutation = useCreateCalendarEvent();
  const createBlock = useCreateTimeBlock();
  const pending = createMutation.isPending || createBlock.isPending;
  const [expanded, setExpanded] = React.useState(false);
  const [start, setStart] = React.useState(
    format(startTime, "yyyy-MM-dd'T'HH:mm")
  );
  const [end, setEnd] = React.useState(format(endTime, "yyyy-MM-dd'T'HH:mm"));

  const writableCalendars = React.useMemo(() => {
    const providerByAccount = new Map<string, string>();
    for (const a of accounts) providerByAccount.set(a.id, a.provider);
    return calendars
      .filter((c) => {
        const provider = providerByAccount.get(c.accountId);
        return !isCalendarReadOnlyForUi(provider, c.isReadOnly) && c.isEnabled;
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
  const [isAllDay, setIsAllDay] = React.useState(false);

  React.useEffect(() => {
    setTitle("");
    setLocation("");
    setIsAllDay(false);
    setStart(format(startTime, "yyyy-MM-dd'T'HH:mm"));
    setEnd(format(endTime, "yyyy-MM-dd'T'HH:mm"));
  }, [date, startTime, endTime]);

  React.useEffect(() => {
    if (!calendarId && !calendarsLoading && !accountsLoading) {
      setCalendarId(writableCalendars[0]?.id ?? "local");
    }
  }, [calendarId, writableCalendars, calendarsLoading, accountsLoading]);

  const dayStart = React.useMemo(() => startOfDay(date), [date]);
  const dayEnd = React.useMemo(() => endOfDay(date), [date]);
  const rangeFrom = dayStart.toISOString();
  const rangeTo = dayEnd.toISOString();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || pending) return;
    if (!calendarId) {
      toast({
        variant: "destructive",
        title: "Pick a calendar",
        description: "Choose which calendar to add this event to.",
      });
      return;
    }
    const selectedStart = new Date(start);
    const selectedEnd = new Date(end);
    if (
      !Number.isFinite(+selectedStart) ||
      !Number.isFinite(+selectedEnd) ||
      selectedEnd <= selectedStart
    ) {
      toast({
        variant: "destructive",
        title: "End time must be after start time",
      });
      return;
    }
    if (calendarId === "local" && !isSameDay(selectedStart, selectedEnd)) {
      toast({
        variant: "destructive",
        title:
          "Choose a connected calendar for an event spanning multiple days",
      });
      return;
    }
    const allDay = calendarId !== "local" && isAllDay;
    const finalStart = allDay
      ? new Date(
          Date.UTC(
            selectedStart.getFullYear(),
            selectedStart.getMonth(),
            selectedStart.getDate()
          )
        )
      : selectedStart;
    const finalEnd = allDay
      ? new Date(
          Date.UTC(
            selectedEnd.getFullYear(),
            selectedEnd.getMonth(),
            selectedEnd.getDate() + 1
          )
        )
      : selectedEnd;

    try {
      if (calendarId === "local") {
        await createBlock.mutateAsync({
          title: trimmed,
          startTime: finalStart,
          endTime: finalEnd,
        });
      } else
        await createMutation.mutateAsync({
          calendarId,
          rangeFrom,
          rangeTo,
          payload: {
            title: trimmed,
            location: location.trim() || null,
            startTime: finalStart,
            endTime: finalEnd,
            isAllDay: allDay,
            timezone: allDay
              ? null
              : Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        });
      if (calendarId !== "local") toast({ title: "Event created" });
      onClose();
    } catch {
      // Mutation hook handled the toast.
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="ev-title" className="sr-only">
          Event title
        </Label>
        <Input
          id="ev-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Event title"
          autoFocus
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {Number.isFinite(+new Date(start)) && Number.isFinite(+new Date(end))
          ? `${format(new Date(start), "EEE, MMM d · h:mm a")} – ${format(new Date(end), isSameDay(new Date(start), new Date(end)) ? "h:mm a" : "MMM d · h:mm a")}`
          : "Choose a start and end time"}
      </p>
      <div className="space-y-2">
        <Label htmlFor="ev-cal">Calendar</Label>
        <Select value={calendarId} onValueChange={setCalendarId}>
          <SelectTrigger id="ev-cal">
            <SelectValue placeholder="Select calendar" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="local">Open Sunsama</SelectItem>
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

      {expanded && (
        <div className="space-y-3 border-t pt-3">
          <div className="space-y-1">
            <Label htmlFor="ev-start">Start</Label>
            <Input
              id="ev-start"
              type="datetime-local"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="ev-end">End</Label>
            <Input
              id="ev-end"
              type="datetime-local"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              required
            />
          </div>
          {calendarId !== "local" && (
            <>
              <div className="flex items-center justify-between">
                <Label htmlFor="ev-allday" className="text-sm font-medium">
                  All-day
                </Label>
                <Switch
                  id="ev-allday"
                  checked={isAllDay}
                  onCheckedChange={setIsAllDay}
                  disabled={pending}
                />
              </div>

              <Label htmlFor="ev-location">Location</Label>
              <Input
                id="ev-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Add location"
              />
            </>
          )}
        </div>
      )}

      <DialogFooter>
        <Button
          type="button"
          variant="ghost"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? "Fewer options" : "More options"}
        </Button>
        <Button
          type="submit"
          disabled={!title.trim() || !calendarId || pending}
        >
          {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {pending ? "Saving..." : "Save"}
        </Button>
      </DialogFooter>
    </form>
  );
}
