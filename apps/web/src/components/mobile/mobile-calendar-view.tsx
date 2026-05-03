import * as React from "react";
import {
  format,
  isSameDay,
  setHours,
  setMinutes,
  addMinutes,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
} from "date-fns";
import {
  Menu,
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import type {
  Task,
  TimeBlock as TimeBlockType,
  CalendarEvent,
} from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  useTasks,
  useTimeBlocksForDate,
} from "@/hooks";
import {
  useCalendarEvents,
  useCalendars,
  useCalendarAccounts,
  useUpdateCalendarEvent,
} from "@/hooks/useCalendars";
import { useMobileTouchDrag } from "./use-mobile-touch-drag";
import { isCalendarReadOnlyForUi } from "@/lib/calendar-providers";
import {
  HOUR_HEIGHT,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  calculateYFromTime,
} from "@/hooks/useCalendarDnd";
import {
  ScrollArea,
  Sheet,
  SheetContent,
  SheetTrigger,
  Button,
} from "@/components/ui";
import { TimeBlock } from "@/components/calendar/time-block";
import { ExternalEvent } from "@/components/calendar/external-event";
import { CalendarEventDetailSheet } from "@/components/calendar/calendar-event-detail-sheet";
import {
  layoutOverlappingItems,
  type LayoutResult,
} from "@/components/calendar/event-layout";
import { UnscheduledTasksDrawer } from "./mobile-unscheduled-drawer";

const DEFAULT_LAYOUT: LayoutResult = { lane: 0, columnCount: 1 };
// Imported from the central source so adding a new provider is a
// one-line change in one place.

interface MobileCalendarViewProps {
  /** Initial date to display */
  initialDate?: Date;
  /** Callback when a task is clicked */
  onTaskClick?: (task: Task) => void;
  /** Callback when a time block is clicked */
  onBlockClick?: (block: TimeBlockType) => void;
  /** Callback to view task details */
  onViewTask?: (taskId: string) => void;
  /** Callback when tapping empty slot to create time block */
  onTimeSlotClick?: (date: Date, startTime: Date, endTime: Date) => void;
  /** Custom className */
  className?: string;
}

function generateHours(): number[] {
  return Array.from(
    { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
    (_, i) => i + TIMELINE_START_HOUR
  );
}

/**
 * MobileCalendarView — mobile day timeline with nav + external events.
 *
 * Brought up to feature parity with the board sidebar's calendar panel:
 * shows time blocks AND external Google/Outlook events on the same
 * timeline, with prev/next/today navigation, an "all-day" banner above
 * the timeline, and click-to-edit via the same detail sheet the
 * desktop uses (Radix Sheet renders fine on phones). Drag-to-
 * reschedule on touch is deferred — the long-press / scroll-conflict
 * handling is a separate problem from the desktop mouse-drag path.
 */
export function MobileCalendarView({
  initialDate = new Date(),
  onTaskClick,
  onBlockClick,
  onViewTask,
  onTimeSlotClick,
  className,
}: MobileCalendarViewProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date>(() =>
    startOfDay(initialDate)
  );
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  // Tick every minute so the now-line moves and the day-flip happens
  // automatically at midnight while the page is open.
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Auto-advance the displayed day when the wall-clock crosses
  // midnight and the user was looking at "today" before the flip.
  // Without this, the now-line vanishes at 00:00 but the timeline
  // keeps showing yesterday's events until the user manually taps
  // "Today" / "Next". The ref tracks the "today" we last saw — when
  // the tick produces a new "today" AND the user was previously on
  // the old "today", we slide forward; if they navigated elsewhere,
  // they stay put.
  const lastTodayRef = React.useRef(startOfDay(now));
  React.useEffect(() => {
    const todayStart = startOfDay(now);
    if (todayStart.getTime() === lastTodayRef.current.getTime()) return;
    const wasOnOldToday = isSameDay(selectedDate, lastTodayRef.current);
    lastTodayRef.current = todayStart;
    if (wasOnOldToday) {
      setSelectedDate(todayStart);
    }
  }, [now, selectedDate]);

  // Format date for API calls
  const dateString = format(selectedDate, "yyyy-MM-dd");
  const dayStart = React.useMemo(
    () => startOfDay(selectedDate),
    [selectedDate]
  );
  const dayEnd = React.useMemo(() => endOfDay(selectedDate), [selectedDate]);
  const fromDate = dayStart.toISOString();
  const toDate = dayEnd.toISOString();

  // Fetch tasks for selected date
  const { data: allTasks = [], isLoading: isLoadingTasks } = useTasks({
    scheduledDate: dateString,
    limit: 200,
  });

  // Fetch time blocks for selected date
  const { data: timeBlocks = [], isLoading: isLoadingBlocks } =
    useTimeBlocksForDate(dateString);

  // External calendar events
  const { data: calendarEvents = [] } = useCalendarEvents(fromDate, toDate);

  // Per-calendar editability + provider maps for the detail sheet
  // (read-only gate + recurring-event disclosure copy).
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

  // Long-press-to-drag for external events. Same write-back path the
  // desktop uses — useUpdateCalendarEvent handles optimistic update +
  // rollback + cross-range invalidation.
  const updateCalendarEvent = useUpdateCalendarEvent();
  const touchDrag = useMobileTouchDrag({
    onCommit: (eventId, startTime, endTime) => {
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
  });

  // Bucket events into timed (drawn on timeline) and all-day (banner).
  const { timedEvents, allDayEvents } = React.useMemo(() => {
    const targetCalendarDate = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, "0")}-${String(selectedDate.getDate()).padStart(2, "0")}`;
    const timed: CalendarEvent[] = [];
    const allDay: CalendarEvent[] = [];
    for (const event of calendarEvents) {
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
    return { timedEvents: timed, allDayEvents: allDay };
  }, [calendarEvents, selectedDate, dayStart, dayEnd]);

  // Filter blocks for this day
  const dayBlocks = React.useMemo(() => {
    return timeBlocks.filter((block) =>
      isSameDay(new Date(block.startTime), selectedDate)
    );
  }, [timeBlocks, selectedDate]);

  // Side-by-side overlap layout shared with the desktop views.
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

  // Filter tasks that don't have a time block on this day
  const unscheduledTasks = React.useMemo(() => {
    const blockedTaskIds = new Set(
      timeBlocks.filter((b) => b.taskId).map((b) => b.taskId)
    );
    return allTasks.filter(
      (task) => !task.completedAt && !blockedTaskIds.has(task.id)
    );
  }, [allTasks, timeBlocks]);

  const hours = React.useMemo(() => generateHours(), []);
  const isToday = isSameDay(selectedDate, now);

  // Now indicator position
  const currentTimePosition = React.useMemo(() => {
    if (!isToday) return null;
    return calculateYFromTime(now);
  }, [isToday, now]);

  // Auto-scroll to current time on mount AND on date change.
  React.useEffect(() => {
    if (!scrollAreaRef.current) return;
    const targetHour = isToday ? Math.max(0, now.getHours() - 1) : 8;
    const scrollPosition = targetHour * HOUR_HEIGHT;
    const viewport = scrollAreaRef.current.querySelector(
      "[data-radix-scroll-area-viewport]"
    );
    if (viewport) viewport.scrollTop = scrollPosition;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateString]);

  const isLoading = isLoadingTasks || isLoadingBlocks;

  // External-event detail sheet — same component the desktop uses, so
  // mobile users get full edit/delete with a Radix Sheet that's already
  // mobile-friendly (slides up from the bottom in narrow viewports).
  const [selectedExternalEvent, setSelectedExternalEvent] =
    React.useState<CalendarEvent | null>(null);
  const [externalEventSheetOpen, setExternalEventSheetOpen] =
    React.useState(false);
  const handleExternalEventClick = React.useCallback(
    (event: CalendarEvent) => {
      setSelectedExternalEvent(event);
      setExternalEventSheetOpen(true);
    },
    []
  );
  const handleExternalEventSheetOpenChange = React.useCallback(
    (next: boolean) => {
      setExternalEventSheetOpen(next);
      if (!next) {
        setTimeout(() => setSelectedExternalEvent(null), 200);
      }
    },
    []
  );

  const goToPrevDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
  const goToToday = () => setSelectedDate(startOfDay(new Date()));

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Header */}
      <header className="flex flex-col gap-2 border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  "flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg",
                  "hover:bg-accent active:bg-accent/80 transition-colors"
                )}
                aria-label="Open unscheduled tasks"
              >
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-full max-w-sm p-0 flex flex-col">
              <UnscheduledTasksDrawer
                tasks={unscheduledTasks}
                isLoading={isLoading}
                onTaskClick={(task) => {
                  onTaskClick?.(task);
                  setDrawerOpen(false);
                }}
              />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold leading-tight">
              {format(selectedDate, "EEEE")}
            </h1>
            <p className="text-xs text-muted-foreground leading-tight">
              {format(selectedDate, "MMMM d, yyyy")}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={goToPrevDay}
              aria-label="Previous day"
              className="h-9 w-9"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant={isToday ? "default" : "outline"}
              onClick={goToToday}
              className="h-9 px-3 text-xs"
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={goToNextDay}
              aria-label="Next day"
              className="h-9 w-9"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* All-day banner — shown only when there's at least one all-day
          event for this day. Compact chips matching the desktop. */}
      {allDayEvents.length > 0 && (
        <div className="flex-shrink-0 border-b bg-muted/30 px-2 py-1 space-y-0.5">
          {allDayEvents.map((event) => {
            const color = event.calendar?.color ?? "#6B7280";
            return (
              <button
                key={event.id}
                type="button"
                data-all-day-event
                onClick={() => handleExternalEventClick(event)}
                className="flex w-full items-center gap-1.5 rounded px-2 py-1 text-xs hover:brightness-90 cursor-pointer"
                style={{
                  backgroundColor: hexToRgba(color, 0.15),
                  borderLeft: `3px solid ${hexToRgba(color, 0.6)}`,
                }}
                title={event.title}
              >
                <CalendarIcon className="h-3 w-3 flex-shrink-0" style={{ color }} />
                <span className="truncate text-left">{event.title}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Timeline */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div
          className="flex"
          style={{ minHeight: hours.length * HOUR_HEIGHT }}
        >
          {/* Time Labels Column — 12-hour to match desktop. */}
          <div className="w-14 flex-shrink-0 border-r bg-muted/30">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-border/50"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-2 text-[11px] text-muted-foreground font-medium tabular-nums">
                  {format(setHours(selectedDate, hour), "ha").toLowerCase()}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline Content */}
          <div
            ref={timelineRef}
            // `data-mobile-timeline` lets the touch-drag hook find
            // this element via element.closest() so it can compute
            // pixel-to-time math against the right rect.
            data-mobile-timeline
            className={cn(
              "relative flex-1",
              "touch-pan-y",
              isToday && "bg-accent/5"
            )}
          >
            {/* Hour grid lines */}
            {hours.map((hour) => (
              <div
                key={hour}
                className={cn(
                  "border-b border-border/30",
                  "active:bg-accent/30 transition-colors"
                )}
                style={{ height: HOUR_HEIGHT }}
              />
            ))}

            {/* Half-hour grid lines */}
            {hours.map((hour) => (
              <div
                key={`${hour}-half`}
                className="absolute left-0 right-0 border-b border-border/15"
                style={{
                  top:
                    (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2,
                }}
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

            {/* External calendar events (drawn behind time blocks).
                Touch handlers go directly on the chip's root via
                ExternalEvent's `onTouchStart`/etc props — earlier
                we used a `display: contents` wrapper but Safari ≤
                iOS 15 has known bugs with pointer/touch events on
                `display: contents` elements. Wiring through the
                chip's root avoids the wrapper entirely. */}
            {!isLoading &&
              timedEvents.map((event) => {
                const canEdit =
                  !(calendarReadOnlyById.get(event.calendarId) ?? true) &&
                  !event.isAllDay;
                const isThisDragging =
                  touchDrag.dragState?.eventId === event.id;
                return (
                  <ExternalEvent
                    key={event.id}
                    event={event}
                    displayDate={selectedDate}
                    layout={
                      itemLayouts.get(`event:${event.id}`) ?? DEFAULT_LAYOUT
                    }
                    onClick={() => handleExternalEventClick(event)}
                    justEndedDrag={touchDrag.justEndedDrag}
                    isTouchDragging={isThisDragging}
                    onTouchStart={
                      canEdit
                        ? (e) =>
                            touchDrag.handleTouchStart(
                              event.id,
                              selectedDate,
                              new Date(event.startTime),
                              new Date(event.endTime),
                              e
                            )
                        : undefined
                    }
                    onTouchMove={canEdit ? touchDrag.handleTouchMove : undefined}
                    onTouchEnd={canEdit ? touchDrag.handleTouchEnd : undefined}
                  />
                );
              })}

            {/* Live drop preview during touch drag — dashed outline at
                the new position with the new time range label. */}
            {touchDrag.dragState && (() => {
              const previewTop = calculateYFromTime(
                touchDrag.dragState.previewStart
              );
              const previewMins =
                (touchDrag.dragState.previewEnd.getTime() -
                  touchDrag.dragState.previewStart.getTime()) /
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
                    {format(touchDrag.dragState.previewStart, "h:mm a")} –{" "}
                    {format(touchDrag.dragState.previewEnd, "h:mm a")}
                  </span>
                </div>
              );
            })()}

            {/* Time blocks */}
            {!isLoading &&
              dayBlocks.map((block) => (
                <TimeBlock
                  key={block.id}
                  block={block}
                  layout={itemLayouts.get(`block:${block.id}`) ?? DEFAULT_LAYOUT}
                  onClick={() => onBlockClick?.(block)}
                  onViewTask={onViewTask}
                />
              ))}
          </div>
        </div>
      </ScrollArea>

      {/* FAB for creating time blocks */}
      <button
        onClick={() => {
          // Default-time logic: when viewing today, anchor at the
          // next hour from now (clamped to ≤22:00 so the +1h end
          // doesn't roll past midnight). When viewing any other
          // day, anchor at 09:00 — using "current time of day" on
          // a navigated day produces a confusing slot mismatched
          // with the displayed date in the dialog header.
          const baseHour = isToday
            ? Math.min(now.getHours() + 1, 22)
            : 9;
          const defaultStart = setHours(
            setMinutes(selectedDate, 0),
            baseHour
          );
          const defaultEnd = addMinutes(defaultStart, 60);
          if (onTimeSlotClick) {
            onTimeSlotClick(selectedDate, defaultStart, defaultEnd);
          }
        }}
        className={cn(
          "fixed bottom-24 right-4 z-40",
          "flex h-14 w-14 items-center justify-center",
          "rounded-full bg-primary text-primary-foreground shadow-lg",
          "hover:bg-primary/90 active:scale-95 transition-all",
          "lg:hidden"
        )}
        aria-label="Add time block"
      >
        <Plus className="h-6 w-6" />
      </button>

      {/* External event detail sheet — read + edit + delete on tap. */}
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
        calendarProvider={
          selectedExternalEvent
            ? calendarProviderById.get(selectedExternalEvent.calendarId)
            : undefined
        }
      />
    </div>
  );
}

/** Hex → rgba string. Used by the all-day chips. */
function hexToRgba(hex: string, alpha: number): string {
  const cleanHex = hex.replace("#", "");
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  if (Number.isNaN(r)) return `rgba(107, 114, 128, ${alpha})`;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
