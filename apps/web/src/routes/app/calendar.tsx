import * as React from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  format,
  addDays,
  startOfWeek,
  addHours,
  setHours,
  setMinutes,
  isToday,
  isSameDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { useTimeBlocksForDateRange } from "@/hooks/useTimeBlocks";
import { cn } from "@/lib/utils";
import {
  Button,
  ScrollArea,
  Skeleton,
} from "@/components/ui";
import { Sidebar } from "@/components/layout/sidebar";

/**
 * Calendar view with time blocks
 * Shows a weekly calendar with time slots and scheduled blocks
 */
function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  // Calculate the week range
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekEnd = addDays(weekStart, 7);

  // Generate days for the week
  const days = React.useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  // Generate hours for the day (6am to 10pm)
  const hours = React.useMemo(() => {
    return Array.from({ length: 17 }, (_, i) => i + 6);
  }, []);

  // Fetch time blocks for the week
  const { data: timeBlocks, isLoading } = useTimeBlocksForDateRange(
    weekStart,
    weekEnd
  );

  const goToPreviousWeek = () => {
    setCurrentDate((d) => addDays(d, -7));
  };

  const goToNextWeek = () => {
    setCurrentDate((d) => addDays(d, 7));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Sidebar - Backlog */}
      <Sidebar className="hidden lg:flex" />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Date Navigation */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Current Date Range */}
            <h2 className="text-lg font-semibold">
              {format(weekStart, "MMM d")} -{" "}
              {format(addDays(weekStart, 6), "MMM d, yyyy")}
            </h2>
          </div>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Time Block
          </Button>
        </div>

        {/* Calendar Grid */}
        <div className="flex flex-1 overflow-hidden">
          {/* Time Labels Column */}
          <div className="w-16 flex-shrink-0 border-r">
            {/* Spacer for header */}
            <div className="h-12 border-b" />
            <ScrollArea className="h-[calc(100%-3rem)]">
              <div className="relative">
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="relative h-16 border-b text-right pr-2"
                  >
                    <span className="absolute -top-2 right-2 text-xs text-muted-foreground">
                      {format(setHours(new Date(), hour), "h a")}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Days Grid */}
          <div className="flex flex-1 overflow-x-auto">
            {days.map((day) => (
              <CalendarDayColumn
                key={day.toISOString()}
                date={day}
                hours={hours}
                timeBlocks={
                  timeBlocks?.filter((tb) =>
                    isSameDay(new Date(tb.startTime), day)
                  ) ?? []
                }
                isLoading={isLoading}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface CalendarDayColumnProps {
  date: Date;
  hours: number[];
  timeBlocks: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    color: string | null;
  }>;
  isLoading: boolean;
}

function CalendarDayColumn({
  date,
  hours,
  timeBlocks,
  isLoading,
}: CalendarDayColumnProps) {
  const today = isToday(date);
  const now = new Date();

  // Calculate current time indicator position
  const currentTimePosition = React.useMemo(() => {
    if (!today) return null;
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    if (currentHour < 6 || currentHour > 22) return null;
    return ((currentHour - 6) * 60 + currentMinute) * (64 / 60); // 64px per hour
  }, [today, now]);

  return (
    <div
      className={cn(
        "flex min-w-[120px] flex-1 flex-col border-r last:border-r-0",
        today && "bg-accent/20"
      )}
    >
      {/* Day Header */}
      <div
        className={cn(
          "sticky top-0 z-10 flex h-12 flex-col items-center justify-center border-b bg-background/95 backdrop-blur",
          today && "bg-accent/20"
        )}
      >
        <p
          className={cn(
            "text-xs font-medium uppercase text-muted-foreground",
            today && "text-primary"
          )}
        >
          {format(date, "EEE")}
        </p>
        <p className={cn("text-lg font-bold", today && "text-primary")}>
          {format(date, "d")}
        </p>
      </div>

      {/* Time Slots */}
      <ScrollArea className="flex-1">
        <div className="relative">
          {/* Hour grid lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-16 border-b hover:bg-accent/50 cursor-pointer transition-colors"
            />
          ))}

          {/* Current time indicator */}
          {currentTimePosition !== null && (
            <div
              className="absolute left-0 right-0 z-20 flex items-center"
              style={{ top: currentTimePosition }}
            >
              <div className="h-2 w-2 rounded-full bg-red-500" />
              <div className="h-0.5 flex-1 bg-red-500" />
            </div>
          )}

          {/* Time blocks */}
          {isLoading ? (
            <div className="absolute inset-0 p-1">
              <Skeleton className="h-24 w-full" />
            </div>
          ) : (
            timeBlocks.map((block) => {
              const startHour =
                new Date(block.startTime).getHours() +
                new Date(block.startTime).getMinutes() / 60;
              const endHour =
                new Date(block.endTime).getHours() +
                new Date(block.endTime).getMinutes() / 60;

              // Only show blocks within our visible range (6am - 11pm)
              if (endHour < 6 || startHour > 23) return null;

              const top = Math.max(0, (startHour - 6) * 64);
              const height = (endHour - startHour) * 64;

              return (
                <div
                  key={block.id}
                  className="absolute left-1 right-1 z-10 cursor-pointer rounded-md border px-2 py-1 transition-all hover:shadow-md"
                  style={{
                    top: `${top}px`,
                    height: `${height}px`,
                    backgroundColor: block.color ?? "hsl(var(--primary))",
                    borderColor: block.color ?? "hsl(var(--primary))",
                  }}
                >
                  <p className="truncate text-xs font-medium text-white">
                    {block.title}
                  </p>
                  <p className="text-xs text-white/80">
                    {format(new Date(block.startTime), "h:mm a")}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

export const Route = createFileRoute("/app/calendar")({
  component: CalendarPage,
});
