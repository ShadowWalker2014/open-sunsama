import * as React from "react";
import { Clock, ChevronDown } from "lucide-react";
import { cn, TIME_PRESETS, formatTimeDisplay, parseTimeInput } from "@/lib/utils";
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
