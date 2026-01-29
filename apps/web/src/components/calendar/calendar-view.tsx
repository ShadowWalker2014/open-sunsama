import * as React from "react";
import {
  format,
  addDays,
  subDays,
  isToday,
  startOfDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import type { Task, TimeBlock } from "@chronoflow/types";
import { cn } from "@/lib/utils";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
void cn; // Silence unused import warning - cn is needed for className merging
import { Button } from "@/components/ui";
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

  const isTodaySelected = isToday(selectedDate);
  const isLoading = isLoadingTasks || isLoadingBlocks;

  return (
    <div className={cn("flex h-full flex-col", className)}>
      {/* Header / Toolbar - Responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b px-3 sm:px-4 py-2 sm:py-3 bg-background gap-2 sm:gap-4">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
          {/* Date Navigation - Touch-friendly on mobile */}
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousDay}
              aria-label="Previous day"
              className="h-10 w-10 sm:h-9 sm:w-9" // Larger touch target on mobile
            >
              <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant={isTodaySelected ? "default" : "outline"}
              onClick={goToToday}
              className="min-w-[60px] sm:min-w-[70px] h-10 sm:h-9 text-sm"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToNextDay}
              aria-label="Next day"
              className="h-10 w-10 sm:h-9 sm:w-9"
            >
              <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
            </Button>
          </div>

          {/* Selected Date Display - Compact on mobile */}
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-muted-foreground hidden sm:block" />
            <div>
              <h2 className="text-base sm:text-lg font-semibold leading-none">
                {format(selectedDate, "EEE")}
                <span className="hidden sm:inline">{format(selectedDate, "EE").replace(/^../, "")}</span>
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {format(selectedDate, "MMM d")}
                <span className="hidden sm:inline">{format(selectedDate, ", yyyy")}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Date indicator badges - hidden on very small screens */}
        <div className="hidden sm:flex items-center gap-2 justify-end sm:justify-start">
          {isTodaySelected && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2 sm:px-2.5 py-0.5 text-xs font-medium text-primary">
              Today
            </span>
          )}
          {timeBlocks.length > 0 && (
            <span className="inline-flex items-center rounded-full bg-muted px-2 sm:px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {timeBlocks.length} block{timeBlocks.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      </div>

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
