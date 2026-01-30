import * as React from "react";
import { Clock, FileText, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input, Label, Textarea } from "@/components/ui";

interface TitleSectionProps {
  title: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function TimeBlockTitleSection({
  title,
  onChange,
  onBlur,
}: TitleSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="block-title">Title</Label>
      <Input
        id="block-title"
        value={title}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className="text-lg font-semibold"
        placeholder="Time block title"
      />
    </div>
  );
}

interface TimeRangeSectionProps {
  startTime: string;
  endTime: string;
  durationMins: number;
  onStartTimeChange: (value: string) => void;
  onEndTimeChange: (value: string) => void;
  onBlur: () => void;
}

export function TimeRangeSection({
  startTime,
  endTime,
  durationMins,
  onStartTimeChange,
  onEndTimeChange,
  onBlur,
}: TimeRangeSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Time Range
      </Label>
      <div className="flex items-center gap-2">
        <Input
          type="time"
          value={startTime}
          onChange={(e) => onStartTimeChange(e.target.value)}
          onBlur={onBlur}
          className="flex-1"
        />
        <span className="text-muted-foreground">to</span>
        <Input
          type="time"
          value={endTime}
          onChange={(e) => onEndTimeChange(e.target.value)}
          onBlur={onBlur}
          className="flex-1"
        />
      </div>
      <p className="text-xs text-muted-foreground">
        Duration: {Math.floor(durationMins / 60)}h {durationMins % 60}m
      </p>
    </div>
  );
}

export const COLOR_OPTIONS = [
  { value: "#3B82F6", label: "Blue" },
  { value: "#10B981", label: "Green" },
  { value: "#F59E0B", label: "Amber" },
  { value: "#EF4444", label: "Red" },
  { value: "#8B5CF6", label: "Purple" },
  { value: "#EC4899", label: "Pink" },
  { value: "#6366F1", label: "Indigo" },
  { value: "#14B8A6", label: "Teal" },
];

interface ColorSectionProps {
  color: string | null;
  onChange: (color: string) => void;
}

export function ColorSection({ color, onChange }: ColorSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Palette className="h-4 w-4" />
        Color
      </Label>
      <div className="flex flex-wrap gap-2">
        {COLOR_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={cn(
              "h-8 w-8 rounded-full border-2 transition-all",
              color === option.value
                ? "ring-2 ring-offset-1 ring-primary/60 border-primary"
                : "border-transparent hover:border-muted-foreground/30"
            )}
            style={{ backgroundColor: option.value }}
            onClick={() => onChange(option.value)}
            title={option.label}
          />
        ))}
      </div>
    </div>
  );
}

interface NotesSectionProps {
  notes: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

/**
 * @deprecated Use NotesField from "@/components/ui/notes-field" instead
 */
export function TimeBlockNotesSection({
  notes,
  onChange,
  onBlur,
}: NotesSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="block-notes" className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Notes
      </Label>
      <Textarea
        id="block-notes"
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Add notes..."
        rows={4}
      />
    </div>
  );
}
