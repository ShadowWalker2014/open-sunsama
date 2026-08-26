import * as React from "react";
import { LayoutGrid, List, ArrowUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import type { SortOption } from "@/components/kanban/kanban-board-toolbar";

export type MobileTasksViewMode = "list" | "board";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "position", label: "Manual" },
  { value: "priority-desc", label: "Priority (P0 → P3)" },
  { value: "priority-asc", label: "Priority (P3 → P0)" },
  { value: "createdAt-desc", label: "Date (Newest first)" },
  { value: "createdAt-asc", label: "Date (Oldest first)" },
];

interface MobileViewControlsProps {
  viewMode: MobileTasksViewMode;
  onViewModeChange: (mode: MobileTasksViewMode) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  className?: string;
}

/**
 * The list/board switch and sort menu for the mobile Tasks tab — the two
 * controls the phone layout was missing entirely next to its desktop
 * counterpart. Kept to icon-sized targets so it fits beside the date header.
 */
export function MobileViewControls({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  className,
}: MobileViewControlsProps) {
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      {/* Segmented list / board switch */}
      <div className="flex items-center rounded-lg bg-muted/60 p-0.5">
        {(
          [
            { mode: "list" as const, icon: List, label: "List view" },
            { mode: "board" as const, icon: LayoutGrid, label: "Board view" },
          ]
        ).map(({ mode, icon: Icon, label }) => (
          <button
            key={mode}
            type="button"
            onClick={() => onViewModeChange(mode)}
            aria-label={label}
            aria-pressed={viewMode === mode}
            className={cn(
              "flex h-7 w-8 items-center justify-center rounded-md transition-colors",
              viewMode === mode
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      {/* Sort order */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Sort order"
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              sortBy !== "position" && "bg-muted text-foreground"
            )}
          >
            <ArrowUpDown className="h-4 w-4" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {SORT_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onSortChange(option.value)}
              className="flex items-center justify-between text-sm"
            >
              <span>{option.label}</span>
              {sortBy === option.value && <Check className="h-3.5 w-3.5" />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
