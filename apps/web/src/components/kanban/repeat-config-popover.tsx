import * as React from "react";
import { format } from "date-fns";
import { Repeat, ChevronDown, Check } from "lucide-react";
import type {
  RecurrenceType,
  DayOfWeek,
  CreateTaskSeriesInput,
} from "@open-sunsama/types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Input,
  Label,
} from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Recurrence type options with labels
 */
const RECURRENCE_TYPE_OPTIONS: { value: RecurrenceType; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekdays", label: "Weekdays" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly_date", label: "Monthly on day..." },
  { value: "monthly_weekday", label: "Monthly on the first..." },
  { value: "yearly", label: "Yearly" },
];

/**
 * Day of week options
 */
const DAY_OF_WEEK_OPTIONS: { value: DayOfWeek; label: string }[] = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

/**
 * Week frequency options
 */
const WEEK_FREQUENCY_OPTIONS = [
  { value: 1, label: "Every week" },
  { value: 2, label: "Every other week" },
  { value: 3, label: "Every third week" },
  { value: 4, label: "Every fourth week" },
  { value: 6, label: "Every sixth week" },
];

/**
 * Month frequency options
 */
const MONTH_FREQUENCY_OPTIONS = [
  { value: 1, label: "Every month" },
  { value: 2, label: "Every other month" },
  { value: 3, label: "Every 3 months" },
  { value: 6, label: "Every 6 months" },
];

/**
 * Week of month options for monthly_weekday
 */
const WEEK_OF_MONTH_OPTIONS = [
  { value: 1, label: "first" },
  { value: 2, label: "second" },
  { value: 3, label: "third" },
  { value: 4, label: "fourth" },
  { value: 5, label: "last" },
];

interface RepeatConfigPopoverProps {
  /**
   * Task title for display
   */
  title: string;
  /**
   * Optional initial configuration
   */
  initialConfig?: Partial<CreateTaskSeriesInput>;
  /**
   * Called when user saves the configuration
   */
  onSave: (config: CreateTaskSeriesInput) => void;
  /**
   * Optional trigger element (defaults to a button with repeat icon)
   */
  trigger?: React.ReactNode;
  /**
   * Whether the popover is open (controlled)
   */
  open?: boolean;
  /**
   * Called when open state changes
   */
  onOpenChange?: (open: boolean) => void;
}

export function RepeatConfigPopover({
  title,
  initialConfig,
  onSave,
  trigger,
  open,
  onOpenChange,
}: RepeatConfigPopoverProps) {
  // Form state
  const [recurrenceType, setRecurrenceType] = React.useState<RecurrenceType>(
    initialConfig?.recurrenceType ?? "weekly"
  );
  const [daysOfWeek, setDaysOfWeek] = React.useState<DayOfWeek[]>(
    initialConfig?.daysOfWeek ?? [new Date().getDay() as DayOfWeek]
  );
  const [frequency, setFrequency] = React.useState(
    initialConfig?.frequency ?? 1
  );
  const [startTime, setStartTime] = React.useState(
    initialConfig?.startTime ?? "09:00"
  );
  const [dayOfMonth, setDayOfMonth] = React.useState(
    initialConfig?.dayOfMonth ?? new Date().getDate()
  );
  const [weekOfMonth, setWeekOfMonth] = React.useState(
    initialConfig?.weekOfMonth ?? 1
  );
  const [dayOfWeekMonthly, setDayOfWeekMonthly] = React.useState<DayOfWeek>(
    initialConfig?.dayOfWeekMonthly ?? (new Date().getDay() as DayOfWeek)
  );

  const handleDayToggle = (day: DayOfWeek) => {
    setDaysOfWeek((prev) => {
      if (prev.includes(day)) {
        // Don't allow removing the last day
        if (prev.length === 1) return prev;
        return prev.filter((d) => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
  };

  const handleSave = () => {
    const config: CreateTaskSeriesInput = {
      title,
      recurrenceType,
      frequency,
      startTime,
      startDate: format(new Date(), "yyyy-MM-dd"),
    };

    // Add type-specific fields
    if (recurrenceType === "weekly") {
      config.daysOfWeek = daysOfWeek;
    } else if (recurrenceType === "monthly_date") {
      config.dayOfMonth = dayOfMonth;
    } else if (recurrenceType === "monthly_weekday") {
      config.weekOfMonth = weekOfMonth as 1 | 2 | 3 | 4 | 5;
      config.dayOfWeekMonthly = dayOfWeekMonthly;
    }

    onSave(config);
    onOpenChange?.(false);
  };

  // Get frequency options based on recurrence type
  const frequencyOptions =
    recurrenceType === "weekly"
      ? WEEK_FREQUENCY_OPTIONS
      : recurrenceType?.startsWith("monthly")
        ? MONTH_FREQUENCY_OPTIONS
        : WEEK_FREQUENCY_OPTIONS;

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" className="gap-2">
            <Repeat className="h-4 w-4" />
            Repeat
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="start">
        <div className="space-y-4">
          {/* Recurrence Type */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Repeats
            </Label>
            <Select
              value={recurrenceType}
              onValueChange={(v) => setRecurrenceType(v as RecurrenceType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECURRENCE_TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weekly: Day Selection */}
          {recurrenceType === "weekly" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                On
              </Label>
              <div className="space-y-1">
                {DAY_OF_WEEK_OPTIONS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    onClick={() => handleDayToggle(day.value)}
                    className={cn(
                      "flex w-full items-center justify-between rounded-md px-3 py-2 text-sm",
                      "hover:bg-accent transition-colors",
                      daysOfWeek.includes(day.value) && "bg-accent"
                    )}
                  >
                    <span>{day.label}</span>
                    {daysOfWeek.includes(day.value) && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Monthly by Date */}
          {recurrenceType === "monthly_date" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                On day
              </Label>
              <Input
                type="number"
                min={1}
                max={31}
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(parseInt(e.target.value) || 1)}
              />
            </div>
          )}

          {/* Monthly by Weekday */}
          {recurrenceType === "monthly_weekday" && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">
                On the
              </Label>
              <div className="flex gap-2">
                <Select
                  value={String(weekOfMonth)}
                  onValueChange={(v) =>
                    setWeekOfMonth(parseInt(v) as 1 | 2 | 3 | 4 | 5)
                  }
                >
                  <SelectTrigger className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEK_OF_MONTH_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={String(dayOfWeekMonthly)}
                  onValueChange={(v) =>
                    setDayOfWeekMonthly(parseInt(v) as DayOfWeek)
                  }
                >
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAY_OF_WEEK_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={String(opt.value)}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Frequency (only for weekly/monthly) */}
          {(recurrenceType === "weekly" ||
            recurrenceType?.startsWith("monthly")) && (
            <div className="space-y-2">
              <Select
                value={String(frequency)}
                onValueChange={(v) => setFrequency(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((opt) => (
                    <SelectItem key={opt.value} value={String(opt.value)}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Start Time */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              At roughly
            </Label>
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          {/* Save Button */}
          <Button onClick={handleSave} className="w-full">
            Save
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Format days of week for display
 */
export function formatDaysOfWeek(days: DayOfWeek[]): string {
  if (!days || days.length === 0) return "";
  if (days.length === 7) return "Every day";
  if (
    days.length === 5 &&
    [1, 2, 3, 4, 5].every((d) => days.includes(d as DayOfWeek))
  ) {
    return "Weekdays";
  }
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days.map((d) => dayNames[d]).join(", ");
}

/**
 * Get a human-readable schedule description
 */
export function getScheduleDescription(config: {
  recurrenceType: RecurrenceType;
  frequency: number;
  daysOfWeek?: DayOfWeek[];
  dayOfMonth?: number;
  weekOfMonth?: number;
  dayOfWeekMonthly?: DayOfWeek;
}): string {
  const {
    recurrenceType,
    frequency,
    daysOfWeek,
    dayOfMonth,
    weekOfMonth,
    dayOfWeekMonthly,
  } = config;
  const weekNames = ["", "first", "second", "third", "fourth", "last"];
  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  let desc = "";
  const freqPrefix =
    frequency === 1
      ? "every"
      : frequency === 2
        ? "every other"
        : `every ${frequency}${frequency === 3 ? "rd" : "th"}`;

  switch (recurrenceType) {
    case "daily":
      desc = frequency === 1 ? "every day" : `${freqPrefix} day`;
      break;
    case "weekdays":
      desc = "every weekday";
      break;
    case "weekly":
      if (daysOfWeek && daysOfWeek.length > 0) {
        const days = formatDaysOfWeek(daysOfWeek);
        desc = `${freqPrefix} week on ${days}`;
      } else {
        desc = `${freqPrefix} week`;
      }
      break;
    case "monthly_date":
      const ordinal =
        dayOfMonth === 1
          ? "1st"
          : dayOfMonth === 2
            ? "2nd"
            : dayOfMonth === 3
              ? "3rd"
              : `${dayOfMonth}th`;
      desc = `${freqPrefix} month on the ${ordinal}`;
      break;
    case "monthly_weekday":
      if (weekOfMonth && dayOfWeekMonthly !== undefined) {
        desc = `${freqPrefix} month on the ${weekNames[weekOfMonth]} ${dayNames[dayOfWeekMonthly]}`;
      }
      break;
    case "yearly":
      desc = `${freqPrefix} year`;
      break;
  }

  return desc.charAt(0).toUpperCase() + desc.slice(1);
}
