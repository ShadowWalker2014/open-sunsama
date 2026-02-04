import * as React from "react";
import { Check, Calendar } from "lucide-react";
import { cn, formatDuration } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";

// Time presets in minutes
const TIME_PRESETS = [
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
  { value: 25, label: "25 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hr" },
];

export interface TimeDropdownRef {
  open: () => void;
  close: () => void;
}

interface TimeDropdownProps {
  /** Time value in minutes */
  value: number | null;
  /** Callback when time changes */
  onChange: (mins: number | null) => void;
  /** Label above the time (e.g., "ACTUAL", "PLANNED") */
  label?: string;
  /** Placeholder when no value */
  placeholder?: string;
  /** Header text in dropdown */
  dropdownHeader?: string;
  /** Keyboard shortcut hint */
  shortcutHint?: string;
  /** Whether to show clear option */
  showClear?: boolean;
  /** Clear option text */
  clearText?: string;
  /** Whether to disable editing */
  disabled?: boolean;
  /** Additional CSS classes for the trigger */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
}

/**
 * Parse flexible time input formats into minutes.
 * Supports: "30", "30m", "1h", "1.5h", "1h30m", "0:30", "1:30", etc.
 */
function parseTimeInput(input: string): number | null {
  const trimmed = input.trim().toLowerCase();
  if (!trimmed) return null;

  // Handle H:MM format (e.g., "1:05", "0:15")
  if (trimmed.includes(":")) {
    const parts = trimmed.split(":");
    if (parts.length === 2) {
      const hours = parseInt(parts[0]!, 10);
      const mins = parseInt(parts[1]!, 10);
      if (
        !isNaN(hours) &&
        !isNaN(mins) &&
        hours >= 0 &&
        mins >= 0 &&
        mins < 60
      ) {
        return hours * 60 + mins;
      }
    }
    return null;
  }

  // Handle "1h30m" or "1h 30m" format
  const hourMinMatch = trimmed.match(
    /^(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*(?:(\d+)\s*m(?:ins?)?)?$/
  );
  if (hourMinMatch && hourMinMatch[1]) {
    const hours = parseFloat(hourMinMatch[1]);
    const mins = parseInt(hourMinMatch[2] ?? "0", 10);
    return Math.round(hours * 60) + mins;
  }

  // Handle "30m" or "30 min" format
  const minMatch = trimmed.match(/^(\d+)\s*m(?:ins?)?$/);
  if (minMatch && minMatch[1]) {
    return parseInt(minMatch[1], 10);
  }

  // Handle decimal hours (e.g., "1.5" = 90 mins)
  if (trimmed.includes(".")) {
    const hours = parseFloat(trimmed);
    if (!isNaN(hours) && hours >= 0) {
      return Math.round(hours * 60);
    }
    return null;
  }

  // Plain number = minutes
  const mins = parseInt(trimmed, 10);
  if (!isNaN(mins) && mins >= 0) {
    return mins;
  }

  return null;
}

export const TimeDropdown = React.forwardRef<
  TimeDropdownRef,
  TimeDropdownProps
>(function TimeDropdown(
  {
    value,
    onChange,
    label,
    placeholder = "--:--",
    dropdownHeader,
    shortcutHint,
    showClear = false,
    clearText = "Clear",
    disabled = false,
    className,
    size = "md",
  },
  ref
) {
  const [open, setOpen] = React.useState(false);
  const [customInputValue, setCustomInputValue] = React.useState("");
  const [showCustomInput, setShowCustomInput] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Expose open/close methods via ref
  React.useImperativeHandle(
    ref,
    () => ({
      open: () => {
        if (!disabled) {
          setOpen(true);
        }
      },
      close: () => setOpen(false),
    }),
    [disabled]
  );

  const displayValue = value ? formatDuration(value) : placeholder;

  const handlePresetSelect = (mins: number) => {
    onChange(mins);
    setOpen(false);
    setShowCustomInput(false);
  };

  const handleCustomInputSubmit = () => {
    const parsed = parseTimeInput(customInputValue);
    if (parsed !== null && parsed > 0) {
      onChange(parsed);
      setOpen(false);
    }
    setShowCustomInput(false);
    setCustomInputValue("");
  };

  const handleClear = () => {
    onChange(null);
    setOpen(false);
    setShowCustomInput(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      setShowCustomInput(false);
      setCustomInputValue("");
    }
  };

  // Focus custom input when shown
  React.useEffect(() => {
    if (showCustomInput && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [showCustomInput]);

  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-3xl",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[10px] font-medium text-muted-foreground/70 tracking-wide uppercase">
          {label}
        </span>
      )}
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "font-mono tabular-nums tracking-tight transition-colors",
              "hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              value ? "text-foreground" : "text-muted-foreground/60",
              disabled &&
                "opacity-50 cursor-not-allowed hover:text-muted-foreground/60",
              sizeClasses[size],
              className
            )}
          >
            {displayValue}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-44 p-0"
          align="center"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with custom input */}
          <div className="p-2 border-b">
            {dropdownHeader && !showCustomInput && (
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {dropdownHeader}
                </span>
                {shortcutHint && (
                  <span className="text-[10px] text-muted-foreground/60 px-1.5 py-0.5 rounded bg-muted">
                    {shortcutHint}
                  </span>
                )}
              </div>
            )}
            {showCustomInput ? (
              <div className="flex flex-col gap-2">
                <span className="text-xs text-muted-foreground">
                  {dropdownHeader || "Enter time"}:
                </span>
                <div className="flex items-center gap-2">
                  <Input
                    ref={inputRef}
                    type="text"
                    value={customInputValue}
                    onChange={(e) => setCustomInputValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomInputSubmit();
                      }
                      if (e.key === "Escape") {
                        e.preventDefault();
                        setShowCustomInput(false);
                        setCustomInputValue("");
                      }
                    }}
                    placeholder="0:00"
                    className="h-8 text-sm font-mono flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomInput(false);
                      setCustomInputValue("");
                    }}
                    className="shrink-0 p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                    title="Back to presets"
                  >
                    <Calendar className="h-4 w-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleCustomInputSubmit}
                  className="text-xs text-primary hover:underline text-left"
                >
                  ↵ Return to save
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setShowCustomInput(true);
                  setCustomInputValue(value ? formatDuration(value) : "");
                }}
                className={cn(
                  "w-full text-left px-2 py-1.5 rounded text-sm font-mono",
                  "hover:bg-muted transition-colors",
                  value ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {value ? formatDuration(value) : placeholder}
              </button>
            )}
          </div>

          {/* Preset options */}
          <div className="max-h-[240px] overflow-y-auto py-1 scrollbar-thin">
            {TIME_PRESETS.map((preset) => (
              <button
                key={preset.value}
                type="button"
                onClick={() => handlePresetSelect(preset.value)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-1.5 text-sm",
                  "hover:bg-muted transition-colors",
                  value === preset.value && "bg-muted"
                )}
              >
                <span>{preset.label}</span>
                {value === preset.value && (
                  <Check className="h-3.5 w-3.5 text-foreground" />
                )}
              </button>
            ))}
          </div>

          {/* Clear option */}
          {showClear && value !== null && (
            <div className="border-t p-1">
              <button
                type="button"
                onClick={handleClear}
                className="w-full px-3 py-1.5 text-sm text-primary hover:bg-muted rounded transition-colors text-left"
              >
                {clearText}
              </button>
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
});
