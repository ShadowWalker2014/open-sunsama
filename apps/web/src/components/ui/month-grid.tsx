import * as React from "react";
import {
  addDays,
  addMonths,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * A compact month calendar for picking one day: six fixed weeks starting
 * on Monday, so the popover never changes height between months.
 */
export function MonthGrid({
  selected,
  onSelect,
}: {
  selected: Date | null;
  onSelect: (date: Date) => void;
}) {
  const [month, setMonth] = React.useState(() =>
    startOfMonth(selected ?? new Date())
  );
  const first = startOfWeek(month, { weekStartsOn: 1 });
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i));

  return (
    <div className="w-64 p-2">
      <div className="mb-1 flex items-center justify-between px-1">
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setMonth((m) => subMonths(m, 1))}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold">{format(month, "MMMM yyyy")}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 text-center text-[10px] font-medium uppercase text-muted-foreground/70">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <span key={i} className="py-1">
            {d}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {days.map((day) => {
          const isSelected = !!selected && isSameDay(day, selected);
          return (
            <button
              key={day.toISOString()}
              type="button"
              onClick={() => onSelect(day)}
              aria-label={format(day, "EEEE, MMMM d, yyyy")}
              aria-pressed={isSelected}
              className={cn(
                "mx-auto flex h-8 w-8 items-center justify-center rounded-full text-[13px] tabular-nums transition-colors",
                !isSameMonth(day, month) && "text-muted-foreground/40",
                isSelected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : isToday(day)
                    ? "font-semibold text-primary hover:bg-accent"
                    : "hover:bg-accent"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
