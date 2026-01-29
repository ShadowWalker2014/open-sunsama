import * as React from "react";
import { format, isSameDay, setHours, addMinutes } from "date-fns";
import type { TimeBlock as TimeBlockType } from "@chronoflow/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui";
import { TimeBlock, TimeBlockPreview } from "./time-block";
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
  isLoading?: boolean;
  dragState: DragState | null;
  dropPreview: DropPreview | null;
  timelineRef: React.RefObject<HTMLDivElement>;
  onBlockClick?: (block: TimeBlockType) => void;
  onBlockDragStart?: (block: TimeBlockType, e: React.MouseEvent) => void;
  onBlockResizeStart?: (block: TimeBlockType, edge: "top" | "bottom", e: React.MouseEvent) => void;
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
  isLoading = false,
  dragState,
  dropPreview,
  timelineRef,
  onBlockClick,
  onBlockDragStart,
  onBlockResizeStart,
  onTimelineMouseMove,
  onTimelineMouseUp,
  onTimelineMouseLeave,
  onTimeSlotClick,
  className,
}: TimelineProps) {
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const hours = React.useMemo(() => generateHours(), []);
  const now = new Date();
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

  // Handle click on empty time slot
  const handleTimeSlotClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger if clicking on a time block
    if ((e.target as HTMLElement).closest('[data-time-block]')) {
      return;
    }

    // Don't trigger during drag operations
    if (dragState) {
      return;
    }

    if (!onTimeSlotClick) return;

    // Get the timeline content container for accurate positioning
    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();
    
    // Get scroll position from the ScrollArea viewport
    const viewport = container.querySelector('[data-radix-scroll-area-viewport]');
    const scrollTop = viewport?.scrollTop ?? 0;
    
    // Calculate Y relative to the timeline content (accounting for scroll)
    const relativeY = e.clientY - rect.top + scrollTop;
    
    // Calculate time from Y position
    const clickedTime = calculateTimeFromY(relativeY, date);
    const snappedStartTime = snapToInterval(clickedTime, SNAP_INTERVAL);
    const snappedEndTime = addMinutes(snappedStartTime, 60); // Default 1 hour duration

    onTimeSlotClick(snappedStartTime, snappedEndTime);
  };

  return (
    <div className={cn("flex flex-1 overflow-hidden", className)}>
      {/* Time Labels Column - Narrower on mobile */}
      <div className="w-12 sm:w-16 flex-shrink-0 border-r bg-muted/30">
        <ScrollArea className="h-full" ref={scrollAreaRef}>
          <div className="relative">
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
        </ScrollArea>
      </div>

      {/* Timeline Content - Touch-friendly */}
      <div
        ref={timelineRef}
        className={cn(
          "relative flex-1 overflow-hidden cursor-pointer",
          "touch-pan-y", // Enable smooth touch scrolling
          isToday && "bg-accent/5"
        )}
        onMouseMove={onTimelineMouseMove}
        onMouseUp={onTimelineMouseUp}
        onMouseLeave={onTimelineMouseLeave}
        onClick={handleTimeSlotClick}
      >
        <ScrollArea className="h-full">
          <div className="relative" style={{ minHeight: hours.length * HOUR_HEIGHT }}>
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

            {/* Time blocks */}
            {!isLoading &&
              dayBlocks.map((block) => (
                <TimeBlock
                  key={block.id}
                  block={block}
                  onClick={() => onBlockClick?.(block)}
                  onDragStart={(e) => onBlockDragStart?.(block, e)}
                  onResizeStart={(e, edge) => onBlockResizeStart?.(block, edge, e)}
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
        </ScrollArea>
      </div>
    </div>
  );
}
