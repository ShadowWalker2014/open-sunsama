import * as React from "react";
import { Clock, ChevronDown } from "lucide-react";
import type { TaskPriority } from "@chronoflow/types";
import { cn } from "@/lib/utils";
import {
  Button,
  Input,
  Label,
  Textarea,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { HtmlContent } from "@/components/ui/html-content";
import { PriorityIcon, PRIORITY_LABELS } from "@/components/ui/priority-badge";

const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

const TIME_PRESETS = [
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
  { label: "1 hour", value: "60" },
  { label: "2 hours", value: "120" },
  { label: "4 hours", value: "240" },
];

// Simple Notes field for Sunsama-style task modal
interface NotesFieldProps {
  notes: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function NotesField({ notes, onChange, onBlur }: NotesFieldProps) {
  const [isEditing, setIsEditing] = React.useState(false);

  if (isEditing) {
    return (
      <div onBlur={() => { onBlur(); setIsEditing(false); }}>
        <RichTextEditor
          value={notes}
          onChange={onChange}
          placeholder="Notes..."
          minHeight="80px"
        />
      </div>
    );
  }

  return (
    <div
      onClick={() => setIsEditing(true)}
      className={cn(
        "min-h-[60px] rounded-md px-0 py-2 cursor-text transition-colors",
        !notes && "text-muted-foreground"
      )}
    >
      {notes ? (
        <HtmlContent html={notes} />
      ) : (
        <span className="text-sm text-muted-foreground">Notes...</span>
      )}
    </div>
  );
}

interface DescriptionFieldProps {
  description: string;
  isEditing: boolean;
  onEditingChange: (editing: boolean) => void;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function DescriptionField({
  description,
  isEditing,
  onEditingChange,
  onChange,
  onBlur,
}: DescriptionFieldProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        Notes
      </Label>
      {isEditing ? (
        <div onBlur={onBlur}>
          <RichTextEditor
            value={description}
            onChange={onChange}
            placeholder="Notes..."
            minHeight="100px"
          />
        </div>
      ) : (
        <div
          onClick={() => onEditingChange(true)}
          className={cn(
            "min-h-[60px] rounded-md border border-transparent px-3 py-2 cursor-text transition-colors",
            "hover:border-input hover:bg-muted/30",
            !description && "text-muted-foreground"
          )}
        >
          {description ? (
            <HtmlContent html={description} />
          ) : (
            <span className="text-sm">Notes...</span>
          )}
        </div>
      )}
    </div>
  );
}

interface PrioritySelectorProps {
  priority: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}

export function PrioritySelector({ priority, onChange }: PrioritySelectorProps) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        Priority
      </Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-fit gap-2 h-8 text-sm">
            <PriorityIcon priority={priority} />
            <span>{PRIORITY_LABELS[priority]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          {PRIORITIES.map((p) => (
            <DropdownMenuItem
              key={p}
              onClick={() => onChange(p)}
              className={cn("gap-2 text-sm", priority === p && "bg-accent")}
            >
              <PriorityIcon priority={p} />
              <span>{PRIORITY_LABELS[p]}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Compact inline priority selector for header
interface InlinePrioritySelectorProps {
  priority: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}

export function InlinePrioritySelector({ priority, onChange }: InlinePrioritySelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-xs font-medium hover:bg-muted">
          <PriorityIcon priority={priority} />
          <span>{priority}</span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-32">
        {PRIORITIES.map((p) => (
          <DropdownMenuItem
            key={p}
            onClick={() => onChange(p)}
            className={cn("gap-2 text-xs", priority === p && "bg-accent")}
          >
            <PriorityIcon priority={p} />
            <span>{PRIORITY_LABELS[p]}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface EstimatedTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

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

export function EstimatedTimeField({ value, onChange, onBlur }: EstimatedTimeFieldProps) {
  const [isCustomMode, setIsCustomMode] = React.useState(false);
  const [customValue, setCustomValue] = React.useState(value);

  React.useEffect(() => {
    setCustomValue(value);
  }, [value]);

  const handlePresetSelect = (preset: string) => {
    onChange(preset);
    setIsCustomMode(false);
    onBlur();
  };

  const handleClear = () => {
    onChange("");
    setIsCustomMode(false);
    onBlur();
  };

  const displayValue = formatTimeDisplay(value);

  // If in custom mode, show input inline
  if (isCustomMode) {
    return (
      <div className="space-y-1.5">
        <Label className="text-xs font-medium text-muted-foreground">
          Estimated time
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (customValue) onChange(customValue);
                setIsCustomMode(false);
                onBlur();
              }
              if (e.key === "Escape") {
                setIsCustomMode(false);
                setCustomValue(value);
              }
            }}
            onBlur={() => {
              if (customValue) onChange(customValue);
              setIsCustomMode(false);
              onBlur();
            }}
            placeholder="Minutes"
            className="h-8 w-20 text-sm"
            min={1}
            max={480}
            autoFocus
          />
          <span className="text-xs text-muted-foreground">minutes</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            onClick={() => {
              setIsCustomMode(false);
              setCustomValue(value);
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">
        Estimated time
      </Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "h-8 gap-1.5 text-sm font-normal",
              !value && "text-muted-foreground"
            )}
          >
            <Clock className="h-3.5 w-3.5" />
            {displayValue || "Add estimate"}
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-36">
          {TIME_PRESETS.map((preset) => (
            <DropdownMenuItem
              key={preset.value}
              onClick={() => handlePresetSelect(preset.value)}
              className={cn("text-sm", value === preset.value && "bg-accent")}
            >
              {preset.label}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsCustomMode(true)}
            className="text-sm text-muted-foreground"
          >
            Custom...
          </DropdownMenuItem>
          {value && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleClear}
                className="text-sm text-muted-foreground"
              >
                Clear
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// Compact version for add task modal
interface CompactEstimatedTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function CompactEstimatedTimeField({ value, onChange }: CompactEstimatedTimeFieldProps) {
  const [isCustomMode, setIsCustomMode] = React.useState(false);
  const [customValue, setCustomValue] = React.useState(value);

  React.useEffect(() => {
    setCustomValue(value);
  }, [value]);

  const handlePresetSelect = (preset: string) => {
    onChange(preset);
    setIsCustomMode(false);
  };

  const handleClear = () => {
    onChange("");
    setIsCustomMode(false);
  };

  const displayValue = formatTimeDisplay(value);

  // If in custom mode, show input inline
  if (isCustomMode) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="number"
          value={customValue}
          onChange={(e) => setCustomValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (customValue) onChange(customValue);
              setIsCustomMode(false);
            }
            if (e.key === "Escape") {
              setIsCustomMode(false);
              setCustomValue(value);
            }
          }}
          onBlur={() => {
            if (customValue) onChange(customValue);
            setIsCustomMode(false);
          }}
          placeholder="Minutes"
          className="h-8 w-20 text-sm"
          min={1}
          max={480}
          autoFocus
        />
        <span className="text-xs text-muted-foreground">minutes</span>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={() => {
            setIsCustomMode(false);
            setCustomValue(value);
          }}
        >
          Cancel
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1.5 text-sm font-normal",
            !value && "text-muted-foreground"
          )}
        >
          <Clock className="h-3.5 w-3.5" />
          {displayValue || "Add estimate"}
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-36">
        {TIME_PRESETS.map((preset) => (
          <DropdownMenuItem
            key={preset.value}
            onClick={() => handlePresetSelect(preset.value)}
            className={cn("text-sm", value === preset.value && "bg-accent")}
          >
            {preset.label}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setIsCustomMode(true)}
          className="text-sm text-muted-foreground"
        >
          Custom...
        </DropdownMenuItem>
        {value && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleClear}
              className="text-sm text-muted-foreground"
            >
              Clear
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
