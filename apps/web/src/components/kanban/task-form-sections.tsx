import * as React from "react";
import { Calendar, Clock, FileText } from "lucide-react";
import { cn, TIME_PRESETS_NUMERIC } from "@/lib/utils";
import { Button, Input, Label, Textarea } from "@/components/ui";

interface TitleSectionProps {
  title: string;
  isCompleted: boolean;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function TitleSection({
  title,
  isCompleted,
  onChange,
  onBlur,
}: TitleSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="task-title">Title</Label>
      <Input
        id="task-title"
        value={title}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={cn(
          "text-lg font-semibold",
          isCompleted && "line-through text-muted-foreground"
        )}
      />
    </div>
  );
}

interface DateSectionProps {
  scheduledDate: string;
  onChange: (value: string) => void;
}

export function DateSection({ scheduledDate, onChange }: DateSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="task-date" className="flex items-center gap-2">
        <Calendar className="h-4 w-4" />
        Scheduled Date
      </Label>
      <Input
        id="task-date"
        type="date"
        value={scheduledDate}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

/** @deprecated Use TIME_PRESETS_NUMERIC from @/lib/utils instead */
export const ESTIMATED_TIME_OPTIONS = TIME_PRESETS_NUMERIC;

interface EstimatedTimeSectionProps {
  estimatedMins: number | null;
  onChange: (value: number | null) => void;
}

export function EstimatedTimeSection({
  estimatedMins,
  onChange,
}: EstimatedTimeSectionProps) {
  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-2">
        <Clock className="h-4 w-4" />
        Estimated Time
      </Label>
      <div className="flex flex-wrap gap-2">
        {ESTIMATED_TIME_OPTIONS.map((option) => (
          <Button
            key={option.value}
            variant={estimatedMins === option.value ? "default" : "outline"}
            size="sm"
            onClick={() =>
              onChange(estimatedMins === option.value ? null : option.value)
            }
          >
            {option.label}
          </Button>
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

export function NotesSection({ notes, onChange, onBlur }: NotesSectionProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="task-notes" className="flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Notes
      </Label>
      <Textarea
        id="task-notes"
        value={notes}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder="Add notes..."
        rows={4}
      />
    </div>
  );
}
