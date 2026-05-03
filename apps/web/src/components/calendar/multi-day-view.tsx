import * as React from "react";
import {
  format,
  startOfDay,
  endOfDay,
  isSameDay,
  isToday,
  isWeekend,
  differenceInMinutes,
} from "date-fns";
import type { CalendarEvent, TimeBlock } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui";
import {
  HOUR_HEIGHT,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  calculateYFromTime,
} from "@/hooks/useCalendarDnd";

interface MultiDayViewProps {
  /** Ordered list of dates to render as columns */
  days: Date[];
  /**
   * All events visible across the range. The component splits them per
   * day internally — callers should pass the unfiltered list returned
   * from `useCalendarEvents`.
   */
  calendarEvents: CalendarEvent[];
  /** Time blocks across the range (may include blocks for any day) */
  timeBlocks: TimeBlock[];
  isLoading?: boolean;
  onExternalEventClick?: (event: CalendarEvent) => void;
  onBlockClick?: (block: TimeBlock) => void;
  className?: string;
}

function generateHours(): number[] {
  return Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
    (_, i) => i + TIMELINE_START_HOUR
  );
}

interface DayColumnEvents {
  timed: CalendarEvent[];
  allDay: CalendarEvent[];
  blocks: TimeBlock[];
}

function bucketEventsForDay(
  date: Date,
  events: CalendarEvent[],
  blocks: TimeBlock[]
): DayColumnEvents {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  // All-day events follow the iCal convention: backend stores them at UTC
  // midnight for the date the event covers. To compare apples-to-apples,
  // we project the cell's *local calendar date* to a UTC-midnight string
  // using the local Y/M/D components, then string-compare against the
  // event's UTC-derived YYYY-MM-DD. Mixing local-format on one side and
  // UTC-format on the other would silently drop events for users west
  // of UTC at the day boundary.
  const targetCalendarDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

  const timed: CalendarEvent[] = [];
  const allDay: CalendarEvent[] = [];

  for (const event of events) {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);

    if (event.isAllDay) {
      const startDateStr = `${start.getUTCFullYear()}-${String(start.getUTCMonth() + 1).padStart(2, "0")}-${String(start.getUTCDate()).padStart(2, "0")}`;
      const endDateStr = `${end.getUTCFullYear()}-${String(end.getUTCMonth() + 1).padStart(2, "0")}-${String(end.getUTCDate()).padStart(2, "0")}`;
      if (
        targetCalendarDate >= startDateStr &&
        targetCalendarDate < endDateStr
      ) {
        allDay.push(event);
      }
    } else if (start < dayEnd && end > dayStart) {
      timed.push(event);
    }
  }

  const dayBlocks = blocks.filter((b) =>
    isSameDay(new Date(b.startTime), date)
  );

  return { timed, allDay, blocks: dayBlocks };
}

/**
 * Compact event chip used inside multi-day columns. We don't reuse the
 * single-day `ExternalEvent` because that's tuned for the much wider
 * day-view column — at week-view widths the time row and tooltip
 * affordances would overflow.
 */
function MultiDayEvent({
  event,
  displayDate,
  onClick,
}: {
  event: CalendarEvent;
  displayDate: Date;
  onClick?: () => void;
}) {
  const startTime = new Date(event.startTime);
  const endTime = new Date(event.endTime);
  const dayStart = startOfDay(displayDate);
  const dayEnd = endOfDay(displayDate);
  const renderStart = startTime < dayStart ? dayStart : startTime;
  const renderEnd = endTime > dayEnd ? dayEnd : endTime;
  const top = calculateYFromTime(renderStart);
  const durationMins = differenceInMinutes(renderEnd, renderStart);
  const height = (durationMins / 60) * HOUR_HEIGHT;
  const color = event.calendar?.color ?? "#6B7280";

  return (
    <div
      data-external-event
      className="absolute left-0.5 right-0.5 z-[5] my-0.5 rounded border-l-[2px] cursor-pointer hover:brightness-90 transition-all overflow-hidden px-1 py-0.5"
      style={{
        top: `${top}px`,
        height: `${Math.max(height - 2, 16)}px`,
        backgroundColor: hexToRgba(color, 0.12),
        borderColor: hexToRgba(color, 0.55),
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.stopPropagation();
          onClick?.();
        }
      }}
      aria-label={`${event.title} at ${format(startTime, "h:mm a")}`}
    >
      <p className="truncate text-[10px] font-medium text-foreground/85">
        {event.title}
      </p>
      {height >= 28 && (
        <p className="truncate text-[9px] text-muted-foreground/70">
          {format(startTime, "h:mm a")}
        </p>
      )}
    </div>
  );
}

function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  if (Number.isNaN(r)) return `rgba(107, 114, 128, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function MultiDayBlock({
  block,
  displayDate,
  onClick,
}: {
  block: TimeBlock;
  displayDate: Date;
  onClick?: () => void;
}) {
  const startTime = new Date(block.startTime);
  const endTime = new Date(block.endTime);
  const dayStart = startOfDay(displayDate);
  const dayEnd = endOfDay(displayDate);
  const renderStart = startTime < dayStart ? dayStart : startTime;
  const renderEnd = endTime > dayEnd ? dayEnd : endTime;
  const top = calculateYFromTime(renderStart);
  const durationMins = differenceInMinutes(renderEnd, renderStart);
  const height = (durationMins / 60) * HOUR_HEIGHT;
  const color = block.color ?? "#3B82F6";

  return (
    <div
      data-time-block
      className="absolute left-0.5 right-0.5 z-10 my-0.5 rounded cursor-pointer hover:brightness-90 transition-all overflow-hidden px-1 py-0.5"
      style={{
        top: `${top}px`,
        height: `${Math.max(height - 2, 16)}px`,
        backgroundColor: hexToRgba(color, 0.85),
        color: "white",
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      role="button"
      tabIndex={0}
      aria-label={`${block.title} at ${format(startTime, "h:mm a")}`}
    >
      <p className="truncate text-[10px] font-semibold leading-tight">
        {block.title}
      </p>
      {height >= 28 && (
        <p className="truncate text-[9px] text-white/80">
          {format(startTime, "h:mm")}–{format(endTime, "h:mm a")}
        </p>
      )}
    </div>
  );
}

/**
 * Multi-day calendar view (3-Day and Week).
 * Renders N day columns side-by-side sharing one hour-axis gutter.
 */
export function MultiDayView({
  days,
  calendarEvents,
  timeBlocks,
  isLoading = false,
  onExternalEventClick,
  onBlockClick,
  className,
}: MultiDayViewProps) {
  const hours = React.useMemo(() => generateHours(), []);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to ~2 hours before now on mount
  React.useEffect(() => {
    const scrollPosition = Math.max(
      0,
      (new Date().getHours() - 2) * HOUR_HEIGHT
    );
    const viewport = scrollAreaRef.current?.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (viewport) viewport.scrollTop = scrollPosition;
  }, []);

  const dayBuckets = React.useMemo(
    () => days.map((d) => bucketEventsForDay(d, calendarEvents, timeBlocks)),
    [days, calendarEvents, timeBlocks]
  );

  // Aggregate all-day events row across columns
  const hasAnyAllDay = dayBuckets.some((b) => b.allDay.length > 0);

  // 7-column week view on a 360px phone leaves ~44px per column after the
  // hour gutter — enough for a single-letter day label and a 2-digit date.
  // 3-day view at the same width gets ~100px per column. Tighten typography
  // on the narrow case so headers and event chips stay readable.
  const isWeek = days.length >= 7;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Day-of-week headers */}
      <div className="flex flex-shrink-0 border-b bg-background">
        {/* Empty gutter to align with hour axis */}
        <div className="w-12 sm:w-14 flex-shrink-0 border-r" />
        {days.map((day) => {
          const today = isToday(day);
          const weekend = isWeekend(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "flex-1 px-1 sm:px-2 py-1.5 text-center border-r last:border-r-0 min-w-0",
                today && "bg-primary/5",
                weekend && !today && "bg-muted/30"
              )}
            >
              <p
                className={cn(
                  "uppercase tracking-wide",
                  isWeek ? "text-[10px] sm:text-[11px]" : "text-[11px]",
                  today
                    ? "text-primary font-semibold"
                    : "text-muted-foreground"
                )}
              >
                {/* On the week view at narrow widths, show single-letter
                    weekday (M T W T F S S) so headers don't overflow. */}
                <span className={cn(isWeek && "sm:hidden")}>
                  {format(day, "EEEEE")}
                </span>
                <span className={cn(isWeek ? "hidden sm:inline" : "")}>
                  {format(day, "EEE")}
                </span>
              </p>
              <p
                className={cn(
                  "font-semibold leading-tight",
                  isWeek ? "text-sm sm:text-lg" : "text-base sm:text-lg",
                  today && "text-primary"
                )}
              >
                {format(day, "d")}
              </p>
            </div>
          );
        })}
      </div>

      {/* All-day banner row */}
      {hasAnyAllDay && (
        <div className="flex flex-shrink-0 border-b bg-muted/30">
          <div className="w-12 sm:w-14 flex-shrink-0 border-r flex items-start justify-end px-2 py-1">
            <span className="text-[10px] font-medium text-muted-foreground">
              All day
            </span>
          </div>
          {dayBuckets.map((bucket, i) => (
            <div
              key={days[i]!.toISOString()}
              className="flex-1 border-r last:border-r-0 px-1 py-1 space-y-0.5 min-h-[28px] min-w-0"
            >
              {bucket.allDay.map((event) => {
                const color = event.calendar?.color ?? "#6B7280";
                return (
                  <button
                    key={event.id}
                    data-all-day-event
                    onClick={(e) => {
                      e.stopPropagation();
                      onExternalEventClick?.(event);
                    }}
                    className="block w-full text-left rounded px-1.5 py-0.5 text-[10px] truncate hover:brightness-90 cursor-pointer"
                    style={{
                      backgroundColor: hexToRgba(color, 0.15),
                      borderLeft: `2px solid ${hexToRgba(color, 0.6)}`,
                    }}
                    title={event.title}
                  >
                    {event.title}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground animate-pulse">
            Loading…
          </p>
        </div>
      )}

      {/* Scrollable timeline */}
      {!isLoading && (
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="flex relative">
            {/* Hour axis gutter */}
            <div
              className="w-12 sm:w-14 flex-shrink-0 border-r relative"
              style={{
                height: `${(TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * HOUR_HEIGHT}px`,
              }}
            >
              {hours.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 px-1.5 text-[10px] text-muted-foreground text-right -translate-y-1/2"
                  style={{
                    top: `${(hour - TIMELINE_START_HOUR) * HOUR_HEIGHT}px`,
                  }}
                >
                  {hour === 0
                    ? ""
                    : format(new Date(2000, 0, 1, hour, 0), "h a")}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {dayBuckets.map((bucket, i) => {
              const day = days[i]!;
              const today = isToday(day);
              const weekend = isWeekend(day);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 relative border-r last:border-r-0 min-w-0",
                    today && "bg-primary/[0.02]",
                    weekend && !today && "bg-muted/20"
                  )}
                  style={{
                    height: `${(TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1) * HOUR_HEIGHT}px`,
                  }}
                >
                  {/* Hour grid lines — drawn at the BOTTOM of each hour
                      slot to match the single-day Timeline. Drawing at the
                      top would offset the grid by one row from Timeline. */}
                  {hours.map((hour) => (
                    <div
                      key={hour}
                      className="absolute left-0 right-0 border-b border-border/30 pointer-events-none"
                      style={{
                        top: `${(hour - TIMELINE_START_HOUR + 1) * HOUR_HEIGHT}px`,
                      }}
                    />
                  ))}
                  {/* Half-hour grid lines — fainter, mid-hour. */}
                  {hours.map((hour) => (
                    <div
                      key={`${hour}-half`}
                      className="absolute left-0 right-0 border-b border-border/15 pointer-events-none"
                      style={{
                        top: `${(hour - TIMELINE_START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2}px`,
                      }}
                    />
                  ))}

                  {/* Now indicator on today's column */}
                  {today && (
                    <div
                      className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                      style={{ top: calculateYFromTime(new Date()) }}
                    >
                      <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shadow-sm" />
                      <div className="h-0.5 flex-1 bg-red-500 shadow-sm" />
                    </div>
                  )}

                  {/* Time blocks (above events) */}
                  {bucket.blocks.map((block) => (
                    <MultiDayBlock
                      key={block.id}
                      block={block}
                      displayDate={day}
                      onClick={
                        onBlockClick ? () => onBlockClick(block) : undefined
                      }
                    />
                  ))}

                  {/* External calendar events */}
                  {bucket.timed.map((event) => (
                    <MultiDayEvent
                      key={event.id}
                      event={event}
                      displayDate={day}
                      onClick={
                        onExternalEventClick
                          ? () => onExternalEventClick(event)
                          : undefined
                      }
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
