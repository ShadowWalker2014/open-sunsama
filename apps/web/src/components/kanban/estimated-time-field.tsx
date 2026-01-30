import * as React from "react";
import { Clock, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Button,
  Input,
  Label,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui";

const TIME_PRESETS = [
  { label: "5 min", value: "5" },
  { label: "10 min", value: "10" },
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
  { label: "1 hour", value: "60" },
  { label: "2 hours", value: "120" },
  { label: "4 hours", value: "240" },
];

function formatTimeDisplay(mins: string): string {
  if (!mins) return "";
  const num = parseInt(mins, 10);
  if (isNaN(num)) return "";
  if (num < 60) return `${num} min`;
  const hours = Math.floor(num / 60);
  const remaining = num % 60;
  if (remaining === 0) return hours === 1 ? "1 hour" : `${hours} hours`;
  return `${hours}h ${remaining}m`;
}

/**
 * Parse flexible time input formats into minutes.
 * Supports: "30", "30m", "1h", "1.5h", "1h30m", "2 hours", etc.
 */
function parseTimeInput(input: string): number | null {
  if (!input) return null;
  const trimmed = input.trim().toLowerCase();
  
  // Match patterns like "1h30m", "1.5h", "30m", "30", etc.
  const hourMinMatch = trimmed.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*(?:(\d+)\s*m(?:ins?)?)?$/);
  if (hourMinMatch && hourMinMatch[1]) {
    const hours = parseFloat(hourMinMatch[1]);
    const mins = parseInt(hourMinMatch[2] ?? "0", 10);
    return Math.round(hours * 60) + mins;
  }
  
  const minMatch = trimmed.match(/^(\d+)\s*m(?:ins?)?$/);
  if (minMatch && minMatch[1]) {
    return parseInt(minMatch[1], 10);
  }
  
  const hourOnly = trimmed.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?$/);
  if (hourOnly && hourOnly[1]) {
    return Math.round(parseFloat(hourOnly[1]) * 60);
  }
  
  // Plain number = minutes
  const num = parseInt(trimmed, 10);
  if (!isNaN(num) && num > 0) {
    return num;
  }
  
  return null;
}

interface UseTimeFieldOptions {
  value: string;
  onChange: (value: string) => void;
  onComplete?: () => void;
}

function useTimeField({ value, onChange, onComplete }: UseTimeFieldOptions) {
  const [isCustomMode, setIsCustomMode] = React.useState(false);
  const [customValue, setCustomValue] = React.useState(value);

  React.useEffect(() => { setCustomValue(value); }, [value]);

  const handlePresetSelect = (preset: string) => {
    onChange(preset);
    setIsCustomMode(false);
    onComplete?.();
  };

  const handleClear = () => {
    onChange("");
    setIsCustomMode(false);
    onComplete?.();
  };

  const handleCustomSubmit = () => {
    const parsed = parseTimeInput(customValue);
    if (parsed !== null) onChange(String(parsed));
    setIsCustomMode(false);
    onComplete?.();
  };

  const handleCustomCancel = () => {
    setIsCustomMode(false);
    setCustomValue(value);
  };

  return {
    isCustomMode,
    setIsCustomMode,
    customValue,
    setCustomValue,
    handlePresetSelect,
    handleClear,
    handleCustomSubmit,
    handleCustomCancel,
    displayValue: formatTimeDisplay(value),
  };
}

// Shared dropdown menu items
function TimePresetItems({ 
  value, 
  onSelect, 
  onCustom, 
  onClear 
}: { 
  value: string;
  onSelect: (v: string) => void;
  onCustom: () => void;
  onClear: () => void;
}) {
  return (
    <>
      {TIME_PRESETS.map((preset) => (
        <DropdownMenuItem
          key={preset.value}
          onClick={() => onSelect(preset.value)}
          className={cn("text-sm", value === preset.value && "bg-accent")}
        >
          {preset.label}
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={onCustom} className="text-sm text-muted-foreground">
        Custom...
      </DropdownMenuItem>
      {value && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onClear} className="text-sm text-muted-foreground">
            Clear
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}

// Shared custom input with flexible time format support
function CustomTimeInput({
  value,
  onChange,
  onSubmit,
  onCancel,
  buttonType = "button",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  buttonType?: "button" | "submit";
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onSubmit(); }
            if (e.key === "Escape") onCancel();
          }}
          onBlur={onSubmit}
          placeholder="e.g. 30m, 1.5h"
          className="h-8 w-24 text-sm"
          autoFocus
        />
        <Button type={buttonType} size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
      <span className="text-xs text-muted-foreground">
        Formats: 30, 30m, 1h, 1.5h, 1h30m
      </span>
    </div>
  );
}

interface EstimatedTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/**
 * Estimated time field with label for task forms.
 */
export function EstimatedTimeField({ value, onChange, onBlur }: EstimatedTimeFieldProps) {
  const field = useTimeField({ value, onChange, onComplete: onBlur });

  if (field.isCustomMode) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">Estimated time</Label>
        <CustomTimeInput
          value={field.customValue}
          onChange={field.setCustomValue}
          onSubmit={field.handleCustomSubmit}
          onCancel={field.handleCustomCancel}
        />
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">Estimated time</Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className={cn("h-8 gap-1.5 text-sm font-normal", !value && "text-muted-foreground")}>
            <Clock className="h-3.5 w-3.5" />
            {field.displayValue || "Add estimate"}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          <TimePresetItems value={value} onSelect={field.handlePresetSelect} onCustom={() => field.setIsCustomMode(true)} onClear={field.handleClear} />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface CompactEstimatedTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Compact estimated time field without label for add task modal.
 */
export function CompactEstimatedTimeField({ value, onChange }: CompactEstimatedTimeFieldProps) {
  const field = useTimeField({ value, onChange });

  if (field.isCustomMode) {
    return (
      <CustomTimeInput
        value={field.customValue}
        onChange={field.setCustomValue}
        onSubmit={field.handleCustomSubmit}
        onCancel={field.handleCustomCancel}
        buttonType="button"
      />
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className={cn("h-8 gap-1.5 text-sm font-normal", !value && "text-muted-foreground")}>
          <Clock className="h-3.5 w-3.5" />
          {field.displayValue || "Add estimate"}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        <TimePresetItems value={value} onSelect={field.handlePresetSelect} onCustom={() => field.setIsCustomMode(true)} onClear={field.handleClear} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
