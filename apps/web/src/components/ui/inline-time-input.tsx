import * as React from "react";
import { cn } from "@/lib/utils";

interface InlineTimeInputProps {
  /** Time value in minutes */
  value: number | null;
  /** Callback when time changes */
  onChange: (mins: number | null) => void;
  /** Placeholder when no value */
  placeholder?: string;
  /** Additional CSS classes */
  className?: string;
  /** Optional label (e.g., "Actual", "Est") */
  label?: string;
  /** Whether to disable editing */
  disabled?: boolean;
}

/**
 * Format minutes to H:MM display string (e.g., 65 -> "1:05", 15 -> "0:15")
 */
export function formatTimeHMM(mins: number | null): string {
  if (mins === null || mins === 0) return "";
  const hours = Math.floor(mins / 60);
  const minutes = mins % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

/**
 * Parse input string to minutes.
 * Supports formats:
 * - "H:MM" (e.g., "1:05" -> 65)
 * - Plain minutes (e.g., "15" -> 15)
 * - Decimal hours (e.g., "1.5" -> 90)
 * - With suffixes (e.g., "30m" -> 30, "1h" -> 60, "1h30m" -> 90)
 */
export function parseTimeInput(input: string): number | null {
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

/**
 * Inline editable time input component.
 * Displays time in H:MM format and allows inline editing.
 */
export function InlineTimeInput({
  value,
  onChange,
  placeholder = "—",
  className,
  label,
  disabled = false,
}: InlineTimeInputProps) {
  const [isEditing, setIsEditing] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const displayValue = value ? formatTimeHMM(value) : placeholder;

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    e.stopPropagation();
    setIsEditing(true);
    setInputValue(value ? formatTimeHMM(value) : "");
    // Focus and select on next tick
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    setIsEditing(false);
    const parsed = parseTimeInput(inputValue);
    onChange(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      setIsEditing(false);
      setInputValue("");
    }
    // Stop propagation to prevent triggering global shortcuts
    e.stopPropagation();
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "w-14 text-center text-[11px] tabular-nums bg-transparent",
          "border-b border-primary focus:outline-none",
          "rounded-none px-0.5",
          className
        )}
        autoFocus
        placeholder="0:00"
      />
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "text-[11px] tabular-nums cursor-text",
        "hover:underline hover:decoration-dotted",
        "focus:outline-none focus:underline",
        "transition-colors",
        value ? "text-foreground" : "text-muted-foreground",
        disabled && "cursor-default hover:no-underline opacity-50",
        className
      )}
    >
      {label && <span className="text-muted-foreground mr-0.5">{label}</span>}
      {displayValue}
    </button>
  );
}
