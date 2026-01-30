import * as React from "react";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarDays, ArrowUpDown, Check } from "lucide-react";
import type { TaskSortBy } from "@open-sunsama/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ShortcutHint,
} from "@/components/ui";

// Extended sort option that includes direction
export type SortOption = "position" | "priority-desc" | "priority-asc" | "createdAt-desc" | "createdAt-asc";

// Map to extract base sort field and direction
export function parseSortOption(sort: SortOption): { field: TaskSortBy; direction: "asc" | "desc" } {
  switch (sort) {
    case "priority-desc":
      return { field: "priority", direction: "desc" };
    case "priority-asc":
      return { field: "priority", direction: "asc" };
    case "createdAt-desc":
      return { field: "createdAt", direction: "desc" };
    case "createdAt-asc":
      return { field: "createdAt", direction: "asc" };
    case "position":
    default:
      return { field: "position", direction: "asc" };
  }
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "position", label: "Manual" },
  { value: "priority-desc", label: "Priority (High → Low)" },
  { value: "priority-asc", label: "Priority (Low → High)" },
  { value: "createdAt-desc", label: "Date (Newest first)" },
  { value: "createdAt-asc", label: "Date (Oldest first)" },
];

// localStorage key for persisting sort preference
const SORT_STORAGE_KEY = "open-sunsama-kanban-sort";

interface KanbanBoardToolbarProps {
  firstVisibleDate: Date | null;
  lastVisibleDate: Date | null;
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
}

const VALID_SORT_OPTIONS: SortOption[] = ["position", "priority-desc", "priority-asc", "createdAt-desc", "createdAt-asc"];

/**
 * Hook to manage sort preference with localStorage persistence
 */
export function useSortPreference(): [SortOption, (sort: SortOption) => void] {
  const [sortBy, setSortBy] = React.useState<SortOption>(() => {
    if (typeof window === "undefined") return "position";
    const stored = localStorage.getItem(SORT_STORAGE_KEY);
    if (stored && VALID_SORT_OPTIONS.includes(stored as SortOption)) {
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
          <Button variant="outline" onClick={onNavigateToday} className="group">
            <CalendarDays className="mr-2 h-4 w-4" />
            Today
            <ShortcutHint shortcutKey="goToToday" className="ml-2" showOnHover />
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
          <DropdownMenuContent align="end" className="w-52">
            {SORT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => onSortChange(option.value)}
                className="flex items-center justify-between"
              >
                <span>{option.label}</span>
                {sortBy === option.value && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
