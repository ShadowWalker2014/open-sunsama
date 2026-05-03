import * as React from "react";
import {
  format,
  addDays,
  subDays,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
} from "date-fns";
import type {
  Task,
  TimeBlock,
  CalendarEvent,
  CalendarViewMode,
} from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  useTasks,
  useTimeBlocksForDate,
  useTimeBlocksForDateRange,
  useCreateTimeBlock,
  useMoveTimeBlock,
  useCascadeResizeTimeBlock,
} from "@/hooks";
import { useAuth } from "@/hooks/useAuth";
import { useCalendarEvents } from "@/hooks/useCalendars";
import { useCalendarDnd } from "@/hooks/useCalendarDnd";
import { Timeline } from "./timeline";
import { MultiDayView } from "./multi-day-view";
import { MonthView } from "./month-view";
import { UnscheduledTasksPanel } from "./unscheduled-tasks";
import { DragOverlay } from "./drag-overlay";
import { CalendarViewToolbar } from "./calendar-view-toolbar";
import { CalendarEventDetailSheet } from "./calendar-event-detail-sheet";
import {
  AddTaskModal,
  prefetchAddTaskModal,
} from "@/components/kanban/add-task-modal.lazy";

/**
 * Persist the calendar view mode in localStorage so the user's choice
 * survives across reloads even before the server-side preference write
 * lands. We also seed from `user.preferences.calendarViewMode` if it's
 * set so the choice can flow across devices via the canonical
 * preferences sync path.
 */
const VIEW_MODE_STORAGE_KEY = "open_sunsama_calendar_view_mode";

function getStoredViewMode(): CalendarViewMode | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
  if (v === "day" || v === "3-day" || v === "week" || v === "month") return v;
  return null;
}

function storeViewMode(mode: CalendarViewMode): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // ignore quota errors
  }
}

interface VisibleRange {
  start: Date;
  end: Date;
  /** Days the columns iterate over (day=1, 3-day=3, week=7, month=N) */
  days: Date[];
}

function computeRange(
  selectedDate: Date,
  viewMode: CalendarViewMode,
  weekStartsOn: 0 | 1
): VisibleRange {
  switch (viewMode) {
    case "day": {
      const start = startOfDay(selectedDate);
      const end = endOfDay(selectedDate);
      return { start, end, days: [start] };
    }
    case "3-day": {
      const start = startOfDay(selectedDate);
      const end = endOfDay(addDays(start, 2));
      return {
        start,
        end,
        days: [0, 1, 2].map((i) => addDays(start, i)),
      };
    }
    case "week": {
      const start = startOfWeek(selectedDate, { weekStartsOn });
      const end = endOfWeek(selectedDate, { weekStartsOn });
      return {
        start,
        end,
        days: Array.from({ length: 7 }, (_, i) => addDays(start, i)),
      };
    }
    case "month": {
      // Server fetch should cover from the first visible cell (the prior
      // month's tail in the first row) to the last visible cell (the
      // next month's head in the last row).
      const start = startOfWeek(startOfMonth(selectedDate), { weekStartsOn });
      const end = endOfWeek(endOfMonth(selectedDate), { weekStartsOn });
      return { start, end, days: [] /* not used by month grid */ };
    }
  }
}

interface CalendarViewProps {
  initialDate?: Date;
  onTaskClick?: (task: Task) => void;
  onBlockClick?: (block: TimeBlock) => void;
  onEditBlock?: (block: TimeBlock) => void;
  onViewTask?: (taskId: string) => void;
  onTimeSlotClick?: (date: Date, startTime: Date, endTime: Date) => void;
  className?: string;
}

/**
 * CalendarView - Main calendar view container with two-panel layout
 */
export function CalendarView({
  initialDate = new Date(),
  onTaskClick,
  onBlockClick,
  onEditBlock,
  onViewTask,
  onTimeSlotClick,
  className,
}: CalendarViewProps) {
  const { user } = useAuth();
  const weekStartsOn = (user?.preferences?.weekStartsOn ?? 0) as 0 | 1;

  // Selected date state — anchors the visible range
  const [selectedDate, setSelectedDate] = React.useState<Date>(() =>
    startOfDay(initialDate)
  );

  // View mode: prefer server-synced preference; fall back to localStorage,
  // then to "day".
  const [viewMode, setViewModeRaw] = React.useState<CalendarViewMode>(() => {
    return (
      user?.preferences?.calendarViewMode ?? getStoredViewMode() ?? "day"
    );
  });
  // If the user preference loads in later (e.g. on first /auth/me arrival),
  // sync into local state. This intentionally won't override user-driven
  // changes that happened after mount because we only run when the
  // server-canonical value arrives.
  React.useEffect(() => {
    const remote = user?.preferences?.calendarViewMode;
    if (remote && remote !== viewMode && getStoredViewMode() === null) {
      setViewModeRaw(remote);
    }
    // Intentionally omit `viewMode` from deps — we only want to react to
    // the canonical server value arriving, not to user-driven local
    // changes.
  }, [user?.preferences?.calendarViewMode, viewMode]);

  const setViewMode = React.useCallback((mode: CalendarViewMode) => {
    setViewModeRaw(mode);
    storeViewMode(mode);
    // TODO: also write the preference back to the server via
    // `useUpdateUser` once we want it to sync across devices. For now
    // localStorage is enough for the in-session experience.
  }, []);

  // The window of days currently visible.
  const range = React.useMemo(
    () => computeRange(selectedDate, viewMode, weekStartsOn),
    [selectedDate, viewMode, weekStartsOn]
  );

  // Format date for API calls
  const dateString = format(selectedDate, "yyyy-MM-dd");

  // Fetch tasks for selected date (only used for unscheduled-tasks panel
  // in day view). For multi-day / month we don't show that panel.
  const { data: allTasks = [], isLoading: isLoadingTasks } = useTasks({
    scheduledDate: dateString,
    limit: 200,
  });

  // Fetch time blocks for the visible range. Day view stays on the
  // single-day endpoint to avoid changing its cache key shape; multi-day
  // and month use the range endpoint.
  const { data: dayTimeBlocks = [], isLoading: isLoadingDayBlocks } =
    useTimeBlocksForDate(dateString);
  const { data: rangeTimeBlocks = [], isLoading: isLoadingRangeBlocks } =
    useTimeBlocksForDateRange(range.start, range.end);
  const timeBlocks = viewMode === "day" ? dayTimeBlocks : rangeTimeBlocks;
  const isLoadingBlocks =
    viewMode === "day" ? isLoadingDayBlocks : isLoadingRangeBlocks;

  // Fetch external calendar events for the visible range. `.toISOString()`
  // encodes the user's local-day boundary as a real UTC instant so the
  // server parses it back to the same instant.
  const fromDate = range.start.toISOString();
  const toDate = range.end.toISOString();
  const { data: calendarEvents = [] } = useCalendarEvents(fromDate, toDate);

  // Mutations
  const createTimeBlock = useCreateTimeBlock();
  const moveTimeBlock = useMoveTimeBlock();
  const cascadeResizeTimeBlock = useCascadeResizeTimeBlock();

  // Filter tasks that don't have a time block on this day
  const unscheduledTasks = React.useMemo(() => {
    const blockedTaskIds = new Set(
      timeBlocks.filter((b) => b.taskId).map((b) => b.taskId)
    );
    return allTasks.filter(
      (task) => !task.completedAt && !blockedTaskIds.has(task.id)
    );
  }, [allTasks, timeBlocks]);

  // Calendar DnD hook
  const {
    dragState,
    dropPreview,
    isDragging,
    justEndedDrag,
    timelineRef,
    startTaskDrag,
    startBlockDrag,
    startBlockResize,
    updateDrag,
    endDrag,
    cancelDrag,
  } = useCalendarDnd(selectedDate, {
    onTaskDrop: (taskId, startTime, endTime) => {
      const task = unscheduledTasks.find((t) => t.id === taskId);
      if (task) {
        createTimeBlock.mutate({
          taskId,
          title: task.title,
          startTime,
          endTime,
        });
      }
    },
    onBlockMove: (blockId, startTime, endTime) => {
      moveTimeBlock.mutate({ id: blockId, startTime, endTime });
    },
    onBlockResize: (blockId, startTime, endTime) => {
      // Use cascade resize to automatically shift blocks below (server-side)
      cascadeResizeTimeBlock.mutate({ 
        id: blockId, 
        startTime, 
        endTime,
      });
    },
  });

  // Navigation handlers — step size depends on view mode.
  // Day → ±1 day; 3-Day → ±3 days; Week → ±1 week; Month → ±1 month.
  const goToPreviousDay = React.useCallback(() => {
    setSelectedDate((d) => {
      if (viewMode === "day") return subDays(d, 1);
      if (viewMode === "3-day") return subDays(d, 3);
      if (viewMode === "week") return subWeeks(d, 1);
      return subMonths(d, 1); // "month"
    });
  }, [viewMode]);
  const goToNextDay = React.useCallback(() => {
    setSelectedDate((d) => {
      if (viewMode === "day") return addDays(d, 1);
      if (viewMode === "3-day") return addDays(d, 3);
      if (viewMode === "week") return addWeeks(d, 1);
      return addMonths(d, 1); // "month"
    });
  }, [viewMode]);
  const goToToday = () => setSelectedDate(startOfDay(new Date()));

  // Mouse handlers for drag
  const handleTimelineMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      updateDrag(e.clientY, (e.currentTarget as HTMLElement).getBoundingClientRect());
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

  // Global mouse and touch events for drag
  React.useEffect(() => {
    if (!isDragging) return;

    const handleGlobalMouseUp = () => endDrag();
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (timelineRef.current) {
        updateDrag(e.clientY, timelineRef.current.getBoundingClientRect());
      }
    };
    
    // Touch event handlers for mobile
    const handleGlobalTouchEnd = () => endDrag();
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (timelineRef.current && e.touches.length > 0) {
        const touch = e.touches[0];
        if (touch) {
          updateDrag(touch.clientY, timelineRef.current.getBoundingClientRect());
          // Prevent page scrolling while dragging
          e.preventDefault();
        }
      }
    };
    const handleGlobalTouchCancel = () => cancelDrag();
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") cancelDrag();
    };

    // Mouse events
    document.addEventListener("mouseup", handleGlobalMouseUp);
    document.addEventListener("mousemove", handleGlobalMouseMove);
    
    // Touch events with passive: false to allow preventDefault
    document.addEventListener("touchend", handleGlobalTouchEnd);
    document.addEventListener("touchmove", handleGlobalTouchMove, { passive: false });
    document.addEventListener("touchcancel", handleGlobalTouchCancel);
    
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
      document.removeEventListener("mousemove", handleGlobalMouseMove);
      document.removeEventListener("touchend", handleGlobalTouchEnd);
      document.removeEventListener("touchmove", handleGlobalTouchMove);
      document.removeEventListener("touchcancel", handleGlobalTouchCancel);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isDragging, endDrag, cancelDrag, updateDrag, timelineRef]);

  // Task drag handlers
  const handleTaskDragStart = (task: Task, e: React.MouseEvent) => {
    e.preventDefault();
    startTaskDrag(task, e.clientY);
  };

  // Block drag handlers
  const handleBlockDragStart = (block: TimeBlock, e: React.MouseEvent) => {
    e.preventDefault();
    startBlockDrag(block, e.clientY);
  };

  const handleBlockResizeStart = (
    block: TimeBlock,
    edge: "top" | "bottom",
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    startBlockResize(block, edge, e.clientY);
  };

  const isLoading = isLoadingTasks || isLoadingBlocks;

  // External calendar event interaction. Clicking an event opens an
  // in-app detail sheet — replacing the previous (broken) behaviour
  // where the click both opened the provider's web UI in a new tab AND
  // bubbled to the timeline's create-time-block dialog.
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
        // Defer the state clear so the closing animation can finish.
        setTimeout(() => setSelectedExternalEvent(null), 200);
      }
    },
    []
  );

  // "Create task from event" hands the user off to the AddTaskModal
  // pre-filled with the event's title and date.
  const [taskFromEventOpen, setTaskFromEventOpen] = React.useState(false);
  const [taskFromEventSeed, setTaskFromEventSeed] = React.useState<{
    title: string;
    scheduledDate: string;
  } | null>(null);

  const handleCreateTaskFromEvent = React.useCallback(
    (event: CalendarEvent) => {
      const start = new Date(event.startTime);
      setTaskFromEventSeed({
        title: event.title,
        scheduledDate: format(start, "yyyy-MM-dd"),
      });
      void prefetchAddTaskModal();
      setTaskFromEventOpen(true);
    },
    []
  );

  // When the user clicks a day cell in month view, switch to day view
  // anchored on that date — common UX pattern (Google / Outlook).
  const handleDayCellClick = React.useCallback((date: Date) => {
    setSelectedDate(startOfDay(date));
    setViewMode("day");
  }, [setViewMode]);

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header / Toolbar */}
      <CalendarViewToolbar
        selectedDate={selectedDate}
        rangeStart={range.start}
        rangeEnd={range.end}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        timeBlocks={timeBlocks}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onToday={goToToday}
      />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Day view keeps the unscheduled-tasks side panel + DnD-aware
            Timeline. Multi-day and month views drop the panel — they're
            read-mostly so the extra real estate goes to the calendar. */}
        {viewMode === "day" && (
          <>
            <UnscheduledTasksPanel
              tasks={unscheduledTasks}
              isLoading={isLoading}
              scheduledDate={dateString}
              onTaskDragStart={handleTaskDragStart}
              {...(onTaskClick ? { onTaskClick } : {})}
            />
            <Timeline
              date={selectedDate}
              timeBlocks={timeBlocks}
              calendarEvents={calendarEvents}
              isLoading={isLoading}
              dragState={dragState}
              dropPreview={dropPreview}
              justEndedDrag={justEndedDrag}
              timelineRef={timelineRef}
              onBlockDragStart={handleBlockDragStart}
              onBlockResizeStart={handleBlockResizeStart}
              onTimelineMouseMove={handleTimelineMouseMove}
              onTimelineMouseUp={handleTimelineMouseUp}
              onTimelineMouseLeave={handleTimelineMouseLeave}
              onExternalEventClick={handleExternalEventClick}
              {...(onBlockClick ? { onBlockClick } : {})}
              {...(onEditBlock ? { onEditBlock } : {})}
              {...(onViewTask ? { onViewTask } : {})}
              {...(onTimeSlotClick
                ? {
                    onTimeSlotClick: (startTime: Date, endTime: Date) =>
                      onTimeSlotClick(selectedDate, startTime, endTime),
                  }
                : {})}
            />
          </>
        )}

        {(viewMode === "3-day" || viewMode === "week") && (
          <MultiDayView
            days={range.days}
            calendarEvents={calendarEvents}
            timeBlocks={timeBlocks}
            isLoading={isLoading}
            onExternalEventClick={handleExternalEventClick}
            {...(onBlockClick ? { onBlockClick } : {})}
          />
        )}

        {viewMode === "month" && (
          <MonthView
            month={selectedDate}
            weekStartsOn={weekStartsOn}
            calendarEvents={calendarEvents}
            timeBlocks={timeBlocks}
            isLoading={isLoading}
            onDayClick={handleDayCellClick}
            onExternalEventClick={handleExternalEventClick}
            {...(onBlockClick ? { onBlockClick } : {})}
          />
        )}
      </div>

      {/* Drag Overlay (only meaningful in day view) */}
      {viewMode === "day" && (
        <DragOverlay dragState={dragState} dropPreview={dropPreview} />
      )}

      {/* External calendar event detail sheet (shared across views) */}
      <CalendarEventDetailSheet
        event={selectedExternalEvent}
        open={externalEventSheetOpen}
        onOpenChange={handleExternalEventSheetOpenChange}
        onCreateTask={handleCreateTaskFromEvent}
      />

      {/* Add task modal pre-filled from a calendar event */}
      <AddTaskModal
        open={taskFromEventOpen}
        onOpenChange={(next) => {
          setTaskFromEventOpen(next);
          if (!next) setTaskFromEventSeed(null);
        }}
        scheduledDate={taskFromEventSeed?.scheduledDate}
        initialTitle={taskFromEventSeed?.title}
      />
    </div>
  );
}
