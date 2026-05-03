import * as React from "react";
import {
  format,
  isSameDay,
  setHours,
  addMinutes,
  startOfDay,
  endOfDay,
} from "date-fns";
import type {
  TimeBlock as TimeBlockType,
  CalendarEvent,
} from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  useTimeBlocks,
  useMoveTimeBlock,
  useCascadeResizeTimeBlock,
} from "@/hooks/useTimeBlocks";
import {
  useCalendarEvents,
  useCalendars,
  useCalendarAccounts,
} from "@/hooks/useCalendars";
import { TimeBlock, TimeBlockPreview } from "@/components/calendar/time-block";
import { ExternalEvent } from "@/components/calendar/external-event";
import { CalendarEventDetailSheet } from "@/components/calendar/calendar-event-detail-sheet";
import {
  layoutOverlappingItems,
  type LayoutResult,
} from "@/components/calendar/event-layout";
import {
  useCalendarDnd,
  HOUR_HEIGHT,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  SNAP_INTERVAL,
  calculateYFromTime,
  calculateTimeFromY,
  snapToInterval,
} from "@/hooks/useCalendarDnd";

const DEFAULT_LAYOUT: LayoutResult = { lane: 0, columnCount: 1 };

const PROVIDERS_WITH_WRITE_BACK = new Set(["google", "outlook"]);

interface KanbanCalendarPanelProps {
  date: Date;
  className?: string;
  onBlockClick?: (block: TimeBlockType) => void;
  onEditBlock?: (block: TimeBlockType) => void;
  onTimeSlotClick?: (date: Date, startTime: Date, endTime: Date) => void;
  onViewTask?: (taskId: string) => void;
}

/**
 * Interactive calendar panel for the kanban board right side.
 * Shows time blocks for the active day with full drag/drop/resize functionality.
 */
export function KanbanCalendarPanel({
  date,
  className,
  onBlockClick,
  onEditBlock,
  onTimeSlotClick,
  onViewTask,
}: KanbanCalendarPanelProps) {
  const dateString = format(date, "yyyy-MM-dd");
  const { data: timeBlocks = [] } = useTimeBlocks({ date: dateString });
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // External calendar events for the same day. Use the day's local
  // start / end as the API range — matches CalendarView's convention
  // so the React-Query cache key is shared and we don't double-fetch.
  const dayStart = React.useMemo(() => startOfDay(date), [date]);
  const dayEnd = React.useMemo(() => endOfDay(date), [date]);
  const fromDate = dayStart.toISOString();
  const toDate = dayEnd.toISOString();
  const { data: calendarEvents = [] } = useCalendarEvents(fromDate, toDate);

  // For the read-only-calendar gating in the detail sheet.
  const { data: calendarsList = [] } = useCalendars();
  const { data: calendarAccounts = [] } = useCalendarAccounts();
  const calendarReadOnlyById = React.useMemo(() => {
    const providerByAccount = new Map<string, string>();
    for (const a of calendarAccounts) providerByAccount.set(a.id, a.provider);
    const m = new Map<string, boolean>();
    for (const c of calendarsList) {
      const provider = providerByAccount.get(c.accountId);
      const writable =
        !!provider &&
        PROVIDERS_WITH_WRITE_BACK.has(provider) &&
        !c.isReadOnly;
      m.set(c.id, !writable);
    }
    return m;
  }, [calendarsList, calendarAccounts]);

  // External-event detail sheet state — opens when the user clicks a
  // calendar event in the panel. Self-contained inside the panel so the
  // parent route doesn't need wiring.
  const [selectedExternalEvent, setSelectedExternalEvent] =
    React.useState<CalendarEvent | null>(null);
  const [externalEventSheetOpen, setExternalEventSheetOpen] =
    React.useState(false);

  const handleExternalEventClick = React.useCallback((event: CalendarEvent) => {
    setSelectedExternalEvent(event);
    setExternalEventSheetOpen(true);
  }, []);

  const handleExternalEventSheetOpenChange = React.useCallback(
    (next: boolean) => {
      setExternalEventSheetOpen(next);
      if (!next) {
        setTimeout(() => setSelectedExternalEvent(null), 200);
      }
    },
    []
  );

  // Mutations
  const moveTimeBlock = useMoveTimeBlock();
  const cascadeResizeTimeBlock = useCascadeResizeTimeBlock();

  // Calendar DnD hook
  const {
    dragState,
    dropPreview,
    isDragging,
    justEndedDrag,
    timelineRef,
    startBlockDrag,
    startBlockResize,
    updateDrag,
    endDrag,
    cancelDrag,
  } = useCalendarDnd(date, {
    onBlockMove: (blockId, startTime, endTime) => {
      moveTimeBlock.mutate({ id: blockId, startTime, endTime });
    },
    onBlockResize: (blockId, startTime, endTime) => {
      cascadeResizeTimeBlock.mutate({ id: blockId, startTime, endTime });
    },
  });

  const hours = React.useMemo(
    () =>
      Array.from(
        { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
        (_, i) => i + TIMELINE_START_HOUR
      ),
    []
  );

  const now = new Date();
  const isToday = isSameDay(date, now);

  // Current time position - updates every minute
  const [currentTimePosition, setCurrentTimePosition] = React.useState<
    number | null
  >(null);

  React.useEffect(() => {
    const updateCurrentTime = () => {
      if (isToday) {
        setCurrentTimePosition(calculateYFromTime(new Date()));
      } else {
        setCurrentTimePosition(null);
      }
    };

    updateCurrentTime();
    const interval = setInterval(updateCurrentTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [isToday]);

  // Filter blocks for this day
  const dayBlocks = React.useMemo(() => {
    return timeBlocks.filter((block) =>
      isSameDay(new Date(block.startTime), date)
    );
  }, [timeBlocks, date]);

  // Bucket the visible-range events into timed (drawn on the timeline)
  // and all-day (drawn in the banner above). Same shape as the main
  // CalendarView's per-day bucketer — kept inline because the panel is
  // single-day and doesn't need the multi-day spanning logic.
  const { timedEvents, allDayEvents } = React.useMemo(() => {
    const targetCalendarDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const timed: CalendarEvent[] = [];
    const allDay: CalendarEvent[] = [];
    for (const event of calendarEvents) {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);
      if (event.isAllDay) {
        // iCal/Google convention: all-day events stored at UTC midnight.
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
    return { timedEvents: timed, allDayEvents: allDay };
  }, [calendarEvents, date, dayStart, dayEnd]);

  // Side-by-side overlap layout — same algorithm as the main timeline,
  // packing timed events and time blocks into shared lanes.
  const itemLayouts = React.useMemo(() => {
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
  }, [timedEvents, dayBlocks, dayStart, dayEnd]);

  // Auto-scroll to current time on mount and date change
  React.useEffect(() => {
    if (scrollContainerRef.current) {
      const scrollTo = isToday
        ? Math.max(0, (now.getHours() - 1) * HOUR_HEIGHT)
        : 8 * HOUR_HEIGHT; // Default to 8 AM
      scrollContainerRef.current.scrollTop = scrollTo;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateString, isToday]);

  // Mouse event handlers for drag
  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    if (isDragging) {
      updateDrag(e.clientY, rect);
    }
  };

  const handleTimelineMouseUp = () => {
    if (isDragging) {
      endDrag();
    }
  };

  const handleTimelineMouseLeave = () => {
    // Don't cancel drag on mouse leave - let it continue
  };

  // Global mouse events for drag
  React.useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseUp = () => endDrag();
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (timelineRef.current) {
        updateDrag(e.clientY, timelineRef.current.getBoundingClientRect());
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelDrag();
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("mousemove", handleGlobalMouseMove);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDragging, endDrag, cancelDrag, updateDrag, timelineRef]);

  // Block drag handlers
  const handleBlockDragStart = (block: TimeBlockType, e: React.MouseEvent) => {
    e.preventDefault();
    startBlockDrag(block, e.clientY);
  };

  const handleBlockResizeStart = (
    block: TimeBlockType,
    edge: "top" | "bottom",
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    startBlockResize(block, edge, e.clientY);
  };

  // Handle click on empty time slot
  const handleTimeSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger if clicking on a time block, an external calendar
    // event, or an all-day banner — those have their own click handlers.
    const target = e.target as HTMLElement;
    if (
      target.closest("[data-time-block]") ||
      target.closest("[data-external-event]") ||
      target.closest("[data-all-day-event]")
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

    // Calculate Y relative to the timeline content
    const relativeY = e.clientY - rect.top;

    // Calculate time from Y position
    const clickedTime = calculateTimeFromY(relativeY, date);
    const snappedStartTime = snapToInterval(clickedTime, SNAP_INTERVAL);
    const snappedEndTime = addMinutes(snappedStartTime, 60);

    onTimeSlotClick(date, snappedStartTime, snappedEndTime);
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full w-[280px] bg-background border-l",
        className
      )}
    >
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {format(date, "EEE")}
        </div>
        <div className="text-lg font-semibold">{format(date, "MMM d")}</div>
      </div>

      {/* All-day banner — only renders when there's at least one all-day
          event for this day. Compact one-line chips with a colored
          left-border, click to open the same detail sheet. */}
      {allDayEvents.length > 0 && (
        <div className="flex-shrink-0 border-b bg-muted/30 px-2 py-1 space-y-0.5">
          {allDayEvents.map((event) => {
            const color = event.calendar?.color ?? "#6B7280";
            return (
              <button
                key={event.id}
                type="button"
                data-all-day-event
                onClick={(e) => {
                  e.stopPropagation();
                  handleExternalEventClick(event);
                }}
                className="block w-full text-left rounded px-1.5 py-0.5 text-[11px] truncate hover:brightness-90 cursor-pointer"
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
      )}

      {/* Timeline */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div className="flex" style={{ minHeight: hours.length * HOUR_HEIGHT }}>
          {/* Time Labels Column */}
          <div className="w-10 flex-shrink-0 sticky left-0 bg-background z-10">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-border/30"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-1 text-[10px] text-muted-foreground/70">
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
              isDragging ? "cursor-grabbing" : "cursor-default",
              isToday && "bg-primary/[0.02]"
            )}
            onMouseMove={handleTimelineMouseMove}
            onMouseUp={handleTimelineMouseUp}
            onMouseLeave={handleTimelineMouseLeave}
            onClick={handleTimeSlotClick}
          >
            {/* Hour grid lines */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b border-border/20 hover:bg-accent/30 transition-colors"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}

            {/* Half-hour lines */}
            {hours.map((hour) => (
              <div
                key={`${hour}-half`}
                className="absolute left-0 right-0 border-b border-border/10"
                style={{
                  top:
                    (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                }}
              />
            ))}

            {/* Current time indicator - thin red line with dot */}
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 z-30 pointer-events-none flex items-center"
                style={{ top: currentTimePosition }}
              >
                <div className="h-2 w-2 rounded-full bg-red-500 -ml-1 shadow-sm" />
                <div className="h-px flex-1 bg-red-500" />
              </div>
            )}

            {/* External calendar events — drawn behind time blocks so
                user-created blocks always layer on top. */}
            {timedEvents.map((event) => (
              <ExternalEvent
                key={event.id}
                event={event}
                displayDate={date}
                layout={
                  itemLayouts.get(`event:${event.id}`) ?? DEFAULT_LAYOUT
                }
                onClick={() => handleExternalEventClick(event)}
              />
            ))}

            {/* Time blocks */}
            {dayBlocks.map((block) => (
              <TimeBlock
                key={block.id}
                block={block}
                layout={itemLayouts.get(`block:${block.id}`) ?? DEFAULT_LAYOUT}
                onClick={() => onBlockClick?.(block)}
                onEditBlock={() => onEditBlock?.(block)}
                onDragStart={(e) => handleBlockDragStart(block, e)}
                onResizeStart={(e, edge) =>
                  handleBlockResizeStart(block, edge, e)
                }
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
                {...(dragState.block?.color
                  ? { color: dragState.block.color }
                  : {})}
              />
            )}
          </div>
        </div>
      </div>

      {/* External calendar event detail sheet (read + edit + delete) */}
      <CalendarEventDetailSheet
        event={selectedExternalEvent}
        open={externalEventSheetOpen}
        onOpenChange={handleExternalEventSheetOpenChange}
        rangeFrom={fromDate}
        rangeTo={toDate}
        calendarReadOnly={
          selectedExternalEvent
            ? (calendarReadOnlyById.get(
                selectedExternalEvent.calendarId
              ) ?? true)
            : true
        }
      />
    </div>
  );
}

/**
 * Convert hex color to rgba string. Same shape used by the all-day
 * banner chips — not exported because the panel is the only consumer.
 */
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  if (Number.isNaN(r)) return `rgba(107, 114, 128, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
