import type { CalendarCreateAnchor } from "@/hooks/useDragToCreate";
import * as React from "react";
import { useDndMonitor, useDroppable, type DragMoveEvent } from "@dnd-kit/core";
import {
  format,
  isSameDay,
  setHours,
  addMinutes,
  differenceInMinutes,
  startOfDay,
  endOfDay,
} from "date-fns";
import type {
  TimeBlock as TimeBlockType,
  CalendarEvent,
  Task,
} from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { useTasks } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_PLANNED_MINS, projectTaskStarts } from "@/lib/task-projection";
import {
  useTimeBlocks,
  useCreateTimeBlock,
  useMoveTimeBlock,
  useCascadeResizeTimeBlock,
} from "@/hooks/useTimeBlocks";
import {
  useCalendarEvents,
  useCalendars,
  useCalendarAccounts,
  useUpdateCalendarEvent,
} from "@/hooks/useCalendars";
import { TimeBlock, TimeBlockPreview } from "@/components/calendar/time-block";
import { ExternalEvent } from "@/components/calendar/external-event";
import { CalendarEventDetailSheet } from "@/components/calendar/calendar-event-detail-sheet";
import {
  layoutOverlappingItems,
  type LayoutResult,
} from "@/components/calendar/event-layout";
import { isCalendarReadOnlyForUi } from "@/lib/calendar-providers";
import { useDragToCreate } from "@/hooks/useDragToCreate";
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

/** Block length for a task dropped from the board with no estimate. */
export const DEFAULT_DROP_MINS = 30;

/** Data the board's drag context reads when a card is dropped here. */
export interface CalendarDropData {
  type: "calendar";
  date: string;
  /** Snapped start time under the pointer's vertical position. */
  timeAt: (clientY: number) => Date;
}

/** The pointer's position during a dnd-kit drag. */
export function dragPointerY(event: {
  activatorEvent: Event | null;
  delta: { y: number };
}): number | null {
  const start = event.activatorEvent;
  if (!start) return null;
  const y =
    "touches" in start
      ? (start as TouchEvent).touches[0]?.clientY
      : (start as MouseEvent).clientY;
  return y === undefined ? null : y + event.delta.y;
}

// Imported from the central source so adding a new provider is a
// one-line change in one place.

interface KanbanCalendarPanelProps {
  date: Date;
  className?: string;
  onBlockClick?: (block: TimeBlockType) => void;
  onEditBlock?: (block: TimeBlockType) => void;
  onTimeSlotClick?: (date: Date, startTime: Date, endTime: Date, anchor?: CalendarCreateAnchor) => void;
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

  // For the read-only-calendar gating + recurring-event disclosure in
  // the detail sheet.
  const { data: calendarsList = [] } = useCalendars();
  const { data: calendarAccounts = [] } = useCalendarAccounts();
  const accountProviderById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const a of calendarAccounts) m.set(a.id, a.provider);
    return m;
  }, [calendarAccounts]);
  const calendarReadOnlyById = React.useMemo(() => {
    const m = new Map<string, boolean>();
    for (const c of calendarsList) {
      const provider = accountProviderById.get(c.accountId);
      m.set(c.id, isCalendarReadOnlyForUi(provider, c.isReadOnly));
    }
    return m;
  }, [calendarsList, accountProviderById]);
  const calendarProviderById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const c of calendarsList) {
      const provider = accountProviderById.get(c.accountId);
      if (provider) m.set(c.id, provider);
    }
    return m;
  }, [calendarsList, accountProviderById]);

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
  const createTimeBlock = useCreateTimeBlock();
  const projectedDragRef = React.useRef<Task | null>(null);
  const moveTimeBlock = useMoveTimeBlock();
  const cascadeResizeTimeBlock = useCascadeResizeTimeBlock();
  const updateCalendarEvent = useUpdateCalendarEvent();

  // Synced events move and resize on the board's calendar the same way
  // they do on the Calendar page: the new times are written to Google,
  // Outlook or iCloud.
  const writeEventTimes = React.useCallback(
    (eventId: string, startTime: Date, endTime: Date) => {
      updateCalendarEvent.mutate({
        id: eventId,
        rangeFrom: fromDate,
        rangeTo: toDate,
        patch: {
          startTime,
          endTime,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
      });
    },
    [updateCalendarEvent, fromDate, toDate]
  );

  const eventCanEdit = React.useCallback(
    (event: CalendarEvent) =>
      !event.isAllDay && !(calendarReadOnlyById.get(event.calendarId) ?? true),
    [calendarReadOnlyById]
  );

  // Calendar DnD hook
  const {
    dragState,
    dropPreview,
    isDragging,
    justEndedDrag,
    timelineRef,
    startBlockDrag,
    startBlockResize,
    startEventDrag,
    startEventResize,
    updateDrag,
    endDrag,
    cancelDrag,
  } = useCalendarDnd(date, {
    onBlockMove: (blockId, startTime, endTime) => {
      const task = projectedDragRef.current;
      if (task && blockId === `projected:${task.id}`) {
        createTimeBlock.mutate({ taskId: task.id, title: task.title, startTime, endTime });
        projectedDragRef.current = null;
      } else moveTimeBlock.mutate({ id: blockId, startTime, endTime });
    },
    onBlockResize: (blockId, startTime, endTime) => {
      const task = projectedDragRef.current;
      if (task && blockId === `projected:${task.id}`) {
        createTimeBlock.mutate({ taskId: task.id, title: task.title, startTime, endTime });
        projectedDragRef.current = null;
      } else cascadeResizeTimeBlock.mutate({ id: blockId, startTime, endTime });
    },
    onEventMove: writeEventTimes,
    onEventResize: writeEventTimes,
  });

  // Board cards can be dropped on the timeline to block them at that time.
  const timeAt = React.useCallback(
    (clientY: number) => {
      const rect = timelineRef.current?.getBoundingClientRect();
      const y = rect ? clientY - rect.top : 0;
      return snapToInterval(calculateTimeFromY(Math.max(0, y), date), SNAP_INTERVAL);
    },
    [date, timelineRef]
  );
  const dropData: CalendarDropData = { type: "calendar", date: dateString, timeAt };
  const { setNodeRef: setDropRef, isOver: isCardOver } = useDroppable({
    id: `calendar-${dateString}`,
    data: dropData,
  });
  const setTimelineNode = React.useCallback(
    (node: HTMLDivElement | null) => {
      (timelineRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      setDropRef(node);
    },
    [timelineRef, setDropRef]
  );
  const [cardPreview, setCardPreview] = React.useState<{
    title: string;
    start: Date;
    end: Date;
  } | null>(null);
  const cardDragActive = React.useRef(false);
  const cardDropEndedAt = React.useRef(0);
  useDndMonitor({
    onDragStart: () => { cardDragActive.current = true; },
    onDragMove(event: DragMoveEvent) {
      const task = event.active.data.current?.task as Task | undefined;
      const y = dragPointerY(event);
      if (event.over?.id !== `calendar-${dateString}` || !task || y === null) {
        setCardPreview(null);
        return;
      }
      const start = timeAt(y);
      setCardPreview({
        title: task.title,
        start,
        end: addMinutes(start, task.estimatedMins ?? DEFAULT_DROP_MINS),
      });
    },
    onDragEnd: () => { cardDragActive.current = false; cardDropEndedAt.current = Date.now(); setCardPreview(null); },
    onDragCancel: () => { cardDragActive.current = false; cardDropEndedAt.current = Date.now(); setCardPreview(null); },
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

  // Sunsama-style ghost blocks: open tasks with no block of their own, laid
  // out where the day's list order puts them (the same projected starts the
  // cards show). Clicking one opens the task.
  const { user } = useAuth();
  const workStartHour = user?.preferences?.workStartHour ?? 9;
  const workEndHour = user?.preferences?.workEndHour ?? 17;
  const { data: dayTasks = [] } = useTasks({ scheduledDate: dateString, limit: 200 });
  const projected = React.useMemo(() => {
    const open = dayTasks
      .filter((t) => !t.completedAt)
      .sort((a, b) => a.position - b.position);
    const blocked = new Set(
      dayBlocks.map((b) => b.taskId).filter((id): id is string => !!id)
    );
    const busy = [
      ...dayBlocks.map((b) => ({ start: new Date(b.startTime), end: new Date(b.endTime) })),
      ...calendarEvents
        .filter((e) => !e.isAllDay && e.responseStatus !== "declined")
        .map((e) => ({ start: new Date(e.startTime), end: new Date(e.endTime) })),
    ];
    const starts = projectTaskStarts({
      day: date,
      tasks: open,
      blockedTaskIds: blocked,
      busy,
      workStartHour,
    });
    return open.flatMap((task) => {
      const start = starts.get(task.id);
      if (!start) return [];
      const mins = task.estimatedMins || DEFAULT_PLANNED_MINS;
      return [{ task, start, end: addMinutes(start, mins) }];
    });
  }, [dayTasks, dayBlocks, calendarEvents, date, workStartHour]);

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
  }, [dateString, isToday]);

  // Mouse event handlers for drag
  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();

    if (isDragging) {
      updateDrag(e.clientY, rect);
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

  const startProjectedDrag = (task: Task, start: Date, end: Date, e: React.MouseEvent, edge?: "top" | "bottom") => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    projectedDragRef.current = task;
    const block: TimeBlockType = {
      id: `projected:${task.id}`, taskId: task.id, userId: task.userId,
      title: task.title, startTime: start, endTime: end,
      color: null, notes: null, createdAt: start, updatedAt: start,
    };
    if (edge) startBlockResize(block, edge, e.clientY);
    else startBlockDrag(block, e.clientY);
  };

  // Press and drag on empty space to sweep out a new block.
  const createDrag = useDragToCreate(
    onTimeSlotClick
      ? ({ day, start, end, anchor }) => onTimeSlotClick(day, start, end, anchor)
      : undefined
  );

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

    // React bubbles clicks from portals (a block's right-click menu) up
    // the component tree to here; only real clicks on the grid count.
    if (!e.currentTarget.contains(e.target as Node)) {
      return;
    }

    // Don't trigger during drag operations
    if (dragState || cardDragActive.current || Date.now() - cardDropEndedAt.current < 350) {
      return;
    }

    // Don't trigger if we just ended a drag/resize operation
    if (justEndedDrag || createDrag.shouldIgnoreClick()) {
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

    onTimeSlotClick(date, snappedStartTime, snappedEndTime, { x: e.clientX, y: e.clientY });
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full w-[280px] bg-canvas border-l border-border/40",
        className
      )}
    >
      {/* Header — height matched to the board toolbar (h-14) so the two
          top rows line up as one uniform band. */}
      <div className="flex h-14 flex-shrink-0 flex-col justify-center px-3 leading-tight">
        <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          {format(date, "EEE")}
        </div>
        <div className="text-base font-semibold">{format(date, "MMM d")}</div>
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
          <div className="w-10 flex-shrink-0 sticky left-0 bg-canvas z-10">
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
            ref={setTimelineNode}
            className={cn(
              "relative flex-1",
              isDragging ? "cursor-grabbing" : "cursor-default",
              isToday && "bg-primary/[0.02]",
              isCardOver && "bg-primary/[0.04]"
            )}
            onMouseMove={handleTimelineMouseMove}
            onMouseLeave={handleTimelineMouseLeave}
            onClick={handleTimeSlotClick}
            data-calendar-create-column
            onMouseDown={(e) => { if (!cardDragActive.current) createDrag.startCreate(e, date); }}
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
                    (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT +
                    HOUR_HEIGHT / 2,
                }}
              />
            ))}

            {/* Where the workday starts and ends, as a zigzag like Sunsama's */}
            {[workStartHour, workEndHour].map((hour) =>
              hour > TIMELINE_START_HOUR && hour <= TIMELINE_END_HOUR ? (
                <WorkdayEdge
                  key={hour}
                  top={(hour - TIMELINE_START_HOUR) * HOUR_HEIGHT}
                  label={hour === workStartHour ? "Workday starts" : "Workday ends"}
                />
              ) : null
            )}

            {/* Tasks without a block, where the list order projects them */}
            {projected.map(({ task, start, end }) => (
                <button
                  key={task.id}
                  type="button"
                  data-projected-task={task.id}
                  aria-label={task.title}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!justEndedDrag) onViewTask?.(task.id);
                  }}
                  onMouseDown={(e) => startProjectedDrag(task, start, end, e)}
                  title={`${task.title} · projected ${format(start, "h:mm a")}`}
                  className="absolute left-1 right-2 z-10 overflow-hidden rounded border border-dotted border-primary/50 bg-primary/[0.04] px-1.5 text-left text-[11px] leading-4 text-primary transition-colors hover:bg-primary/[0.09]"
                  style={{
                    opacity: dragState?.blockId === `projected:${task.id}` ? 0.4 : 1,
                    top: calculateYFromTime(start) + 1,
                    height: Math.max(
                      16,
                      (differenceInMinutes(end, start) / 60) * HOUR_HEIGHT - 2
                    ),
                  }}
                >
                  <span data-resize="top" title="Drag to change start time" className="absolute inset-x-0 top-0 z-20 h-1 cursor-ns-resize hover:bg-primary/20" onMouseDown={(e) => startProjectedDrag(task, start, end, e, "top")} />
                  <span className="line-clamp-2">{task.title}</span>
                  <span data-resize="bottom" title="Drag to change end time" className="absolute inset-x-0 bottom-0 z-20 h-1 cursor-ns-resize hover:bg-primary/20" onMouseDown={(e) => startProjectedDrag(task, start, end, e, "bottom")} />
                </button>
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
            {timedEvents.map((event) => {
              const canEdit = eventCanEdit(event);
              return (
                <ExternalEvent
                  key={event.id}
                  event={event}
                  displayDate={date}
                  layout={
                    itemLayouts.get(`event:${event.id}`) ?? DEFAULT_LAYOUT
                  }
                  onClick={() => handleExternalEventClick(event)}
                  {...(canEdit
                    ? {
                        onDragStart: (e: React.MouseEvent) => {
                          e.preventDefault();
                          startEventDrag(event, e.clientY);
                        },
                        onResizeStart: (
                          e: React.MouseEvent,
                          edge: "top" | "bottom"
                        ) => {
                          e.preventDefault();
                          startEventResize(event, edge, e.clientY);
                        },
                      }
                    : {})}
                  isDragging={dragState?.eventId === event.id}
                  justEndedDrag={justEndedDrag}
                />
              );
            })}

            {/* Time blocks */}
            {dayBlocks.map((block) => (
              <TimeBlock
                key={block.id}
                block={block}
                layout={itemLayouts.get(`block:${block.id}`) ?? DEFAULT_LAYOUT}
                onClick={() => { if (!justEndedDrag) onBlockClick?.(block); }}
                onEditBlock={() => onEditBlock?.(block)}
                onDragStart={(e) => handleBlockDragStart(block, e)}
                onResizeStart={(e, edge) =>
                  handleBlockResizeStart(block, edge, e)
                }
                onViewTask={onViewTask}
                isDragging={dragState?.blockId === block.id}
              />
            ))}

            {/* Where a board card will land */}
            {cardPreview && (
              <TimeBlockPreview
                title={cardPreview.title}
                startTime={cardPreview.start}
                endTime={cardPreview.end}
                top={calculateYFromTime(cardPreview.start)}
                height={
                  (differenceInMinutes(cardPreview.end, cardPreview.start) /
                    60) *
                  HOUR_HEIGHT
                }
              />
            )}

            {/* Block being swept out by a drag on empty space */}
            {createDrag.range && (
              <TimeBlockPreview
                title="New block"
                startTime={createDrag.range.start}
                endTime={createDrag.range.end}
                top={calculateYFromTime(createDrag.range.start)}
                height={
                  ((createDrag.range.end.getTime() -
                    createDrag.range.start.getTime()) /
                    3_600_000) *
                  HOUR_HEIGHT
                }
              />
            )}

            {/* Drop preview */}
            {dropPreview && dragState && (
              <TimeBlockPreview
                title={
                  dragState.task?.title ||
                  dragState.block?.title ||
                  dragState.event?.title ||
                  "New Time Block"
                }
                startTime={dropPreview.startTime}
                endTime={dropPreview.endTime}
                top={dropPreview.top}
                height={dropPreview.height}
                {...(dragState.block?.color
                  ? { color: dragState.block.color }
                  : dragState.event?.calendar?.color
                    ? { color: dragState.event.calendar.color }
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
            ? (calendarReadOnlyById.get(selectedExternalEvent.calendarId) ??
              true)
            : true
        }
        calendarProvider={
          selectedExternalEvent
            ? calendarProviderById.get(selectedExternalEvent.calendarId)
            : undefined
        }
      />
    </div>
  );
}

/** A zigzag across the timeline marking the start or end of the workday. */
function WorkdayEdge({ top, label }: { top: number; label: string }) {
  const id = React.useId();
  return (
    <svg
      aria-label={label}
      role="img"
      className="pointer-events-none absolute left-0 right-0 z-[5] text-muted-foreground/40"
      style={{ top: top - 3 }}
      height="6"
      width="100%"
    >
      <defs>
        <pattern id={id} width="8" height="6" patternUnits="userSpaceOnUse">
          <path d="M0 5 L4 1 L8 5" fill="none" stroke="currentColor" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="6" fill={`url(#${id})`} />
    </svg>
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
