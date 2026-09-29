import * as React from "react";
import {
  format,
  addDays,
  startOfDay,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
  isSameMonth,
  isSameDay,
  isToday,
  subMonths,
  addMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

/** Month calendar in a popover, with Today / Tomorrow / Next Mon shortcuts. */
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export function MobileDatePicker({
  value,
  onChange,
  children,
}: {
  value: Date;
  onChange: (date: Date) => void;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState(() => startOfMonth(value));

  // Reset view month when value changes
  React.useEffect(() => {
    setViewMonth(startOfMonth(value));
  }, [value]);

  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);
    const paddingBefore: (Date | null)[] = Array(startDayOfWeek).fill(null);
    const totalDays = paddingBefore.length + daysInMonth.length;
    const paddingAfter: (Date | null)[] = Array(
      totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7)
    ).fill(null);
    return [...paddingBefore, ...daysInMonth, ...paddingAfter];
  }, [viewMonth]);

  const handleSelect = (date: Date) => {
    onChange(date);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start" sideOffset={8}>
        {/* Quick Navigation */}
        <div className="p-3 border-b border-border/50 flex items-center gap-2">
          <button
            onClick={() => {
              onChange(startOfDay(new Date()));
              setOpen(false);
            }}
            className={cn(
              "px-3 py-1.5 text-xs font-medium rounded-full transition-colors",
              isSameDay(value, new Date())
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80 text-foreground"
            )}
          >
            Today
          </button>
          <button
            onClick={() => {
              onChange(addDays(startOfDay(new Date()), 1));
              setOpen(false);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            Tomorrow
          </button>
          <button
            onClick={() => {
              const today = new Date();
              const dayOfWeek = today.getDay();
              const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek;
              onChange(addDays(startOfDay(today), daysUntilMonday));
              setOpen(false);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted hover:bg-muted/80 text-foreground transition-colors"
          >
            Next Mon
          </button>
        </div>

        {/* Calendar */}
        <div className="p-3">
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <button
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="p-1.5 rounded-md hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="h-8 flex items-center justify-center text-xs text-muted-foreground/60 font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-9" />;
              }

              const isCurrentMonth = isSameMonth(day, viewMonth);
              const isSelected = isSameDay(day, value);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => handleSelect(day)}
                  className={cn(
                    "h-9 w-full flex items-center justify-center text-sm rounded-md transition-colors",
                    !isCurrentMonth && "text-muted-foreground/30",
                    isCurrentMonth &&
                      !isSelected &&
                      !isTodayDate &&
                      "text-foreground hover:bg-muted/50",
                    isTodayDate &&
                      !isSelected &&
                      "bg-primary/15 text-primary font-medium",
                    isSelected &&
                      "bg-primary text-primary-foreground font-medium"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
