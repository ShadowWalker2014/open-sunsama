import {
  format,
  isToday,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { Button } from "@/components/ui";
import type { TimeBlock } from "@open-sunsama/types";

interface CalendarViewToolbarProps {
  selectedDate: Date;
  timeBlocks: TimeBlock[];
  onPreviousDay: () => void;
  onNextDay: () => void;
  onToday: () => void;
  className?: string;
}

export function CalendarViewToolbar({
  selectedDate,
  timeBlocks,
  onPreviousDay,
  onNextDay,
  onToday,
}: CalendarViewToolbarProps) {
  const isTodaySelected = isToday(selectedDate);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b px-3 sm:px-4 py-2 sm:py-3 bg-background gap-2 sm:gap-4">
      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
        {/* Date Navigation - Touch-friendly on mobile */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onPreviousDay}
            aria-label="Previous day"
            className="h-10 w-10 sm:h-9 sm:w-9"
          >
            <ChevronLeft className="h-5 w-5 sm:h-4 sm:w-4" />
          </Button>
          <Button
            variant={isTodaySelected ? "default" : "outline"}
            onClick={onToday}
            className="min-w-[60px] sm:min-w-[70px] h-10 sm:h-9 text-sm"
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNextDay}
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
  );
}
