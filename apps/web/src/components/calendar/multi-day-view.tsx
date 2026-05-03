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
import { layoutOverlappingItems, type LayoutResult } from "./event-layout";
import {
  useMultiDayEventDrag,
  type EventDragMode,
} from "./multi-day-event-drag";

/**
 * When N items overlap we split the column into N sub-columns, but we
 * leave a tiny gap between them so they remain visually distinct rather
 * than one continuous block. Tuned so 7-day week view at 50px/col still
 * shows separation.
 */
const COLUMN_GAP_PCT = 1; // %

/** Fallback when a layout entry isn't found (defensive). */
const DEFAULT_LAYOUT: LayoutResult = { lane: 0, columnCount: 1 };

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
  /**
   * Fired after the user drops an external event at a new time on the
   * same day (no cross-column drag). The parent translates this into
   * a PATCH /calendar-events/:id via useUpdateCalendarEvent.
   */
  onExternalEventReschedule?: (
    eventId: string,
    startTime: Date,
    endTime: Date
  ) => void;
  /** Editability gate per event — read-only events stay click-only. */
  externalEventCanEdit?: (event: CalendarEvent) => boolean;
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

/** A multi-day all-day event laid out as a horizontal bar in the banner. */
interface AllDaySpan {
  event: CalendarEvent;
  /** First visible-day index this event covers. */
  startIdx: number;
  /** Last visible-day index this event covers (inclusive). */
  endIdx: number;
  /** Number of days the bar spans (endIdx - startIdx + 1). */
  length: number;
}

/** YYYY-MM-DD via local components — for cell dates the user sees. */
function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** YYYY-MM-DD via UTC components — for all-day events stored at UTC midnight. */
function utcDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
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
  layout,
  onClick,
  onMouseDownDrag,
  onMouseDownResize,
  isDragging = false,
  justEndedDrag = false,
}: {
  event: CalendarEvent;
  displayDate: Date;
  layout: LayoutResult;
  onClick?: () => void;
  /** mousedown on the body — starts a move drag if defined. */
  onMouseDownDrag?: (e: React.MouseEvent) => void;
  /** mousedown on a resize handle — pass the edge. */
  onMouseDownResize?: (e: React.MouseEvent, edge: "top" | "bottom") => void;
  /** True while THIS event is mid-drag — dim it. */
  isDragging?: boolean;
  /** Suppress the trailing click after a real drag completes. */
  justEndedDrag?: boolean;
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

  // Split-column geometry: leftmost lane sits at lane/N of column width.
  const widthPct = 100 / layout.columnCount - COLUMN_GAP_PCT;
  const leftPct = (100 / layout.columnCount) * layout.lane;

  const cursor = isDragging
    ? "cursor-grabbing"
    : onMouseDownDrag
      ? "cursor-grab"
      : "cursor-pointer";

  // Trim resize-handle space from the chip body when handles render
  // (so the chip's middle area is clearly the drag/click target).
  const continuesAcrossDay =
    startTime < startOfDay(displayDate) || endTime > endOfDay(displayDate);
  const showResizeHandles = !!onMouseDownResize && !continuesAcrossDay;

  return (
    <div
      data-external-event
      className={cn(
        "absolute z-[5] my-0.5 rounded border-l-[2px] hover:brightness-90 hover:z-[15] transition-all overflow-hidden px-1 py-0.5",
        cursor,
        isDragging && "opacity-50"
      )}
      style={{
        top: `${top}px`,
        height: `${Math.max(height - 2, 16)}px`,
        left: `${leftPct}%`,
        width: `${widthPct}%`,
        backgroundColor: hexToRgba(color, 0.12),
        borderColor: hexToRgba(color, 0.55),
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Browsers fire click after mouseup even for drags — bail if
        // the DnD hook says we just dragged.
        if (justEndedDrag) return;
        onClick?.();
      }}
      onMouseDown={(e) => {
        if (!onMouseDownDrag) return;
        // Resize handles stop propagation; if we got here, body drag.
        if ((e.target as HTMLElement).dataset.resize) return;
        onMouseDownDrag(e);
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
      {showResizeHandles && (
        <div
          data-resize="top"
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDownResize?.(e, "top");
          }}
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-foreground/10 rounded-t"
        />
      )}
      {showResizeHandles && (
        <div
          data-resize="bottom"
          onMouseDown={(e) => {
            e.stopPropagation();
            onMouseDownResize?.(e, "bottom");
          }}
          className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-foreground/10 rounded-b"
        />
      )}
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
  layout,
  onClick,
}: {
  block: TimeBlock;
  displayDate: Date;
  layout: LayoutResult;
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

  const widthPct = 100 / layout.columnCount - COLUMN_GAP_PCT;
  const leftPct = (100 / layout.columnCount) * layout.lane;

  return (
    <div
      data-time-block
      className="absolute z-10 my-0.5 rounded cursor-pointer hover:brightness-90 hover:z-20 transition-all overflow-hidden px-1 py-0.5"
      style={{
        top: `${top}px`,
        height: `${Math.max(height - 2, 16)}px`,
        left: `${leftPct}%`,
        width: `${widthPct}%`,
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
  onExternalEventReschedule,
  externalEventCanEdit,
  className,
}: MultiDayViewProps) {
  // Per-column drag state. The hook tracks which day was grabbed, so
  // vertical drag stays scoped to that column. Cross-column drag
  // (Mon → Wed) is intentionally out of scope — see hook docstring.
  const drag = useMultiDayEventDrag({
    onCommit: (eventId, startTime, endTime, _mode: EventDragMode) => {
      onExternalEventReschedule?.(eventId, startTime, endTime);
    },
  });
  const hours = React.useMemo(() => generateHours(), []);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  // Tick the now-indicator once per minute so it advances. Without
  // this, `new Date()` was captured at render time and the red line
  // froze until something else triggered a re-render.
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

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

  // Per-day timed-event + block layout. Both kinds compete for column
  // real estate (they overlap visually), so we pack them into the same
  // lane assignment. The combined-id keys make the result lookup
  // unambiguous when an event id and a block id collide.
  const dayLayouts = React.useMemo(() => {
    return dayBuckets.map((bucket, i) => {
      const day = days[i]!;
      const dayStart = startOfDay(day);
      const dayEnd = endOfDay(day);
      const items = [
        ...bucket.timed.map((e) => {
          const s = new Date(e.startTime);
          const en = new Date(e.endTime);
          return {
            id: `event:${e.id}`,
            start: s < dayStart ? dayStart : s,
            end: en > dayEnd ? dayEnd : en,
          };
        }),
        ...bucket.blocks.map((b) => {
          const s = new Date(b.startTime);
          const en = new Date(b.endTime);
          return {
            id: `block:${b.id}`,
            start: s < dayStart ? dayStart : s,
            end: en > dayEnd ? dayEnd : en,
          };
        }),
      ];
      return layoutOverlappingItems(items);
    });
  }, [dayBuckets, days]);

  // All-day banner: render multi-day spans as single horizontal bars
  // across the columns they cover, with lane stacking when bars overlap.
  // We deduplicate the events first (an event spans multiple day buckets
  // but is a single entity), then compute each event's start-day-index +
  // span-length within the visible range.
  const allDaySpans = React.useMemo(() => {
    const seen = new Map<string, CalendarEvent>();
    for (const b of dayBuckets) {
      for (const e of b.allDay) seen.set(e.id, e);
    }
    if (seen.size === 0) {
      return { lanes: [] as Array<Array<AllDaySpan>>, count: 0 };
    }
    type Span = AllDaySpan;
    const spans: Span[] = [];
    for (const event of seen.values()) {
      const startDateStr = utcDateString(new Date(event.startTime));
      const endDateStr = utcDateString(new Date(event.endTime));
      // Find first / last visible-day index covered by this event.
      let firstIdx = -1;
      let lastIdx = -1;
      for (let i = 0; i < days.length; i++) {
        const d = localDateString(days[i]!);
        // Event covers day d if startDateStr ≤ d < endDateStr
        if (d >= startDateStr && d < endDateStr) {
          if (firstIdx === -1) firstIdx = i;
          lastIdx = i;
        }
      }
      if (firstIdx === -1) continue;
      spans.push({
        event,
        startIdx: firstIdx,
        endIdx: lastIdx,
        length: lastIdx - firstIdx + 1,
      });
    }
    // Lane-pack: sort by start day asc, then by length desc so longer
    // spans claim leftmost lane. Greedy-place into the first lane whose
    // last placed span ends before this one starts.
    spans.sort((a, b) => {
      if (a.startIdx !== b.startIdx) return a.startIdx - b.startIdx;
      return b.length - a.length;
    });
    const lanes: Array<Array<Span>> = [];
    for (const s of spans) {
      let placed = false;
      for (const lane of lanes) {
        const last = lane[lane.length - 1]!;
        if (last.endIdx < s.startIdx) {
          lane.push(s);
          placed = true;
          break;
        }
      }
      if (!placed) lanes.push([s]);
    }
    return { lanes, count: spans.length };
  }, [dayBuckets, days]);

  const hasAnyAllDay = allDaySpans.count > 0;

  // 7-column week view on a 360px phone leaves ~44px per column after the
  // hour gutter — enough for a single-letter day label and a 2-digit date.
  // 3-day view at the same width gets ~100px per column. Tighten typography
  // on the narrow case so headers and event chips stay readable.
  const isWeek = days.length >= 7;

  return (
    <div className={cn("flex h-full w-full min-w-0 flex-1 flex-col", className)}>
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
                {/* Week view at narrow widths shows single-letter
                    weekday (M T W T F S S) so headers don't overflow.
                    Other views always show 3-letter (SAT, SUN, MON). */}
                {isWeek ? (
                  <>
                    <span className="sm:hidden">{format(day, "EEEEE")}</span>
                    <span className="hidden sm:inline">{format(day, "EEE")}</span>
                  </>
                ) : (
                  format(day, "EEE")
                )}
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

      {/* All-day banner row — multi-day events render as a single bar
          spanning the columns they cover, lane-stacked when bars overlap.
          Layered: a faint gridline of empty day cells underneath, the
          spanning bars positioned absolutely on top. */}
      {hasAnyAllDay && (
        <div className="flex flex-shrink-0 border-b bg-muted/30">
          <div className="w-12 sm:w-14 flex-shrink-0 border-r flex items-start justify-end px-2 py-1">
            <span className="text-[10px] font-medium text-muted-foreground">
              All day
            </span>
          </div>
          <div
            className="flex-1 relative"
            style={{
              // Each lane is one row of bars. 22px keeps text legible
              // and matches Google Calendar's banner-row density.
              height: `${allDaySpans.lanes.length * 22 + 4}px`,
            }}
          >
            {/* Background day-cell separators — match the timeline below */}
            <div className="absolute inset-0 flex">
              {days.map((day, i) => (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "flex-1 border-r min-w-0",
                    i === days.length - 1 && "border-r-0"
                  )}
                />
              ))}
            </div>
            {/* Spanning bars */}
            {allDaySpans.lanes.flatMap((lane, laneIdx) =>
              lane.map((span) => {
                const color = span.event.calendar?.color ?? "#6B7280";
                const widthPct = (span.length / days.length) * 100;
                const leftPct = (span.startIdx / days.length) * 100;
                return (
                  <button
                    key={span.event.id}
                    data-all-day-event
                    onClick={(e) => {
                      e.stopPropagation();
                      onExternalEventClick?.(span.event);
                    }}
                    className="absolute text-left rounded px-1.5 py-0.5 text-[11px] truncate hover:brightness-90 cursor-pointer"
                    style={{
                      top: `${laneIdx * 22 + 2}px`,
                      left: `calc(${leftPct}% + 2px)`,
                      width: `calc(${widthPct}% - 4px)`,
                      height: "20px",
                      backgroundColor: hexToRgba(color, 0.18),
                      borderLeft: `3px solid ${hexToRgba(color, 0.7)}`,
                    }}
                    title={span.event.title}
                  >
                    {span.event.title}
                  </button>
                );
              })
            )}
          </div>
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
                  // `data-day-column` lets the drag hook find this
                  // column's bounding rect via element.closest().
                  data-day-column
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
                      style={{ top: calculateYFromTime(now) }}
                    >
                      <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shadow-sm" />
                      <div className="h-0.5 flex-1 bg-red-500 shadow-sm" />
                    </div>
                  )}

                  {/* Time blocks (above events) */}
                  {bucket.blocks.map((block) => {
                    const layout =
                      dayLayouts[i]?.get(`block:${block.id}`) ??
                      DEFAULT_LAYOUT;
                    return (
                      <MultiDayBlock
                        key={block.id}
                        block={block}
                        displayDate={day}
                        layout={layout}
                        onClick={
                          onBlockClick ? () => onBlockClick(block) : undefined
                        }
                      />
                    );
                  })}

                  {/* External calendar events */}
                  {bucket.timed.map((event) => {
                    const layout =
                      dayLayouts[i]?.get(`event:${event.id}`) ??
                      DEFAULT_LAYOUT;
                    const canEdit =
                      externalEventCanEdit?.(event) ?? false;
                    const isThisDragging =
                      drag.dragState?.eventId === event.id;
                    return (
                      <MultiDayEvent
                        key={event.id}
                        event={event}
                        displayDate={day}
                        layout={layout}
                        onClick={
                          onExternalEventClick
                            ? () => onExternalEventClick(event)
                            : undefined
                        }
                        onMouseDownDrag={
                          canEdit && onExternalEventReschedule
                            ? (e) =>
                                drag.startDrag(
                                  event.id,
                                  day,
                                  new Date(event.startTime),
                                  new Date(event.endTime),
                                  "move",
                                  e
                                )
                            : undefined
                        }
                        onMouseDownResize={
                          canEdit && onExternalEventReschedule
                            ? (e, edge) =>
                                drag.startDrag(
                                  event.id,
                                  day,
                                  new Date(event.startTime),
                                  new Date(event.endTime),
                                  edge === "top"
                                    ? "resize-top"
                                    : "resize-bottom",
                                  e
                                )
                            : undefined
                        }
                        isDragging={isThisDragging}
                        justEndedDrag={drag.justEndedDrag}
                      />
                    );
                  })}

                  {/* Live drop preview while this column owns the
                      active drag — a dashed outline at the new
                      position so the user sees where they'll land.
                      Hidden once dragState clears on mouseup. */}
                  {drag.dragState &&
                    drag.dragState.dayDate.toDateString() ===
                      day.toDateString() &&
                    drag.dragState.moved && (() => {
                      const previewTop = calculateYFromTime(
                        drag.dragState.previewStart
                      );
                      const previewMins =
                        (drag.dragState.previewEnd.getTime() -
                          drag.dragState.previewStart.getTime()) /
                        60000;
                      const previewHeight = (previewMins / 60) * HOUR_HEIGHT;
                      return (
                        <div
                          className="absolute inset-x-1 z-30 rounded border-2 border-dashed border-primary bg-primary/10 pointer-events-none flex items-start justify-start px-1.5 py-0.5"
                          style={{
                            top: `${previewTop}px`,
                            height: `${Math.max(previewHeight, 16)}px`,
                          }}
                        >
                          <span className="text-[10px] font-semibold text-primary">
                            {format(drag.dragState.previewStart, "h:mm a")} –{" "}
                            {format(drag.dragState.previewEnd, "h:mm a")}
                          </span>
                        </div>
                      );
                    })()}
                </div>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
