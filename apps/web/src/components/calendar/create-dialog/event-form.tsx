import * as React from "react";
import { startOfDay, endOfDay } from "date-fns";
import { Loader2 } from "lucide-react";
import {
  useCalendars,
  useCalendarAccounts,
  useCreateCalendarEvent,
} from "@/hooks/useCalendars";
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

/**
 * Calendar event sub-form for the create dialog. Picks among the
 * user's writable calendars (Google for now) and writes through to
 * the provider via the same path the detail-sheet edit uses.
 */
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
          !isCalendarReadOnlyForUi(provider, c.isReadOnly) && c.isEnabled
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
  const [isAllDay, setIsAllDay] = React.useState(false);

  React.useEffect(() => {
    setTitle("");
    setLocation("");
    setIsAllDay(false);
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
    // For all-day events the iCal convention is UTC midnight of the
    // covered date(s) with end exclusive. The user's slot click gave
    // us a timed startTime — project to UTC midnight of that local
    // date and set end = next-day UTC midnight (single-day all-day).
    const finalStart = isAllDay
      ? new Date(
          Date.UTC(
            startTime.getFullYear(),
            startTime.getMonth(),
            startTime.getDate()
          )
        )
      : startTime;
    const finalEnd = isAllDay
      ? new Date(
          Date.UTC(
            startTime.getFullYear(),
            startTime.getMonth(),
            startTime.getDate() + 1
          )
        )
      : endTime;

    try {
      await createMutation.mutateAsync({
        calendarId,
        rangeFrom,
        rangeTo,
        payload: {
          title: trimmed,
          location: location.trim() || null,
          startTime: finalStart,
          endTime: finalEnd,
          isAllDay,
          timezone: isAllDay
            ? null
            : Intl.DateTimeFormat().resolvedOptions().timeZone,
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

      <div className="flex items-center justify-between">
        <Label htmlFor="ev-allday" className="text-sm font-medium">
          All-day
        </Label>
        <Switch
          id="ev-allday"
          checked={isAllDay}
          onCheckedChange={setIsAllDay}
          disabled={createMutation.isPending}
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
