import * as React from "react";
import { Check } from "lucide-react";
import type { TaskPriority } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { PriorityIcon, PRIORITY_META } from "@/components/ui/priority-badge";

export const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

/**
 * The priority list shown in a popover: each row has the flag, the code,
 * what it means and its key (0–3), which also works while the list is open.
 * Shared by cards, the task modal and the add-task popover.
 */
export function PriorityMenu({
  value,
  onChange,
}: {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
}) {
  return (
    <div
      role="listbox"
      aria-label="Priority"
      className="w-52 p-1"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        const picked = PRIORITIES.find((p) => PRIORITY_META[p].key === e.key);
        if (picked) {
          e.preventDefault();
          onChange(picked);
        }
      }}
    >
      <p className="px-2 pb-1 pt-1.5 text-xs text-muted-foreground">Priority</p>
      {PRIORITIES.map((p) => (
        <button
          key={p}
          type="button"
          role="option"
          aria-selected={value === p}
          onClick={() => onChange(p)}
          className={cn(
            "flex w-full items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-colors hover:bg-accent focus:bg-accent focus:outline-none",
            value === p && "bg-accent"
          )}
        >
          <PriorityIcon priority={p} />
          <span className="w-6 text-left font-semibold">{p}</span>
          <span className="flex-1 text-left text-muted-foreground">
            {PRIORITY_META[p].description}
          </span>
          {value === p ? (
            <Check className="h-3.5 w-3.5" />
          ) : (
            <span className="text-xs text-muted-foreground">
              {PRIORITY_META[p].key}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
