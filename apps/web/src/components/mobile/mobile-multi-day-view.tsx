import * as React from "react";
import {
  endOfDay,
  format,
  isSameDay,
  isToday,
  startOfDay,
} from "date-fns";
import type { CalendarEvent, TimeBlock } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui";
import {
  HOUR_HEIGHT,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
} from "@/hooks/calendar-dnd-utils";
import { useCalendarEvents } from "@/hooks/useCalendars";
import { useTimeBlocksForDateRange } from "@/hooks/useTimeBlocks";

interface MobileMultiDayViewProps {
  /** Days to show side by side (3 for the 3-day view, 7 for the week). */
  days: Date[];
  /** Tap a column header to drop into the single-day timeline for that date. */
  onSelectDate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onBlockClick: (block: TimeBlock) => void;
  className?: string;
}

/** Minutes from the top of the timeline for a given instant on `day`. */
function minutesFromTop(day: Date, time: Date) {
  const start = startOfDay(day);
  const mins = (time.getTime() - start.getTime()) / 60000;
  return mins - TIMELINE_START_HOUR * 60;
}

/** Chip geometry: clamped to the visible window, with a readable minimum. */
function chipStyle(day: Date, start: Date, end: Date) {
  const topMins = Math.max(minutesFromTop(day, start), 0);
  const endMins = Math.min(
    minutesFromTop(day, end),
    (TIMELINE_END_HOUR + 1 - TIMELINE_START_HOUR) * 60
  );
  const height = Math.max(((endMins - topMins) / 60) * HOUR_HEIGHT, 16);
  return { top: (topMins / 60) * HOUR_HEIGHT, height };
}

/**
 * The 3-day and week modes of the mobile calendar.
 *
 * Standard phone-calendar treatment: one shared hour gutter, a narrow column
 * per day, and compact chips you tap to open. Editing gestures (drag to
 * reschedule, tap-empty-slot to create) stay in the 1-day timeline where
 * there's room for them — tapping a day header jumps there.
 */
export function MobileMultiDayView({
  days,
  onSelectDate,
  onEventClick,
  onBlockClick,
  className,
}: MobileMultiDayViewProps) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const hours = React.useMemo(
    () =>
      Array.from(
        { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
        (_, i) => i + TIMELINE_START_HOUR
      ),
    []
  );

  const rangeStart = days[0] ?? new Date();
  const rangeEnd = days[days.length - 1] ?? rangeStart;

  const { data: events = [] } = useCalendarEvents(
    startOfDay(rangeStart).toISOString(),
    endOfDay(rangeEnd).toISOString()
  );
  const { data: blocks = [] } = useTimeBlocksForDateRange(
    startOfDay(rangeStart),
    endOfDay(rangeEnd)
  );

  // Scroll to the working day (08:00) on mount, like the day view does.
  React.useEffect(() => {
    const viewport = scrollRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (viewport) {
      viewport.scrollTop = Math.max((8 - TIMELINE_START_HOUR) * HOUR_HEIGHT, 0);
    }
  }, []);

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col", className)}>
      {/* Day headers — tap one to open that day full-width */}
      <div className="flex flex-shrink-0 border-b bg-background">
        <div className="w-10 flex-shrink-0 border-r bg-muted/30" />
        {days.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={cn(
              "flex-1 border-r border-border/40 py-1.5 text-center last:border-r-0 active:bg-muted",
              isToday(day) && "bg-primary/5"
            )}
          >
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              {format(day, "EEE")}
            </div>
            <div
              className={cn(
                "mx-auto mt-0.5 grid h-6 w-6 place-items-center rounded-full text-[13px] font-semibold tabular-nums",
                isToday(day) && "bg-primary text-primary-foreground"
              )}
            >
              {format(day, "d")}
            </div>
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex" style={{ minHeight: hours.length * HOUR_HEIGHT }}>
          {/* Hour gutter */}
          <div className="w-10 flex-shrink-0 border-r bg-muted/30">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-border/50"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-1.5 right-1 text-[9px] font-medium tabular-nums text-muted-foreground">
                  {format(new Date(2000, 0, 1, hour), "ha").toLowerCase()}
                </span>
              </div>
            ))}
          </div>

          {/* One column per day */}
          {days.map((day) => {
            const dayEvents = events.filter(
              (event) =>
                !event.isAllDay && isSameDay(new Date(event.startTime), day)
            );
            const dayBlocks = blocks.filter((block) =>
              isSameDay(new Date(block.startTime), day)
            );
            const nowTop = isToday(day)
              ? (minutesFromTop(day, new Date()) / 60) * HOUR_HEIGHT
              : null;

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "relative flex-1 border-r border-border/40 last:border-r-0",
                  isToday(day) && "bg-primary/[0.03]"
                )}
              >
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="border-b border-border/30"
                    style={{ height: HOUR_HEIGHT }}
                  />
                ))}

                {dayBlocks.map((block) => {
                  const { top, height } = chipStyle(
                    day,
                    new Date(block.startTime),
                    new Date(block.endTime)
                  );
                  return (
                    <button
                      key={block.id}
                      onClick={() => onBlockClick(block)}
                      style={{ top, height }}
                      className="absolute inset-x-0.5 z-10 overflow-hidden rounded border-l-2 border-primary bg-primary/15 px-1 text-left text-[10px] leading-tight text-foreground active:brightness-95"
                    >
                      <span className="line-clamp-2">{block.title}</span>
                    </button>
                  );
                })}

                {dayEvents.map((event) => {
                  const { top, height } = chipStyle(
                    day,
                    new Date(event.startTime),
                    new Date(event.endTime)
                  );
                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      style={{ top, height }}
                      className="absolute inset-x-0.5 z-[9] overflow-hidden rounded border-l-2 border-muted-foreground/40 bg-muted/70 px-1 text-left text-[10px] leading-tight text-foreground active:brightness-95"
                    >
                      <span className="line-clamp-2">{event.title}</span>
                    </button>
                  );
                })}

                {nowTop !== null && (
                  <div
                    className="pointer-events-none absolute inset-x-0 z-20 flex items-center"
                    style={{ top: nowTop }}
                  >
                    <div className="-ml-1 h-1.5 w-1.5 rounded-full bg-red-500" />
                    <div className="h-px flex-1 bg-red-500" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
