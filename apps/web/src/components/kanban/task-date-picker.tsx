import * as React from "react";
import {
  format,
  addDays,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  getDay,
  parse,
} from "date-fns";
import {
  Archive,
  CalendarArrowUp,
  ChevronLeft,
  ChevronRight,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui";
import { toast } from "@/hooks/use-toast";

export interface DatePickerPopoverRef {
  open: () => void;
  close: () => void;
  focusInput: () => void;
}

interface DatePickerPopoverProps {
  /** Current scheduled date in YYYY-MM-DD format or null for backlog */
  value: string | null;
  /** Callback when date changes */
  onChange: (date: string | null) => void;
  /** Task title for toast messages */
  taskTitle?: string;
  /** Classes for the trigger button. */
  className?: string;
  /** Replaces the trigger's text, e.g. an icon plus a short date. */
  children?: React.ReactNode;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export const DatePickerPopover = React.forwardRef<
  DatePickerPopoverRef,
  DatePickerPopoverProps
>(function DatePickerPopover(
  { value, onChange, taskTitle, className, children },
  ref
) {
  const [open, setOpen] = React.useState(false);
  const [viewMonth, setViewMonth] = React.useState(() => {
    if (value) {
      return parse(value, "yyyy-MM-dd", new Date());
    }
    return new Date();
  });
  const [dateInputValue, setDateInputValue] = React.useState("");
  const [showDateInput, setShowDateInput] = React.useState(false);
  const dateInputRef = React.useRef<HTMLInputElement>(null);

  // Expose methods via ref
  React.useImperativeHandle(
    ref,
    () => ({
      open: () => setOpen(true),
      close: () => setOpen(false),
      focusInput: () => {
        setShowDateInput(true);
        setTimeout(() => dateInputRef.current?.focus(), 0);
      },
    }),
    []
  );

  // Reset view month when value changes
  React.useEffect(() => {
    if (value) {
      setViewMonth(parse(value, "yyyy-MM-dd", new Date()));
    }
  }, [value]);

  // Focus input when shown
  React.useEffect(() => {
    if (showDateInput && dateInputRef.current) {
      dateInputRef.current.focus();
      dateInputRef.current.select();
    }
  }, [showDateInput]);

  // Generate calendar days for the current view month
  const calendarDays = React.useMemo(() => {
    const monthStart = startOfMonth(viewMonth);
    const monthEnd = endOfMonth(viewMonth);
    const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

    // Get the day of week for the first day (0 = Sunday)
    const startDayOfWeek = getDay(monthStart);

    // Add padding days before the month starts
    const paddingBefore: (Date | null)[] = Array(startDayOfWeek).fill(null);

    // Add padding days after to complete the grid (6 rows max)
    const totalDays = paddingBefore.length + daysInMonth.length;
    const paddingAfter: (Date | null)[] = Array(
      totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7)
    ).fill(null);

    return [...paddingBefore, ...daysInMonth, ...paddingAfter];
  }, [viewMonth]);

  const selectedDate = value ? parse(value, "yyyy-MM-dd", new Date()) : null;

  const handleDateSelect = (date: Date) => {
    const formattedDate = format(date, "yyyy-MM-dd");
    onChange(formattedDate);
    setOpen(false);
    if (taskTitle) {
      toast({
        title: "Date updated",
        description: `"${taskTitle}" scheduled for ${format(date, "EEEE, MMM d")}.`,
      });
    }
  };

  const handleSnoozeOneDay = () => {
    const tomorrow = addDays(new Date(), 1);
    const formattedDate = format(tomorrow, "yyyy-MM-dd");
    onChange(formattedDate);
    setOpen(false);
    if (taskTitle) {
      toast({
        title: "Snoozed one day",
        description: `"${taskTitle}" scheduled for ${format(tomorrow, "EEEE, MMM d")}.`,
      });
    }
  };

  const handleMoveToNextWeek = () => {
    const today = new Date();
    const nextMonday = addDays(startOfWeek(today, { weekStartsOn: 1 }), 7);
    const formattedDate = format(nextMonday, "yyyy-MM-dd");
    onChange(formattedDate);
    setOpen(false);
    if (taskTitle) {
      toast({
        title: "Moved to next week",
        description: `"${taskTitle}" scheduled for ${format(nextMonday, "EEEE, MMM d")}.`,
      });
    }
  };

  const handleMoveToBacklog = () => {
    onChange(null);
    setOpen(false);
    if (taskTitle) {
      toast({
        title: "Moved to backlog",
        description: `"${taskTitle}" removed from schedule.`,
      });
    }
  };

  const handleDateInputSubmit = () => {
    const trimmed = dateInputValue.trim();
    if (!trimmed) {
      setShowDateInput(false);
      return;
    }

    // Try to parse various date formats
    const today = new Date();
    let parsedDate: Date | null = null;

    // Try common formats
    const formats = [
      "yyyy-MM-dd",
      "MM/dd/yyyy",
      "MM-dd-yyyy",
      "M/d/yyyy",
      "M-d-yyyy",
      "MMM d",
      "MMMM d",
      "d MMM",
      "d MMMM",
    ];

    for (const fmt of formats) {
      try {
        const result = parse(trimmed, fmt, today);
        if (!isNaN(result.getTime())) {
          parsedDate = result;
          break;
        }
      } catch {
        // Continue trying other formats
      }
    }

    if (parsedDate) {
      handleDateSelect(parsedDate);
    }

    setShowDateInput(false);
    setDateInputValue("");
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setShowDateInput(false);
      setDateInputValue("");
    }
  };

  // Display value for the trigger button
  const displayValue = value
    ? format(parse(value, "yyyy-MM-dd", new Date()), "MMM d")
    : "No date";

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "text-sm font-medium transition-colors hover:text-foreground",
            value ? "text-foreground" : "text-muted-foreground",
            className
          )}
        >
          {children ?? displayValue}
        </button>
      </PopoverTrigger>
      <PopoverContent
        className="w-64 p-0"
        align="start"
        side="bottom"
        sideOffset={4}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Move section - Quick actions */}
        <div className="p-2 border-b border-border/50">
          <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5 px-1">
            Move:
          </div>

          {/* Set date input */}
          {showDateInput ? (
            <div className="px-1 mb-1">
              <Input
                ref={dateInputRef}
                type="text"
                value={dateInputValue}
                onChange={(e) => setDateInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleDateInputSubmit();
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    setShowDateInput(false);
                    setDateInputValue("");
                  }
                }}
                onBlur={() => {
                  if (!dateInputValue.trim()) {
                    setShowDateInput(false);
                  }
                }}
                placeholder="Jan 27, 2024"
                className="h-7 text-xs"
              />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowDateInput(true)}
              className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors"
            >
              <span className="text-muted-foreground">Set start date @</span>
              <span className="text-[10px] text-muted-foreground/60 px-1 py-0.5 rounded bg-muted/50">
                @
              </span>
            </button>
          )}

          {/* Snooze one day */}
          <button
            type="button"
            onClick={handleSnoozeOneDay}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Sun className="h-3.5 w-3.5 text-muted-foreground" />
              Snooze one day
            </span>
            <span className="text-[10px] text-muted-foreground/60 px-1 py-0.5 rounded bg-muted/50">
              D
            </span>
          </button>

          {/* Move to next week */}
          <button
            type="button"
            onClick={handleMoveToNextWeek}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <CalendarArrowUp className="h-3.5 w-3.5 text-muted-foreground" />
              Move to next week
            </span>
            <span className="text-[10px] text-muted-foreground/60 px-1 py-0.5 rounded bg-muted/50 flex items-center gap-0.5">
              <span className="text-[9px]">⇧</span>Z
            </span>
          </button>

          {/* Move to backlog */}
          <button
            type="button"
            onClick={handleMoveToBacklog}
            className="w-full flex items-center justify-between px-2 py-1.5 text-xs rounded hover:bg-muted/50 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Archive className="h-3.5 w-3.5 text-muted-foreground" />
              Move to backlog
            </span>
            <span className="text-[10px] text-muted-foreground/60 px-1 py-0.5 rounded bg-muted/50">
              Z
            </span>
          </button>
        </div>

        {/* Calendar section */}
        <div className="p-2">
          <div className="text-[10px] text-muted-foreground/60 uppercase tracking-wider mb-1.5 px-1">
            Start date:
          </div>

          {/* Month navigation */}
          <div className="flex items-center justify-between mb-2">
            <button
              type="button"
              onClick={() => setViewMonth(subMonths(viewMonth, 1))}
              className="p-1 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-medium">
              {format(viewMonth, "MMMM yyyy")}
            </span>
            <button
              type="button"
              onClick={() => setViewMonth(addMonths(viewMonth, 1))}
              className="p-1 rounded hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((day) => (
              <div
                key={day}
                className="h-6 flex items-center justify-center text-[10px] text-muted-foreground/60 font-medium"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, index) => {
              if (!day) {
                return <div key={`empty-${index}`} className="h-7" />;
              }

              const isCurrentMonth = isSameMonth(day, viewMonth);
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={cn(
                    "h-7 w-full flex items-center justify-center text-xs rounded transition-colors",
                    !isCurrentMonth && "text-muted-foreground/30",
                    isCurrentMonth &&
                      !isSelected &&
                      !isTodayDate &&
                      "text-foreground hover:bg-muted/50",
                    isTodayDate &&
                      !isSelected &&
                      "bg-primary/20 text-primary font-medium",
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
});

