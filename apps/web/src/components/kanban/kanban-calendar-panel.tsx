import * as React from "react";
import { format, isSameDay, setHours, addMinutes } from "date-fns";
import type { TimeBlock as TimeBlockType } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { useTimeBlocks } from "@/hooks/useTimeBlocks";
import { TimeBlock } from "@/components/calendar/time-block";
import {
  HOUR_HEIGHT,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  calculateYFromTime,
} from "@/hooks/useCalendarDnd";

interface KanbanCalendarPanelProps {
  date: Date;
  className?: string;
  onBlockClick?: (block: TimeBlockType) => void;
  onTimeSlotClick?: (date: Date, startTime: Date, endTime: Date) => void;
  onViewTask?: (taskId: string) => void;
}

/**
 * Compact calendar panel for the kanban board right side.
 * Shows time blocks for the active day with current time marker.
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
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  const hours = React.useMemo(
    () => Array.from({ length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 }, (_, i) => i + TIMELINE_START_HOUR),
    []
  );

  const now = new Date();
  const isToday = isSameDay(date, now);

  // Current time position - updates every minute
  const [currentTimePosition, setCurrentTimePosition] = React.useState<number | null>(null);

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
  }, [dateString, isToday]);

  return (
    <div className={cn("flex flex-col h-full bg-background border-l", className)}>
      {/* Header */}
      <div className="flex-shrink-0 px-3 py-2 border-b">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {format(date, "EEE")}
        </div>
        <div className="text-lg font-semibold">
          {format(date, "MMM d")}
        </div>
      </div>

      {/* Timeline */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overflow-x-hidden"
      >
        <div
          ref={contentRef}
          className="flex"
          style={{ minHeight: hours.length * HOUR_HEIGHT }}
        >
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
            className={cn("relative flex-1", isToday && "bg-primary/[0.02]")}
            onClick={(e) => {
              // Handle click on empty space to create time block
              if (!onTimeSlotClick) return;
              
              // Don't trigger if clicking on a time block
              const target = e.target as HTMLElement;
              if (target.closest('[data-time-block]')) return;
              
              // Calculate clicked time from position
              const rect = e.currentTarget.getBoundingClientRect();
              const y = e.clientY - rect.top + (scrollContainerRef.current?.scrollTop || 0);
              const hourOffset = y / HOUR_HEIGHT;
              const hour = Math.floor(TIMELINE_START_HOUR + hourOffset);
              const minutes = Math.floor((hourOffset % 1) * 60);
              
              // Snap to 15-minute intervals
              const snappedMinutes = Math.floor(minutes / 15) * 15;
              const startTime = setHours(date, hour);
              startTime.setMinutes(snappedMinutes, 0, 0);
              const endTime = addMinutes(startTime, 30);
              
              onTimeSlotClick(date, startTime, endTime);
            }}
          >
            {/* Hour grid lines */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="border-b border-border/20 cursor-pointer"
                style={{ height: HOUR_HEIGHT }}
              />
            ))}

            {/* Half-hour lines */}
            {hours.map((hour) => (
              <div
                key={`${hour}-half`}
                className="absolute left-0 right-0 border-b border-border/10"
                style={{ top: (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT + HOUR_HEIGHT / 2 }}
              />
            ))}

            {/* Current time indicator - thin red line */}
            {currentTimePosition !== null && (
              <div
                className="absolute left-0 right-0 z-30 pointer-events-none"
                style={{ top: currentTimePosition }}
              >
                <div className="h-px bg-red-500" />
              </div>
            )}

            {/* Time blocks */}
            {dayBlocks.map((block) => (
              <TimeBlock
                key={block.id}
                block={block}
                onClick={() => onBlockClick?.(block)}
                onViewTask={onViewTask}
                isDragging={false}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
