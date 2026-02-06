import type { TaskPriority } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
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
 * Compact inline priority selector for headers and property bars.
 * Minimal design — no chevron, subtle hover state.
 */
export function InlinePrioritySelector({ priority, onChange }: InlinePrioritySelectorProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1.5 h-7 px-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors cursor-pointer">
          <PriorityIcon priority={priority} />
          <span>{PRIORITY_LABELS[priority]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-32">
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
