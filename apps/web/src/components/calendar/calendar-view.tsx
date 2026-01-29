import * as React from "react";
import {
  format,
  addDays,
  subDays,
  startOfDay,
} from "date-fns";
import type { Task, TimeBlock } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  useTasks,
  useTimeBlocksForDate,
  useCreateTimeBlock,
  useMoveTimeBlock,
  useResizeTimeBlock,
} from "@/hooks";
import { useCalendarDnd } from "@/hooks/useCalendarDnd";
import { Timeline } from "./timeline";
import { UnscheduledTasksPanel } from "./unscheduled-tasks";
import { DragOverlay } from "./drag-overlay";
import { CalendarViewToolbar } from "./calendar-view-toolbar";

interface CalendarViewProps {
  initialDate?: Date;
  onTaskClick?: (task: Task) => void;
  onBlockClick?: (block: TimeBlock) => void;
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
  onTimeSlotClick,
  className,
}: CalendarViewProps) {
  // Selected date state
  const [selectedDate, setSelectedDate] = React.useState<Date>(() =>
    startOfDay(initialDate)
  );

  // Format date for API calls
  const dateString = format(selectedDate, "yyyy-MM-dd");

  // Fetch tasks for selected date (unscheduled = scheduled for this day but no time block)
  const { data: allTasks = [], isLoading: isLoadingTasks } = useTasks({
    scheduledDate: dateString,
  });

  // Fetch time blocks for selected date
  const { data: timeBlocks = [], isLoading: isLoadingBlocks } =
    useTimeBlocksForDate(dateString);

  // Mutations
  const createTimeBlock = useCreateTimeBlock();
  const moveTimeBlock = useMoveTimeBlock();
  const resizeTimeBlock = useResizeTimeBlock();

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
      resizeTimeBlock.mutate({ id: blockId, startTime, endTime });
    },
  });

  // Navigation handlers
  const goToPreviousDay = () => setSelectedDate((d) => subDays(d, 1));
  const goToNextDay = () => setSelectedDate((d) => addDays(d, 1));
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

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header / Toolbar - Responsive */}
      <CalendarViewToolbar
        selectedDate={selectedDate}
        timeBlocks={timeBlocks}
        onPreviousDay={goToPreviousDay}
        onNextDay={goToNextDay}
        onToday={goToToday}
      />

      {/* Main Content - Two Panel Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Unscheduled Tasks */}
        <UnscheduledTasksPanel
          tasks={unscheduledTasks}
          isLoading={isLoading}
          onTaskDragStart={handleTaskDragStart}
          {...(onTaskClick ? { onTaskClick } : {})}
        />

        {/* Right Panel - Timeline */}
        <Timeline
          date={selectedDate}
          timeBlocks={timeBlocks}
          isLoading={isLoading}
          dragState={dragState}
          dropPreview={dropPreview}
          justEndedDrag={justEndedDrag}
          timelineRef={timelineRef as React.RefObject<HTMLDivElement>}
          onBlockDragStart={handleBlockDragStart}
          onBlockResizeStart={handleBlockResizeStart}
          onTimelineMouseMove={handleTimelineMouseMove}
          onTimelineMouseUp={handleTimelineMouseUp}
          onTimelineMouseLeave={handleTimelineMouseLeave}
          {...(onBlockClick ? { onBlockClick } : {})}
          {...(onTimeSlotClick ? { onTimeSlotClick: (startTime: Date, endTime: Date) => onTimeSlotClick(selectedDate, startTime, endTime) } : {})}
        />
      </div>

      {/* Drag Overlay */}
      <DragOverlay dragState={dragState} dropPreview={dropPreview} />
    </div>
  );
}
