import * as React from "react";
import { format } from "date-fns";
import { Repeat, Check, Clock, X } from "lucide-react";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Convert 24h time (HH:MM) to 12h format for display
 */
export function formatTime12Hour(time24: string): string {
  if (!time24) return "";
  const [hours, minutes] = time24.split(":").map(Number);
  if (hours === undefined || minutes === undefined) return "";
  const period = hours >= 12 ? "PM" : "AM";
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
}

/**
 * Parse flexible time input to 24h format (HH:MM)
 * Accepts: "9am", "9:30am", "9:30 AM", "14:00", "2pm", etc.
 */
function parseTimeInput(input: string): string | null {
  if (!input) return null;
  const cleaned = input.trim().toLowerCase();

  // Try parsing 24h format first (HH:MM)
  const match24 = cleaned.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1]!, 10);
    const m = parseInt(match24[2]!, 10);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
  }

  // Try parsing 12h format (with or without minutes)
  const match12 = cleaned.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (match12) {
    let h = parseInt(match12[1]!, 10);
    const m = match12[2] ? parseInt(match12[2], 10) : 0;
    const period = match12[3];

    if (h >= 1 && h <= 12 && m >= 0 && m <= 59) {
      if (period === "pm" && h !== 12) h += 12;
      if (period === "am" && h === 12) h = 0;
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
    }
  }

  return null;
}

/**
 * Optional time input with AM/PM support
 */
interface TimeInputProps {
  value: string; // 24h format or empty
  onChange: (value: string) => void;
  placeholder?: string;
}

function TimeInput({
  value,
  onChange,
  placeholder = "e.g. 9am, 2:30pm",
}: TimeInputProps) {
  const [inputValue, setInputValue] = React.useState(() =>
    value ? formatTime12Hour(value) : ""
  );
  const [isEditing, setIsEditing] = React.useState(false);

  // Update input when external value changes
  React.useEffect(() => {
    if (!isEditing) {
      setInputValue(value ? formatTime12Hour(value) : "");
    }
  }, [value, isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (!inputValue.trim()) {
      onChange("");
      return;
    }
    const parsed = parseTimeInput(inputValue);
    if (parsed) {
      onChange(parsed);
      setInputValue(formatTime12Hour(parsed));
    } else {
      // Reset to previous valid value
      setInputValue(value ? formatTime12Hour(value) : "");
    }
  };

  const handleClear = () => {
    onChange("");
    setInputValue("");
  };

  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        <Clock className="h-4 w-4" />
      </div>
      <Input
        value={inputValue}
        onChange={(e) => {
          setIsEditing(true);
          setInputValue(e.target.value);
        }}
        onBlur={handleBlur}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            (e.target as HTMLInputElement).blur();
          }
        }}
        placeholder={placeholder}
        className="pl-9 pr-8"
      />
      {inputValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </div>
  );
}

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
    initialConfig?.startTime ?? ""
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
      startDate: format(new Date(), "yyyy-MM-dd"),
    };

    // Only include startTime if it's set
    if (startTime) {
      config.startTime = startTime;
    }

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

          {/* Start Time (optional) */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              At roughly (optional)
            </Label>
            <TimeInput value={startTime} onChange={setStartTime} />
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
 * Shared form content for repeat configuration
 */
interface RepeatConfigFormProps {
  title: string;
  initialConfig?: Partial<CreateTaskSeriesInput>;
  onSave: (config: CreateTaskSeriesInput) => void;
  onCancel?: () => void;
}

function RepeatConfigForm({
  title,
  initialConfig,
  onSave,
  onCancel,
}: RepeatConfigFormProps) {
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
    initialConfig?.startTime ?? ""
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
      startDate: format(new Date(), "yyyy-MM-dd"),
    };

    // Only include startTime if it's set
    if (startTime) {
      config.startTime = startTime;
    }

    if (recurrenceType === "weekly") {
      config.daysOfWeek = daysOfWeek;
    } else if (recurrenceType === "monthly_date") {
      config.dayOfMonth = dayOfMonth;
    } else if (recurrenceType === "monthly_weekday") {
      config.weekOfMonth = weekOfMonth as 1 | 2 | 3 | 4 | 5;
      config.dayOfWeekMonthly = dayOfWeekMonthly;
    }

    onSave(config);
  };

  const frequencyOptions =
    recurrenceType === "weekly"
      ? WEEK_FREQUENCY_OPTIONS
      : recurrenceType?.startsWith("monthly")
        ? MONTH_FREQUENCY_OPTIONS
        : WEEK_FREQUENCY_OPTIONS;

  return (
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

      {/* Start Time (optional) */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          At roughly (optional)
        </Label>
        <TimeInput value={startTime} onChange={setStartTime} />
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
        )}
        <Button onClick={handleSave} className={onCancel ? "flex-1" : "w-full"}>
          Save
        </Button>
      </div>
    </div>
  );
}

/**
 * Dialog version of repeat config - use this in context menus
 */
interface RepeatConfigDialogProps {
  title: string;
  initialConfig?: Partial<CreateTaskSeriesInput>;
  onSave: (config: CreateTaskSeriesInput) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RepeatConfigDialog({
  title,
  initialConfig,
  onSave,
  open,
  onOpenChange,
}: RepeatConfigDialogProps) {
  const handleSave = (config: CreateTaskSeriesInput) => {
    onSave(config);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Repeat className="h-5 w-5" />
            Set up repeat
          </DialogTitle>
        </DialogHeader>
        <RepeatConfigForm
          title={title}
          initialConfig={initialConfig}
          onSave={handleSave}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
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
