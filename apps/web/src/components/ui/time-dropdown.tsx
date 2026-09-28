import * as React from "react";
import { cn, formatDuration } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DurationPicker } from "@/components/ui/duration-picker";

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
  /** @deprecated Clear always shows when there is a value. */
  showClear?: boolean;
  /** @deprecated */
  clearText?: string;
  /** Whether to disable editing */
  disabled?: boolean;
  /** Additional CSS classes for the trigger */
  className?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
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
    disabled = false,
    className,
    size = "md",
  },
  ref
) {
  const [open, setOpen] = React.useState(false);

  React.useImperativeHandle(
    ref,
    () => ({
      open: () => {
        if (!disabled) setOpen(true);
      },
      close: () => setOpen(false),
    }),
    [disabled]
  );

  const sizeClasses = {
    sm: "text-sm",
    md: "text-lg",
    lg: "text-4xl",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      {label && (
        <span className="text-[10px] font-medium text-muted-foreground/70 tracking-wide uppercase">
          {label}
        </span>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              "font-mono tabular-nums tracking-tight transition-colors",
              "hover:text-foreground focus:outline-hidden focus-visible:ring-1 focus-visible:ring-ring",
              value ? "text-foreground" : "text-muted-foreground/60",
              disabled &&
                "opacity-50 cursor-not-allowed hover:text-muted-foreground/60",
              sizeClasses[size],
              className
            )}
          >
            {value ? formatDuration(value) : placeholder}
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-auto p-0"
          align="center"
          side="bottom"
          sideOffset={8}
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          <DurationPicker
            value={value}
            label={dropdownHeader ?? label ?? "Time"}
            shortcut={shortcutHint}
            onChange={(mins) => {
              onChange(mins);
              setOpen(false);
            }}
            onClose={() => setOpen(false)}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
});
