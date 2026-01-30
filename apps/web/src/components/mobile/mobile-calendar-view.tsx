import * as React from "react";
import { format, isSameDay, setHours, addMinutes, startOfDay } from "date-fns";
import { Menu } from "lucide-react";
import type { Task, TimeBlock as TimeBlockType } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import {
  useTasks,
  useTimeBlocksForDate,
  useCreateTimeBlock,
} from "@/hooks";
import {
  HOUR_HEIGHT,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  calculateYFromTime,
  calculateTimeFromY,
  snapToInterval,
  SNAP_INTERVAL,
} from "@/hooks/useCalendarDnd";
import {
  ScrollArea,
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui";
import { TimeBlock } from "@/components/calendar/time-block";
import { UnscheduledTasksDrawer } from "./mobile-unscheduled-drawer";

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
 * MobileCalendarView - Full-width vertical timeline for mobile devices
 * Matches Sunsama mobile design with hamburger menu for unscheduled tasks
 */
export function MobileCalendarView({
  initialDate = new Date(),
  onTaskClick,
  onBlockClick,
  onViewTask,
  onTimeSlotClick,
  className,
}: MobileCalendarViewProps) {
  const [selectedDate] = React.useState<Date>(() => startOfDay(initialDate));
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const scrollAreaRef = React.useRef<HTMLDivElement>(null);
  const timelineRef = React.useRef<HTMLDivElement>(null);

  // Format date for API calls
  const dateString = format(selectedDate, "yyyy-MM-dd");

  // Fetch tasks for selected date
  const { data: allTasks = [], isLoading: isLoadingTasks } = useTasks({
    scheduledDate: dateString,
    limit: 200,
  });

  // Fetch time blocks for selected date
  const { data: timeBlocks = [], isLoading: isLoadingBlocks } =
    useTimeBlocksForDate(dateString);

  // Create time block mutation
  const createTimeBlock = useCreateTimeBlock();

  // Filter tasks that don't have a time block on this day
  const unscheduledTasks = React.useMemo(() => {
    const blockedTaskIds = new Set(
      timeBlocks.filter((b) => b.taskId).map((b) => b.taskId)
    );
    return allTasks.filter(
      (task) => !task.completedAt && !blockedTaskIds.has(task.id)
    );
  }, [allTasks, timeBlocks]);

  // Generate hour markers
  const hours = React.useMemo(() => generateHours(), []);
  const now = new Date();
  const isToday = isSameDay(selectedDate, now);

  // Calculate current time indicator position
  const currentTimePosition = React.useMemo(() => {
    if (!isToday) return null;
    return calculateYFromTime(now);
  }, [isToday, now]);

  // Auto-scroll to current time on mount
  React.useEffect(() => {
    if (isToday && scrollAreaRef.current) {
      // Scroll to 2 hours before current time, or start of day
      const scrollPosition = Math.max(0, (now.getHours() - 2) * HOUR_HEIGHT);

      // Find the scroll viewport within ScrollArea
      const viewport = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (viewport) {
        viewport.scrollTop = scrollPosition;
      }
    }
  }, [isToday]); // Only run on mount or when isToday changes

  // Filter blocks for this day
  const dayBlocks = React.useMemo(() => {
    return timeBlocks.filter((block) =>
      isSameDay(new Date(block.startTime), selectedDate)
    );
  }, [timeBlocks, selectedDate]);

  // Handle tap on empty time slot
  const handleTimeSlotTap = (e: React.MouseEvent<HTMLDivElement>) => {
    // Don't trigger if clicking on a time block
    if ((e.target as HTMLElement).closest("[data-time-block]")) {
      return;
    }

    const container = e.currentTarget;
    const rect = container.getBoundingClientRect();

    // Calculate Y relative to the timeline content
    const relativeY = e.clientY - rect.top;

    // Calculate time from Y position
    const clickedTime = calculateTimeFromY(relativeY, selectedDate);
    const snappedStartTime = snapToInterval(clickedTime, SNAP_INTERVAL);
    const snappedEndTime = addMinutes(snappedStartTime, 60);

    if (onTimeSlotClick) {
      onTimeSlotClick(selectedDate, snappedStartTime, snappedEndTime);
    } else {
      // Default behavior: create a new time block
      createTimeBlock.mutate({
        title: "New Time Block",
        startTime: snappedStartTime,
        endTime: snappedEndTime,
      });
    }
  };

  const isLoading = isLoadingTasks || isLoadingBlocks;

  return (
    <div className={cn("flex h-full flex-col bg-background", className)}>
      {/* Header */}
      <header className="flex items-center gap-3 border-b px-4 py-3">
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                "hover:bg-accent active:bg-accent/80",
                "transition-colors"
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

        <div className="flex-1">
          <h1 className="text-lg font-semibold">
            {format(selectedDate, "EEEE")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {format(selectedDate, "MMMM d")}
          </p>
        </div>
      </header>

      {/* Timeline */}
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div
          className="flex"
          style={{ minHeight: hours.length * HOUR_HEIGHT }}
        >
          {/* Time Labels Column */}
          <div className="w-14 flex-shrink-0 border-r bg-muted/30">
            {hours.map((hour) => (
              <div
                key={hour}
                className="relative border-b border-border/50"
                style={{ height: HOUR_HEIGHT }}
              >
                <span className="absolute -top-2 right-2 text-[11px] text-muted-foreground font-medium tabular-nums">
                  {format(setHours(selectedDate, hour), "HH:mm")}
                </span>
              </div>
            ))}
          </div>

          {/* Timeline Content */}
          <div
            ref={timelineRef}
            className={cn(
              "relative flex-1 cursor-pointer",
              "touch-pan-y",
              isToday && "bg-accent/5"
            )}
            onClick={handleTimeSlotTap}
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

            {/* Current time indicator - Red line */}
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
                  onViewTask={onViewTask}
                />
              ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}
