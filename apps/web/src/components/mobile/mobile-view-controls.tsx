import { LayoutGrid, List, Check, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
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

const VIEWS = [
  { mode: "list" as const, icon: List, label: "List" },
  { mode: "board" as const, icon: LayoutGrid, label: "Board" },
];

interface MobileViewControlsProps {
  viewMode: MobileTasksViewMode;
  onViewModeChange: (mode: MobileTasksViewMode) => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  className?: string;
}

/**
 * View options for the phone Tasks tab — list/board and sort order — behind
 * one header button, so the month title and Today pill keep their room.
 */
export function MobileViewControls({
  viewMode,
  onViewModeChange,
  sortBy,
  onSortChange,
  className,
}: MobileViewControlsProps) {
  const CurrentIcon = viewMode === "board" ? LayoutGrid : List;
  const sorted = sortBy !== "position";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="View options"
          className={cn(
            "relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-muted",
            className
          )}
        >
          <CurrentIcon className="h-[18px] w-[18px]" />
          {sorted && (
            <SlidersHorizontal className="absolute bottom-1 right-1 h-2.5 w-2.5 text-primary" />
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          View
        </DropdownMenuLabel>
        <div className="mx-1 mb-1 grid grid-cols-2 gap-1 rounded-lg bg-muted/60 p-1">
          {VIEWS.map(({ mode, icon: Icon, label }) => (
            <DropdownMenuItem
              key={mode}
              onClick={() => onViewModeChange(mode)}
              aria-pressed={viewMode === mode}
              className={cn(
                "flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm",
                viewMode === mode
                  ? "bg-background text-foreground shadow-sm focus:bg-background"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </DropdownMenuItem>
          ))}
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">
          Sort
        </DropdownMenuLabel>
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
  );
}
