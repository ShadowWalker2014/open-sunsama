import * as React from "react";
import { format, setHours } from "date-fns";
import type { TimeBlock } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui";
import { useTimeBlocksForDate } from "@/hooks/useTimeBlocks";
import { TIMELINE_START_HOUR, TIMELINE_END_HOUR } from "@/hooks/useCalendarDnd";

interface CalendarSidebarProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  currentTaskId?: string;
}

/**
 * Hoverable calendar sidebar showing today's schedule
 */
export function CalendarSidebar({
  isOpen,
  onOpenChange,
  currentTaskId,
}: CalendarSidebarProps) {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: timeBlocks = [] } = useTimeBlocksForDate(today);

  return (
    <>
      {/* Hover trigger zone */}
      <div
        className="fixed right-0 top-0 bottom-0 w-4 z-40"
        onMouseEnter={() => onOpenChange(true)}
      />

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40 transition-opacity"
          onClick={() => onOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 w-80 bg-background border-l shadow-xl z-50",
          "transition-transform duration-200 ease-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        onMouseLeave={() => onOpenChange(false)}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b">
            <h2 className="font-semibold">
              {format(new Date(), "EEEE, MMMM d")}
            </h2>
            <p className="text-sm text-muted-foreground">Today&apos;s schedule</p>
          </div>

          {/* Timeline */}
          <ScrollArea className="flex-1">
            <MiniTimeline
              timeBlocks={timeBlocks}
              currentTaskId={currentTaskId}
            />
          </ScrollArea>
        </div>
      </div>
    </>
  );
}

interface MiniTimelineProps {
  timeBlocks: TimeBlock[];
  currentTaskId?: string;
}

const MINI_HOUR_HEIGHT = 48; // Smaller hour height for mini timeline

function MiniTimeline({ timeBlocks, currentTaskId }: MiniTimelineProps) {
  const hours = React.useMemo(() => {
    return Array.from(
      { length: TIMELINE_END_HOUR - TIMELINE_START_HOUR + 1 },
      (_, i) => i + TIMELINE_START_HOUR
    );
  }, []);

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTimePosition =
    (currentHour - TIMELINE_START_HOUR) * MINI_HOUR_HEIGHT +
    (currentMinute / 60) * MINI_HOUR_HEIGHT;

  return (
    <div className="relative p-4">
      {/* Hour grid */}
      {hours.map((hour) => (
        <div
          key={hour}
          className="relative border-b border-border/30"
          style={{ height: MINI_HOUR_HEIGHT }}
        >
          <span className="absolute -top-2 text-xs text-muted-foreground">
            {format(setHours(new Date(), hour), "ha").toLowerCase()}
          </span>
        </div>
      ))}

      {/* Current time indicator */}
      <div
        className="absolute left-4 right-4 z-30 flex items-center pointer-events-none"
        style={{ top: currentTimePosition + 16 }} // +16 for padding
      >
        <div className="h-2.5 w-2.5 rounded-full bg-red-500 -ml-1" />
        <div className="h-0.5 flex-1 bg-red-500" />
      </div>

      {/* Time blocks */}
      {timeBlocks.map((block) => {
        const startTime = new Date(block.startTime);
        const endTime = new Date(block.endTime);
        const startHour = startTime.getHours();
        const startMinute = startTime.getMinutes();
        const durationMins =
          (endTime.getTime() - startTime.getTime()) / (1000 * 60);

        const top =
          (startHour - TIMELINE_START_HOUR) * MINI_HOUR_HEIGHT +
          (startMinute / 60) * MINI_HOUR_HEIGHT;
        const height = (durationMins / 60) * MINI_HOUR_HEIGHT;

        const isCurrentTask = block.taskId === currentTaskId;

        return (
          <div
            key={block.id}
            className={cn(
              "absolute left-12 right-4 rounded px-2 py-1 text-xs truncate",
              isCurrentTask
                ? "bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2"
                : "bg-muted text-muted-foreground"
            )}
            style={{
              top: top + 16, // +16 for padding
              height: Math.max(height, 20),
            }}
          >
            {block.title}
          </div>
        );
      })}
    </div>
  );
}
