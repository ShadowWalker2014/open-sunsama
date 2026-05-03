import * as React from "react";
import { format, isSameDay } from "date-fns";
import {
  CalendarDays,
  Clock,
  MapPin,
  Plus,
  AlignLeft,
  Pencil,
  Trash2,
  Loader2,
  Repeat,
} from "lucide-react";
import type { CalendarEvent } from "@open-sunsama/types";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Input,
  Textarea,
  Label,
  Switch,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui";
import {
  useUpdateCalendarEvent,
  useDeleteCalendarEvent,
} from "@/hooks/useCalendars";
import { toast } from "@/hooks/use-toast";

interface CalendarEventDetailSheetProps {
  event: CalendarEvent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /**
   * Optional handler invoked when the user clicks "Create task from
   * event". The parent typically opens the AddTaskModal pre-filled with
   * the event title and a scheduledDate matching the event's start.
   */
  onCreateTask?: (event: CalendarEvent) => void;
  /**
   * The from/to range the event is currently visible in. Required for
   * the optimistic-update path so the right cache key is targeted.
   */
  rangeFrom: string;
  rangeTo: string;
  /**
   * Whether the calendar this event lives on is read-only. We pull this
   * from the calendar metadata and pass it down so the edit affordances
   * are hidden for events the user can't actually mutate (subscribed
   * calendars, holidays, etc.).
   */
  calendarReadOnly?: boolean;
  /**
   * Provider name (e.g. "google", "outlook", "icloud") for the
   * event's calendar — used to branch the recurring-event
   * disclosure copy. Google and Outlook treat a PATCH on an
   * instance id as an exception (this instance only), but iCloud's
   * CalDAV PUT replaces the whole VEVENT including RRULE → the
   * change hits the entire series. Without this prop the
   * disclosure would lie to iCloud users.
   */
  calendarProvider?: string;
}

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return `rgba(107, 114, 128, ${alpha})`;
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function formatEventTime(event: CalendarEvent): string {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);

  if (event.isAllDay) {
    // All-day events are stored at UTC midnight; their "calendar date"
    // is the UTC date portion. End is exclusive (next-day midnight).
    const startDateStr = start.toISOString().slice(0, 10);
    const endDateStr = end.toISOString().slice(0, 10);
    if (startDateStr === endDateStr) {
      return format(start, "EEEE, MMMM d, yyyy");
    }
    const inclusiveEnd = new Date(end.getTime() - 24 * 60 * 60 * 1000);
    if (startDateStr === inclusiveEnd.toISOString().slice(0, 10)) {
      return format(start, "EEEE, MMMM d, yyyy");
    }
    return `${format(start, "MMM d, yyyy")} → ${format(inclusiveEnd, "MMM d, yyyy")}`;
  }

  if (isSameDay(start, end)) {
    return `${format(start, "EEEE, MMMM d, yyyy")} · ${format(start, "h:mm a")} – ${format(end, "h:mm a")}`;
  }
  return `${format(start, "MMM d, h:mm a")} → ${format(end, "MMM d, h:mm a")}`;
}

/**
 * <input type="datetime-local"> takes a "YYYY-MM-DDTHH:mm" string in the
 * USER's local timezone — no timezone offset. We have a real Date; pull
 * its local components and format.
 */
function toLocalInputValue(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * Reverse of `toLocalInputValue` — datetime-local input is local time.
 * `new Date("YYYY-MM-DDTHH:mm")` parses as local already, so we can
 * delegate to the Date constructor.
 */
function fromLocalInputValue(s: string): Date {
  return new Date(s);
}

/**
 * For all-day inputs we use type="date" which gives a "YYYY-MM-DD"
 * string. We project that back to UTC midnight so the value matches
 * the iCal storage convention.
 */
function fromAllDayInputValue(s: string): Date {
  // s is "YYYY-MM-DD"; appending Z gives an ISO UTC midnight.
  return new Date(`${s}T00:00:00Z`);
}

function toAllDayInputValue(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * UTC midnight projection of *today's local date* — used as the default
 * value for an empty all-day input when toggling. We pick today as the
 * sensible default if no value is present.
 */
function localMidnightTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
  );
}

interface EditableState {
  title: string;
  description: string;
  location: string;
  isAllDay: boolean;
  /** datetime-local string for timed events; date string for all-day */
  start: string;
  /** datetime-local string for timed events; date string for all-day */
  end: string;
}

function buildInitialState(event: CalendarEvent): EditableState {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  return {
    title: event.title,
    description: event.description ?? "",
    location: event.location ?? "",
    isAllDay: event.isAllDay,
    start: event.isAllDay
      ? toAllDayInputValue(start)
      : toLocalInputValue(start),
    end: event.isAllDay
      ? toAllDayInputValue(
          // For all-day, the input shows the LAST inclusive day (not the
          // exclusive next-day boundary the storage uses). Subtract 1d.
          new Date(end.getTime() - 24 * 60 * 60 * 1000)
        )
      : toLocalInputValue(end),
  };
}

/**
 * Detail sheet for an external calendar event with read + edit modes.
 *
 * View mode shows: title, time, location, description, calendar (color),
 * response status, and the secondary actions ("Open in provider",
 * "Create task from event"). For editable calendars an "Edit" button
 * flips the sheet into edit mode.
 *
 * Edit mode swaps in form controls for title, all-day toggle, start +
 * end, location, description. Save writes through to the upstream
 * provider; Cancel discards. Delete (with confirmation) sends a DELETE
 * upstream and clears the local row.
 */
export function CalendarEventDetailSheet({
  event,
  open,
  onOpenChange,
  onCreateTask,
  rangeFrom,
  rangeTo,
  calendarReadOnly = false,
  calendarProvider,
}: CalendarEventDetailSheetProps) {
  // Render nothing until first open so the sheet doesn't allocate DOM
  // before a user actually clicks an event.
  const seenOpenRef = React.useRef(false);
  if (open) seenOpenRef.current = true;

  const [isEditing, setIsEditing] = React.useState(false);
  const [editState, setEditState] = React.useState<EditableState | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = React.useState(false);

  const updateMutation = useUpdateCalendarEvent();
  const deleteMutation = useDeleteCalendarEvent();

  // When the sheet opens for a new event, reset edit state to view mode
  // and seed the editable values from the event.
  React.useEffect(() => {
    if (open && event) {
      setIsEditing(false);
      setEditState(buildInitialState(event));
    }
  }, [open, event?.id]);

  if (!seenOpenRef.current) return null;

  const color = event?.calendar?.color ?? "#6B7280";
  const calendarName = event?.calendar?.name ?? "External calendar";
  const canEdit = !!event && !calendarReadOnly;

  const handleCreateTask = () => {
    if (event && onCreateTask) {
      onCreateTask(event);
      onOpenChange(false);
    }
  };

  const handleStartEdit = () => {
    if (event) {
      setEditState(buildInitialState(event));
      setIsEditing(true);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    if (event) setEditState(buildInitialState(event));
  };

  const handleSave = async () => {
    if (!event || !editState) return;
    const trimmedTitle = editState.title.trim();
    if (!trimmedTitle) {
      toast({
        variant: "destructive",
        title: "Title required",
        description: "An event must have a title.",
      });
      return;
    }
    let startDate: Date;
    let endDate: Date;
    if (editState.isAllDay) {
      startDate = fromAllDayInputValue(editState.start);
      // Storage convention: end is the day AFTER the last covered day.
      const inclusiveEnd = fromAllDayInputValue(editState.end);
      endDate = new Date(inclusiveEnd.getTime() + 24 * 60 * 60 * 1000);
    } else {
      startDate = fromLocalInputValue(editState.start);
      endDate = fromLocalInputValue(editState.end);
    }
    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      toast({
        variant: "destructive",
        title: "Invalid date",
        description: "Please enter valid start and end dates.",
      });
      return;
    }
    if (endDate <= startDate) {
      toast({
        variant: "destructive",
        title: "End must be after start",
        description: "The event's end time has to come after its start.",
      });
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: event.id,
        rangeFrom,
        rangeTo,
        patch: {
          title: trimmedTitle,
          description: editState.description.trim() || null,
          location: editState.location.trim() || null,
          startTime: startDate,
          endTime: endDate,
          isAllDay: editState.isAllDay,
          // Use the browser's local TZ for timed events. iCal/Google
          // accept this and the user expects "I edited at 3pm local"
          // to round-trip as 3pm local on other devices.
          ...(editState.isAllDay
            ? {}
            : {
                timezone:
                  Intl.DateTimeFormat().resolvedOptions().timeZone,
              }),
        },
      });
      toast({ title: "Event updated" });
      setIsEditing(false);
    } catch {
      // Mutation hook already toasted the error and rolled back state.
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    try {
      await deleteMutation.mutateAsync({
        id: event.id,
        rangeFrom,
        rangeTo,
      });
      toast({ title: "Event deleted" });
      setConfirmDeleteOpen(false);
      onOpenChange(false);
    } catch {
      // hook handles toast + rollback
    }
  };

  const isMutating = updateMutation.isPending || deleteMutation.isPending;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader className="space-y-3">
            <div className="flex items-start gap-2">
              <div
                className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
                style={{ backgroundColor: color }}
                aria-hidden
              />
              {isEditing && editState ? (
                <Input
                  value={editState.title}
                  onChange={(e) =>
                    setEditState({ ...editState, title: e.target.value })
                  }
                  placeholder="Event title"
                  className="h-9 text-base font-semibold"
                  disabled={isMutating}
                  autoFocus
                />
              ) : (
                <SheetTitle className="text-base font-semibold leading-snug">
                  {event?.title || "Untitled event"}
                </SheetTitle>
              )}
            </div>
            <div
              className="flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium"
              style={{ backgroundColor: hexToRgba(color, 0.1) }}
            >
              <CalendarDays
                className="h-3 w-3"
                style={{ color }}
                aria-hidden
              />
              <span style={{ color: hexToRgba(color, 1) }}>{calendarName}</span>
              {event?.responseStatus && (
                <span className="ml-auto text-muted-foreground">
                  {event.responseStatus === "accepted" && "Going"}
                  {event.responseStatus === "declined" && "Declined"}
                  {event.responseStatus === "tentative" && "Maybe"}
                  {event.responseStatus === "needsAction" && "Awaiting reply"}
                </span>
              )}
            </div>
          </SheetHeader>

          {event && (
            <div className="mt-6 space-y-5">
              {/* Recurring-event disclosure. Behavior diverges by
                  provider:
                    - Google / Outlook: PATCH/DELETE on an instance id
                      creates an exception → "this instance only".
                    - iCloud (CalDAV): PUT replaces the master VEVENT
                      including RRULE → "this entire series". The
                      copy is amber/warning-tinted because the
                      blast radius is bigger than the user might
                      expect from a single-event UI affordance. */}
              {(event.recurringEventId || event.recurrenceRule) &&
                (calendarProvider === "icloud" ? (
                  <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2">
                    <Repeat
                      className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-600 dark:text-amber-400"
                      aria-hidden
                    />
                    <div className="text-xs">
                      <p className="font-medium text-amber-700 dark:text-amber-300">
                        Recurring event · entire series
                      </p>
                      <p className="mt-0.5 text-amber-700/80 dark:text-amber-300/80">
                        iCloud doesn't support per-instance edits —
                        any change here applies to every occurrence.
                        To edit just one, use the iCloud Calendar app.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-2 rounded-md border border-dashed border-border/60 bg-muted/30 px-3 py-2">
                    <Repeat
                      className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                    <div className="text-xs">
                      <p className="font-medium text-foreground/80">
                        Recurring event · this instance
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        Changes here apply to this occurrence only. To
                        edit the whole series, use the calendar provider.
                      </p>
                    </div>
                  </div>
                ))}
              {isEditing && editState ? (
                <EditForm
                  state={editState}
                  setState={setEditState}
                  disabled={isMutating}
                />
              ) : (
                <ViewBody event={event} />
              )}

              <div className="border-t pt-5 space-y-2">
                {isEditing ? (
                  <>
                    <Button
                      onClick={handleSave}
                      disabled={isMutating}
                      className="w-full justify-center"
                      variant="default"
                    >
                      {updateMutation.isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Save changes
                    </Button>
                    <Button
                      onClick={handleCancelEdit}
                      disabled={isMutating}
                      className="w-full justify-center"
                      variant="outline"
                    >
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    {canEdit && (
                      <Button
                        onClick={handleStartEdit}
                        className="w-full justify-start"
                        variant="default"
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit event
                      </Button>
                    )}
                    <Button
                      onClick={handleCreateTask}
                      disabled={!onCreateTask}
                      className="w-full justify-start"
                      variant={canEdit ? "outline" : "default"}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Create task from event
                    </Button>
                    {/* Intentionally no "Open in provider" link — the
                        in-app sheet supports full edit/delete and is
                        the canonical surface. Bouncing out to Google /
                        Outlook would split the user's mental model. */}
                    {canEdit && (
                      <Button
                        onClick={() => setConfirmDeleteOpen(true)}
                        className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                        variant="ghost"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete event
                      </Button>
                    )}
                  </>
                )}
              </div>

              {!canEdit && !isEditing && (
                <p className="pt-2 text-[11px] text-muted-foreground/70">
                  This calendar is read-only — events can't be edited or
                  deleted from here.
                </p>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete this event?</DialogTitle>
            <DialogDescription>
              This will remove the event from your calendar provider too.
              This action can't be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setConfirmDeleteOpen(false)}
              disabled={deleteMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ViewBody({ event }: { event: CalendarEvent }) {
  return (
    <>
      <div className="flex items-start gap-3 text-sm">
        <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
        <div className="text-foreground/90">{formatEventTime(event)}</div>
      </div>
      {event.location && (
        <div className="flex items-start gap-3 text-sm">
          <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="text-foreground/90 break-words">
            {event.location}
          </div>
        </div>
      )}
      {event.description && (
        <div className="flex items-start gap-3 text-sm">
          <AlignLeft className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
          <div className="prose prose-sm max-w-none text-foreground/90 whitespace-pre-wrap break-words">
            {event.description}
          </div>
        </div>
      )}
    </>
  );
}

function EditForm({
  state,
  setState,
  disabled,
}: {
  state: EditableState;
  setState: (next: EditableState) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="event-allday" className="text-sm font-medium">
          All-day
        </Label>
        <Switch
          id="event-allday"
          checked={state.isAllDay}
          disabled={disabled}
          onCheckedChange={(next) => {
            // Switching to/from all-day reformats the start/end inputs to
            // the right type. Crucially, do NOT round-trip through
            // UTC — toISOString.slice(0,10) shifts the date by one for
            // users far enough from UTC. Pull the YYYY-MM-DD prefix
            // straight from the local datetime-local string when going
            // timed → all-day, and re-anchor at 09:00 local when going
            // all-day → timed (sensible default for "what time?").
            if (next === state.isAllDay) return;
            const datePart = (s: string) => s.slice(0, 10);
            const newStart = next
              ? state.start
                ? datePart(state.start)
                : toAllDayInputValue(localMidnightTodayUtc())
              : state.start
                ? `${state.start}T09:00`
                : toLocalInputValue(new Date());
            const newEnd = next
              ? state.end
                ? datePart(state.end)
                : toAllDayInputValue(localMidnightTodayUtc())
              : state.end
                ? `${state.end}T10:00`
                : toLocalInputValue(new Date());
            setState({
              ...state,
              isAllDay: next,
              start: newStart,
              end: newEnd,
            });
          }}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="event-start" className="text-xs text-muted-foreground">
            Starts
          </Label>
          <Input
            id="event-start"
            type={state.isAllDay ? "date" : "datetime-local"}
            value={state.start}
            disabled={disabled}
            onChange={(e) => setState({ ...state, start: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="event-end" className="text-xs text-muted-foreground">
            Ends
          </Label>
          <Input
            id="event-end"
            type={state.isAllDay ? "date" : "datetime-local"}
            value={state.end}
            disabled={disabled}
            onChange={(e) => setState({ ...state, end: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-location" className="text-xs text-muted-foreground">
          Location
        </Label>
        <Input
          id="event-location"
          value={state.location}
          disabled={disabled}
          placeholder="Add location"
          onChange={(e) => setState({ ...state, location: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="event-description" className="text-xs text-muted-foreground">
          Description
        </Label>
        <Textarea
          id="event-description"
          value={state.description}
          disabled={disabled}
          placeholder="Add notes"
          rows={4}
          onChange={(e) => setState({ ...state, description: e.target.value })}
        />
      </div>
    </div>
  );
}
