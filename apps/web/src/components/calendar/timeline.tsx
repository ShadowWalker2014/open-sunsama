import * as React from "react";
import {
  format,
  isSameDay,
  setHours,
  addMinutes,
  startOfDay,
  endOfDay,
} from "date-fns";
import type { TimeBlock as TimeBlockType, CalendarEvent } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui";
import { TimeBlock, TimeBlockPreview } from "./time-block";
import { ExternalEvent, AllDayEvent } from "./external-event";
import { layoutOverlappingItems, type LayoutResult } from "./event-layout";

const DEFAULT_LAYOUT: LayoutResult = { lane: 0, columnCount: 1 };
import {
  HOUR_HEIGHT,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  SNAP_INTERVAL,
  calculateYFromTime,
  calculateTimeFromY,
  snapToInterval,
  type DropPreview,
  type DragState,
} from "@/hooks/useCalendarDnd";

interface TimelineProps {
  date: Date;
  timeBlocks: TimeBlockType[];
  calendarEvents?: CalendarEvent[];
  isLoading?: boolean;
  dragState: DragState | null;
  dropPreview: DropPreview | null;
  justEndedDrag?: boolean;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  onBlockClick?: (block: TimeBlockType) => void;
  onEditBlock?: (block: TimeBlockType) => void;
  onBlockDragStart?: (block: TimeBlockType, e: React.MouseEvent) => void;
  onBlockResizeStart?: (block: TimeBlockType, edge: "top" | "bottom", e: React.MouseEvent) => void;
  onViewTask?: (taskId: string) => void;
  /** Fired when the user clicks an external (Google/Outlook/iCloud) event */
  onExternalEventClick?: (event: CalendarEvent) => void;
  /** Fired when the user starts dragging an editable external event */
  onExternalEventDragStart?: (event: CalendarEvent, e: React.MouseEvent) => void;
  /** Fired when the user starts resizing an editable external event */
  onExternalEventResizeStart?: (
    event: CalendarEvent,
    edge: "top" | "bottom",
    e: React.MouseEvent
  ) => void;
  /**
   * Lookup of `eventId → can-write` so editable events get drag handles
   * and read-only events stay click-only.
   */
  externalEventCanEdit?: (event: CalendarEvent) => boolean;
  onTimelineMouseMove?: (e: React.MouseEvent) => void;
  onTimelineMouseUp?: () => void;
  onTimelineMouseLeave?: () => void;
  onTimeSlotClick?: (startTime: Date, endTime: Date) => void;
  className?: string;
}

/**
 * Generate hour markers for the timeline
 */
function generateHours(): number[] {
  return Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
    (_, i) => i + TIMELINE_START_HOUR
  );
}

/**
 * Timeline component displaying a 24-hour day view with time blocks
 */
export function Timeline({
  date,
  timeBlocks,
  calendarEvents = [],
  isLoading = false,
  dragState,
  dropPreview,
  justEndedDrag = false,
  timelineRef,
  onBlockClick,
  onEditBlock,
  onBlockDragStart,
  onBlockResizeStart,
  onViewTask,
  onExternalEventClick,
  onExternalEventDragStart,
  onExternalEventResizeStart,
  externalEventCanEdit,
  onTimelineMouseMove,
  onTimelineMouseUp,
  onTimelineMouseLeave,
  onTimeSlotClick,
  className,
}: TimelineProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const hours = React.useMemo(() => generateHours(), []);
  // Tick once a minute so the now-indicator actually advances down the
  // timeline. Without this, `now` was captured at first render and the
  // red line froze in place until something else triggered a render.
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);
  const isToday = isSameDay(date, now);

  // Calculate current time indicator position
  const currentTimePosition = React.useMemo(() => {
    if (!isToday) return null;
    return calculateYFromTime(now);
  }, [isToday, now]);

  // Auto-scroll to current time on initial load
  React.useEffect(() => {
    if (isToday && scrollAreaRef.current) {
      // Scroll to 2 hours before current time, or start of day
      const scrollPosition = Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT);
      
      // Find the scroll viewport within ScrollArea
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = scrollPosition;
      }
    }
  }, [isToday]); // Only run on mount or when isToday changes

  // Filter blocks for this day
  const dayBlocks = React.useMemo(() => {
    return timeBlocks.filter((block) =>
      isSameDay(new Date(block.startTime), date)
    );
  }, [timeBlocks, date]);

  // Filter and separate external calendar events for this day.
  //
  // A multi-day event (e.g. a 3-day conference May 1 → May 3) should appear
  // on every day it overlaps, not just the start day — the previous code
  // checked `isSameDay(startTime, date)` which dropped it from the
  // intermediate days. Use a real overlap check instead.
  //
  // All-day events are stored at UTC midnight (Google's convention), so
  // their startTime in a non-UTC viewer timezone may render as the
  // previous evening. We treat the date portion of the UTC string as the
  // event's "calendar date" and check membership against that span.
  const { timedEvents, allDayEvents } = React.useMemo(() => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    // The user's local "calendar date" — the date string they think of as
    // "today" in the UI. We compare it against the UTC-stored date span of
    // each all-day event. This works because all-day events are stored
    // detached from any wall-clock timezone (per iCal/Google convention),
    // so a "May 2" all-day event is "May 2" regardless of viewer TZ.
    const targetCalendarDate = format(date, "yyyy-MM-dd");

    const timed: CalendarEvent[] = [];
    const allDay: CalendarEvent[] = [];

    for (const event of calendarEvents) {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);

      if (event.isAllDay) {
        // The iCal/Google convention stores an all-day event with
        // start = midnight UTC of the calendar date and end = exclusive
        // next-day midnight. The event covers [startDateStr, endDateStr).
        const startDateStr = start.toISOString().slice(0, 10);
        const endDateStr = end.toISOString().slice(0, 10);
        if (
          targetCalendarDate >= startDateStr &&
          targetCalendarDate < endDateStr
        ) {
          allDay.push(event);
        }
      } else {
        // Timed event: include if it overlaps the user's local day window.
        if (start < dayEnd && end > dayStart) {
          timed.push(event);
        }
      }
    }

    return { timedEvents: timed, allDayEvents: allDay };
  }, [calendarEvents, date]);

  // Side-by-side overlap layout. Timed events and time blocks compete
  // for column real estate, so we lane-pack them together — matches
  // Google Calendar's "split the column when N items overlap" behavior.
  const itemLayouts = React.useMemo(() => {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    const items = [
      ...timedEvents.map((e) => {
        const s = new Date(e.startTime);
        const en = new Date(e.endTime);
        return {
          id: `event:${e.id}`,
          start: s < dayStart ? dayStart : s,
          end: en > dayEnd ? dayEnd : en,
        };
      }),
      ...dayBlocks.map((b) => {
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
  }, [timedEvents, dayBlocks, date]);

  // Handle click on empty time slot
  const handleTimeSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger if clicking on a time block, an external calendar
    // event, or any all-day banner — those have their own click handlers
    // and the time-slot click would otherwise also open the "create time
    // block" dialog as a side-effect.
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-time-block]') ||
      target.closest('[data-external-event]') ||
      target.closest('[data-all-day-event]')
    ) {
      return;
    }

    // Don't trigger during drag operations
    if (dragState) {
      return;
    }

    // Don't trigger if we just ended a drag/resize operation
    if (justEndedDrag) {
      return;
    }

    if (!onTimeSlotClick) return;

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    // Calculate Y relative to the timeline content (no scroll offset needed - click is relative to visible area)
    const relativeY = e.clientY - rect.top;
    
    // Calculate time from Y position
    const clickedTime = calculateTimeFromY(relativeY, date);
    const snappedStartTime = snapToInterval(clickedTime, SNAP_INTERVAL);
    const snappedEndTime = addMinutes(snappedStartTime, 60);

    onTimeSlotClick(snappedStartTime, snappedEndTime);
  };

  return (
    <div className={cn("flex-1 overflow-hidden flex flex-col", className)}>
      {/* All-day events banner */}
      {allDayEvents.length > 0 && (
        <div className="flex-shrink-0 border-b bg-muted/30 px-2 py-1.5 space-y-1">
          <p className="text-xs font-medium text-muted-foreground mb-1">All day</p>
          <div className="flex flex-wrap gap-1">
            {allDayEvents.map((event) => (
              <AllDayEvent
                key={event.id}
                event={event}
                onClick={
                  onExternalEventClick
                    ? () => onExternalEventClick(event)
                    : undefined
                }
              />
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="h-full flex-1" ref={scrollAreaRef}>
        <div
          className="flex"
          style={{ minHeight: hours.length * HOUR_HEIGHT }}
        >
          {/* Time Labels Column */}
          <div className="w-12 sm:w-16 flex-shrink-0 border-r bg-muted/30">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-border/50"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-1 sm:right-2 text-[10px] sm:text-xs text-muted-foreground font-medium">
                  {format(setHours(date, hour), "ha").toLowerCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline Content */}
          <div
            ref={timelineRef}
            className={cn(
              "relative flex-1",
              dragState ? "cursor-grabbing" : "cursor-default",
              "touch-pan-y",
              isToday && "bg-accent/5"
            )}
            onMouseMove={onTimelineMouseMove}
            onMouseUp={onTimelineMouseUp}
            onMouseLeave={onTimelineMouseLeave}
            onClick={handleTimeSlotClick}
          >
            {/* Hour grid lines */}
            {hours.map((hour) => (
              <div
                key={hour}
                className={cn(
                  "border-b border-border/30",
                  "hover:bg-accent/30 transition-colors"
                )}
                style={{ height: HOUR_HEIGHT }}
              />
            ))}

            {/* Half-hour grid lines */}
            {hours.map((hour) => (
              <div
                key={`${hour}-half`}
                className="absolute left-0 right-0 border-b border-border/15"
                style={{ top: (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
              />
            ))}

            {/* Current time indicator */}
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 z-30 flex items-center pointer-events-none"
                style={{ top: currentTimePosition }}
              >
                <div className="h-3 w-3 rounded-full bg-red-500 -ml-1.5 shadow-sm" />
                <div className="h-0.5 flex-1 bg-red-500 shadow-sm" />
              </div>
            )}

            {/* Loading skeleton */}
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                <div className="animate-pulse text-sm text-muted-foreground">
                  Loading...
                </div>
              </div>
            )}

            {/* External calendar events (rendered behind time blocks) */}
            {!isLoading &&
              timedEvents.map((event) => {
                const canEdit = externalEventCanEdit?.(event) ?? false;
                const isThisDragging =
                  dragState?.type === "move-event" &&
                  dragState.eventId === event.id;
                return (
                  <ExternalEvent
                    key={event.id}
                    event={event}
                    displayDate={date}
                    layout={
                      itemLayouts.get(`event:${event.id}`) ?? DEFAULT_LAYOUT
                    }
                    onClick={
                      onExternalEventClick
                        ? () => onExternalEventClick(event)
                        : undefined
                    }
                    onDragStart={
                      canEdit && onExternalEventDragStart
                        ? (e) => onExternalEventDragStart(event, e)
                        : undefined
                    }
                    onResizeStart={
                      canEdit && onExternalEventResizeStart
                        ? (e, edge) =>
                            onExternalEventResizeStart(event, edge, e)
                        : undefined
                    }
                    isDragging={isThisDragging}
                  />
                );
              })}

            {/* Time blocks */}
            {!isLoading &&
              dayBlocks.map((block) => (
                <TimeBlock
                  key={block.id}
                  block={block}
                  layout={itemLayouts.get(`block:${block.id}`) ?? DEFAULT_LAYOUT}
                  onClick={() => onBlockClick?.(block)}
                  onEditBlock={() => onEditBlock?.(block)}
                  onDragStart={(e) => onBlockDragStart?.(block, e)}
                  onResizeStart={(e, edge) => onBlockResizeStart?.(block, edge, e)}
                  onViewTask={onViewTask}
                  isDragging={dragState?.blockId === block.id}
                />
              ))}

            {/* Drop preview */}
            {dropPreview && dragState && (
              <TimeBlockPreview
                title={
                  dragState.task?.title ||
                  dragState.block?.title ||
                  "New Time Block"
                }
                startTime={dropPreview.startTime}
                endTime={dropPreview.endTime}
                top={dropPreview.top}
                height={dropPreview.height}
                {...(dragState.block?.color ? { color: dragState.block.color } : {})}
              />
            )}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
