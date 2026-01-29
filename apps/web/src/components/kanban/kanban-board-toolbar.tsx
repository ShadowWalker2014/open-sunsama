import { format } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui";

interface KanbanBoardToolbarProps {
  firstVisibleDate: Date | null;
  lastVisibleDate: Date | null;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
}

export function KanbanBoardToolbar({
  firstVisibleDate,
  lastVisibleDate,
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToday,
}: KanbanBoardToolbarProps) {
  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onNavigatePrevious}
            title="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onNavigateToday}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNavigateNext}
            title="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Date Range */}
        {firstVisibleDate && lastVisibleDate && (
          <h2 className="text-lg font-semibold">
            {format(firstVisibleDate, "MMM d")} -{" "}
            {format(lastVisibleDate, "MMM d, yyyy")}
          </h2>
        )}
      </div>
    </div>
  );
}
