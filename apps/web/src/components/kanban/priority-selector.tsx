import type { TaskPriority } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import {
  Button,
  Label,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { PriorityIcon, PRIORITY_LABELS } from "@/components/ui/priority-badge";

const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

interface PrioritySelectorProps {
  priority: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}

/**
 * Priority selector with label for task forms.
 */
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

interface InlinePrioritySelectorProps {
  priority: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}

/**
 * Compact inline priority selector for headers.
 */
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
