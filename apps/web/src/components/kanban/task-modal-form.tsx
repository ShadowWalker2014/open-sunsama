import * as React from "react";
import { Clock } from "lucide-react";
import type { TaskPriority } from "@chronoflow/types";
import { cn } from "@/lib/utils";
import {
  Button,
  Input,
  Label,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { HtmlContent } from "@/components/ui/html-content";
import { PriorityIcon, PRIORITY_LABELS } from "@/components/ui/priority-badge";

const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

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
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Description
      </Label>
      {isEditing ? (
        <div onBlur={onBlur}>
          <RichTextEditor
            value={description}
            onChange={onChange}
            placeholder="Add a more detailed description..."
            minHeight="150px"
          />
        </div>
      ) : (
        <div
          onClick={() => onEditingChange(true)}
          className={cn(
            "min-h-[80px] rounded-md border border-transparent px-3 py-2 cursor-text transition-colors",
            "hover:border-input hover:bg-muted/30",
            !description && "text-muted-foreground"
          )}
        >
          {description ? (
            <HtmlContent html={description} />
          ) : (
            <span className="text-sm">Add a description...</span>
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
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Priority
      </Label>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-fit gap-2 h-9">
            <PriorityIcon priority={priority} />
            <span>{PRIORITY_LABELS[priority]}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-40">
          {PRIORITIES.map((p) => (
            <DropdownMenuItem
              key={p}
              onClick={() => onChange(p)}
              className={cn("gap-2", priority === p && "bg-accent")}
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

interface EstimatedTimeFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
}

export function EstimatedTimeField({ value, onChange, onBlur }: EstimatedTimeFieldProps) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
        Estimated Time
      </Label>
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-muted-foreground" />
        <Input
          type="number"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder="Minutes"
          className="w-24"
          min={1}
          max={480}
        />
        <span className="text-sm text-muted-foreground">minutes</span>
      </div>
    </div>
  );
}
