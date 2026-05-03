import * as React from "react";
import { format, isSameDay } from "date-fns";
import {
  CalendarDays,
  Clock,
  ExternalLink as ExternalLinkIcon,
  MapPin,
  Plus,
  AlignLeft,
} from "lucide-react";
import type { CalendarEvent } from "@open-sunsama/types";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";

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
}

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  if (
    Number.isNaN(r) ||
    Number.isNaN(g) ||
    Number.isNaN(b)
  ) {
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
      // 0-day span — degenerate; show start only.
      return format(start, "EEEE, MMMM d, yyyy");
    }
    // Convert to a real Date object in local TZ for the formatter, then
    // back the end date off by 1 day so it reads as the inclusive last day.
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
 * Read-only detail sheet for an external calendar event.
 *
 * This deliberately replaces the previous behaviour of opening the
 * provider's web UI on click. The user wanted to interact with their
 * events inside the app — see the details, navigate to the source if
 * they want, or convert to a task — without bouncing out to Google.
 *
 * Editing/deleting requires a write-back path to the upstream provider,
 * which is shipped in a follow-up. For now the sheet exposes:
 *
 *   - title, time range, location, description, attending status
 *   - the source calendar (with its provider color)
 *   - "Open in Google / Outlook / iCloud" — explicit secondary action
 *   - "Create task from event" — explicit primary action that hands
 *     the event off to the AddTaskModal pre-filled
 */
export function CalendarEventDetailSheet({
  event,
  open,
  onOpenChange,
  onCreateTask,
}: CalendarEventDetailSheetProps) {
  // Render nothing until first open so the sheet doesn't allocate DOM
  // before a user actually clicks an event.
  const seenOpenRef = React.useRef(false);
  if (open) seenOpenRef.current = true;
  if (!seenOpenRef.current) return null;

  const color = event?.calendar?.color ?? "#6B7280";
  const calendarName = event?.calendar?.name ?? "External calendar";

  const handleOpenInProvider = () => {
    if (event?.htmlLink) {
      window.open(event.htmlLink, "_blank", "noopener,noreferrer");
    }
  };

  const handleCreateTask = () => {
    if (event && onCreateTask) {
      onCreateTask(event);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-3">
          <div className="flex items-start gap-2">
            <div
              className="mt-1 h-3 w-3 flex-shrink-0 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            <SheetTitle className="text-base font-semibold leading-snug">
              {event?.title || "Untitled event"}
            </SheetTitle>
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
            {/* Time */}
            <div className="flex items-start gap-3 text-sm">
              <Clock className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
              <div className="text-foreground/90">{formatEventTime(event)}</div>
            </div>

            {/* Location */}
            {event.location && (
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div className="text-foreground/90 break-words">
                  {event.location}
                </div>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="flex items-start gap-3 text-sm">
                <AlignLeft className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <div
                  className="prose prose-sm max-w-none text-foreground/90"
                  // Description from external calendars is HTML in some
                  // providers (Google in particular). We render it as
                  // text — full HTML rendering would require sanitising
                  // through the same path as Tiptap content does and
                  // isn't worth the surface area for read-only display.
                >
                  {event.description}
                </div>
              </div>
            )}

            <div className="border-t pt-5 space-y-2">
              <Button
                onClick={handleCreateTask}
                disabled={!onCreateTask}
                className="w-full justify-start"
                variant="default"
              >
                <Plus className="mr-2 h-4 w-4" />
                Create task from event
              </Button>
              {event.htmlLink && (
                <Button
                  onClick={handleOpenInProvider}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <ExternalLinkIcon className="mr-2 h-4 w-4" />
                  Open in calendar provider
                </Button>
              )}
            </div>

            {/* Footer note: editing comes in a follow-up */}
            <p className="pt-2 text-[11px] text-muted-foreground/70">
              Editing and deleting events sync back to your calendar
              provider — coming soon.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
