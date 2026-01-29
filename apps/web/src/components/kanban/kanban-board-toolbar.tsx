import * as React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, ArrowUpDown } from "lucide-react";
import type { TaskSortBy } from "@chronoflow/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";

export type SortOption = TaskSortBy;

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "position", label: "Manual" },
  { value: "priority", label: "Priority" },
  { value: "createdAt", label: "Created" },
];

// localStorage key for persisting sort preference
const SORT_STORAGE_KEY = "chronoflow-kanban-sort";

interface KanbanBoardToolbarProps {
  firstVisibleDate: Date | null;
  lastVisibleDate: Date | null;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

/**
 * Hook to manage sort preference with localStorage persistence
 */
export function useSortPreference(): [SortOption, (sort: SortOption) => void] {
  const [sortBy, setSortBy] = React.useState<SortOption>(() => {
    if (typeof window === "undefined") return "position";
    const stored = localStorage.getItem(SORT_STORAGE_KEY);
    if (stored && ["position", "priority", "createdAt"].includes(stored)) {
      return stored as SortOption;
    }
    return "position";
  });

  const handleSortChange = React.useCallback((sort: SortOption) => {
    setSortBy(sort);
    localStorage.setItem(SORT_STORAGE_KEY, sort);
  }, []);

  return [sortBy, handleSortChange];
}

export function KanbanBoardToolbar({
  firstVisibleDate,
  lastVisibleDate,
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToday,
  sortBy,
  onSortChange,
}: KanbanBoardToolbarProps) {
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Manual";

  return (
    <div className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-4">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={onNavigatePrevious}
            title="Previous week"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={onNavigateToday}>
            <CalendarDays className="mr-2 h-4 w-4" />
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={onNavigateNext}
            title="Next week"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Current Date Range */}
        {firstVisibleDate && lastVisibleDate && (
          <h2 className="text-lg font-semibold">
            {format(firstVisibleDate, "MMM d")} -{" "}
            {format(lastVisibleDate, "MMM d, yyyy")}
          </h2>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">Sort:</span>
              <span>{currentSortLabel}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className={sortBy === option.value ? "bg-accent" : ""}
              >
                {option.label}
                {sortBy === option.value && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    Current
                  </span>
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
