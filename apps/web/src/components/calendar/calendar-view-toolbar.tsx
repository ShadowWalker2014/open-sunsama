import { format, isWithinInterval, startOfDay, endOfDay } from "date-fns";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui";
import type { TimeBlock, CalendarViewMode } from "@open-sunsama/types";
import { cn } from "@/lib/utils";

interface CalendarViewToolbarProps {
  /**
   * The user's anchor date — also what `Today` resets to. The button only
   * highlights when today is within the visible range, not just when
   * `selectedDate === today` (which would feel wrong on the week / month
   * view where the user expects "Today" to mean "today is on screen").
   */
  selectedDate: Date;
  /**
   * The full window the calendar is displaying. For "day" mode this is
   * just the selected date; for "3-day" / "week" / "month" it's the
   * range. Used to label the toolbar (e.g. "Aug 1 – 7" for a week).
   */
  rangeStart: Date;
  rangeEnd: Date;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  timeBlocks: TimeBlock[];
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  className?: string;
}

const VIEW_MODE_LABELS: Record<CalendarViewMode, string> = {
  day: "Day",
  "3-day": "3 days",
  week: "Week",
  month: "Month",
};

const VIEW_MODES: CalendarViewMode[] = ["day", "3-day", "week", "month"];

function describeRange(
  rangeStart: Date,
  rangeEnd: Date,
  viewMode: CalendarViewMode
): { primary: string; secondary: string } {
  if (viewMode === "day") {
    return {
      primary: format(rangeStart, "EEEE"),
      secondary: format(rangeStart, "MMM d, yyyy"),
    };
  }

  if (viewMode === "month") {
    return {
      primary: format(rangeStart, "MMMM"),
      secondary: format(rangeStart, "yyyy"),
    };
  }

  // 3-day / week — show the visible window.
  const sameMonth = rangeStart.getMonth() === rangeEnd.getMonth();
  const sameYear = rangeStart.getFullYear() === rangeEnd.getFullYear();

  let secondary: string;
  if (sameMonth && sameYear) {
    secondary = `${format(rangeStart, "MMM d")} – ${format(rangeEnd, "d, yyyy")}`;
  } else if (sameYear) {
    secondary = `${format(rangeStart, "MMM d")} – ${format(rangeEnd, "MMM d, yyyy")}`;
  } else {
    secondary = `${format(rangeStart, "MMM d, yyyy")} – ${format(rangeEnd, "MMM d, yyyy")}`;
  }

  return {
    primary: viewMode === "week" ? "This week" : "3 days",
    secondary,
  };
}

export function CalendarViewToolbar({
  selectedDate: _selectedDate,
  rangeStart,
  rangeEnd,
  viewMode,
  onViewModeChange,
  timeBlocks,
  onPreviousDay,
  onNextDay,
  onToday,
}: CalendarViewToolbarProps) {
  // "Today" is highlighted when today's date falls anywhere in the visible
  // range — for day view that collapses back to "selectedDate is today",
  // but for week / month it correctly stays lit while the user navigates
  // around the current week / month.
  const today = new Date();
  const todayInRange = isWithinInterval(today, {
    start: startOfDay(rangeStart),
    end: endOfDay(rangeEnd),
  });
  const { primary, secondary } = describeRange(rangeStart, rangeEnd, viewMode);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b px-3 sm:px-4 py-2 sm:py-3 bg-background gap-2 sm:gap-4">
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
        {/* Date Navigation */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onPreviousDay}
            aria-label="Previous range"
            className="h-10 w-10 sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant={todayInRange ? "default" : "outline"}
            onClick={onToday}
            className="min-w-[60px] sm:min-w-[70px] h-10 sm:h-9 text-sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextDay}
            aria-label="Next range"
            className="h-10 w-10 sm:h-9 sm:w-9"
          >
            <ChevronRight className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
        </div>

        {/* Selected Range Display */}
        <div className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5 text-muted-foreground hidden sm:block" />
          <div>
            <h2 className="text-base sm:text-lg font-semibold leading-none">
              {primary}
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {secondary}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 justify-between sm:justify-end">
        {/* View mode selector — segmented control */}
        <div
          className="inline-flex items-center rounded-md border border-border/50 bg-muted/30 p-0.5"
          role="tablist"
          aria-label="Calendar view"
        >
          {VIEW_MODES.map((mode) => (
            <button
              key={mode}
              role="tab"
              aria-selected={viewMode === mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                "px-2.5 sm:px-3 h-7 sm:h-8 rounded text-xs sm:text-[13px] font-medium transition-colors",
                viewMode === mode
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {VIEW_MODE_LABELS[mode]}
            </button>
          ))}
        </div>

        {/* Block count badge — only on day view (per-day signal) */}
        {viewMode === "day" && timeBlocks.length > 0 && (
          <span className="hidden sm:inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
            {timeBlocks.length} block{timeBlocks.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>
    </div>
  );
}
