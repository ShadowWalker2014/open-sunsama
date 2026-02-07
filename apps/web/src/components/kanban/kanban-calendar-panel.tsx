import * as React from "react";
import { format, isSameDay, setHours, addMinutes } from "date-fns";
import type { TimeBlock as TimeBlockType } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  useTimeBlocks,
  useMoveTimeBlock,
  useCascadeResizeTimeBlock,
} from "@/hooks/useTimeBlocks";
import { TimeBlock, TimeBlockPreview } from "@/components/calendar/time-block";
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

interface KanbanCalendarPanelProps {
  date: Date;
  className?: string;
  onBlockClick?: (block: TimeBlockType) => void;
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
  onTimeSlotClick,
  onViewTask,
}: KanbanCalendarPanelProps) {
  const dateString = format(date, "yyyy-MM-dd");
  const { data: timeBlocks = [] } = useTimeBlocks({ date: dateString });
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

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
    // Don't trigger if clicking on a time block
    if ((e.target as HTMLElement).closest("[data-time-block]")) {
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
              "relative flex-1 cursor-pointer",
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

            {/* Time blocks */}
            {dayBlocks.map((block) => (
              <TimeBlock
                key={block.id}
                block={block}
                onClick={() => onBlockClick?.(block)}
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
    </div>
  );
}
