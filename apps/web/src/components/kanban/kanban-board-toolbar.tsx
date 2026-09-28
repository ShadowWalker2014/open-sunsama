import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Check,
  CalendarDays,
} from "lucide-react";
import type { TaskSortBy } from "@open-sunsama/types";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  ViewSearch,
} from "@/components/ui";
import { WithShortcut, KeyCaps } from "@/components/ui/with-shortcut";
import { MonthGrid } from "@/components/ui/month-grid";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SHORTCUTS, formatShortcut } from "@/hooks/useKeyboardShortcuts";

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
  { value: "priority-desc", label: "Priority (P0 → P3)" },
  { value: "priority-asc", label: "Priority (P3 → P0)" },
  { value: "createdAt-desc", label: "Date (Newest first)" },
  { value: "createdAt-asc", label: "Date (Oldest first)" },
];

// localStorage key for persisting sort preference
const SORT_STORAGE_KEY = "open-sunsama-kanban-sort";

interface KanbanBoardToolbarProps {
  onNavigatePrevious: () => void;
  onNavigateNext: () => void;
  onNavigateToday: () => void;
  /** Puts a day at the left edge of the board. */
  onNavigateToDate: (date: Date) => void;
  /** The day at the left edge, marked in the calendar. */
  firstVisibleDate: Date | null;
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  /** Substring filter applied to task titles/notes across the day columns. */
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
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
  onNavigatePrevious,
  onNavigateNext,
  onNavigateToday,
  onNavigateToDate,
  firstVisibleDate,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchQueryChange,
}: KanbanBoardToolbarProps) {
  const [goToOpen, setGoToOpen] = React.useState(false);
  const go = (action: () => void) => {
    action();
    setGoToOpen(false);
  };
  const goToRows = [
    { label: "Go to today", shortcut: SHORTCUTS.focusToday, action: onNavigateToday },
    { label: "Go to next day", shortcut: SHORTCUTS.nextDay, action: onNavigateNext },
    { label: "Go to previous day", shortcut: SHORTCUTS.previousDay, action: onNavigatePrevious },
  ];
  const currentSortLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? "Manual";

  return (
    <div className="flex h-12 flex-shrink-0 items-center justify-between px-3 sm:px-4">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Navigation Arrows */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          <WithShortcut label="Previous day" shortcut="previousDay" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigatePrevious}
              aria-label="Previous day"
              className="h-8 w-8"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </WithShortcut>
          {/* Sunsama's date menu: jump to today, step a day, or pick any date. */}
          <Popover open={goToOpen} onOpenChange={setGoToOpen}>
            <PopoverTrigger asChild>
              <WithShortcut label="Go to date" side="bottom">
                <Button variant="ghost" className="h-8 gap-1.5 px-2.5">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  Today
                </Button>
              </WithShortcut>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-auto p-0">
              <div className="p-1">
                {goToRows.map((row) => (
                  <button
                    key={row.label}
                    type="button"
                    onClick={() => go(row.action)}
                    className="flex w-full items-center justify-between gap-6 rounded px-2.5 py-1.5 text-sm transition-colors hover:bg-accent"
                  >
                    {row.label}
                    {row.shortcut && (
                      <KeyCaps keys={formatShortcut(row.shortcut).split(" ")} />
                    )}
                  </button>
                ))}
              </div>
              <div className="border-t border-border/60">
                <MonthGrid
                  selected={firstVisibleDate}
                  onSelect={(date) => go(() => onNavigateToDate(date))}
                />
              </div>
            </PopoverContent>
          </Popover>
          <WithShortcut label="Next day" shortcut="nextDay" side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={onNavigateNext}
              aria-label="Next day"
              className="h-8 w-8"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </WithShortcut>
        </div>

      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-2">
        {/* Filter the visible day columns down to matching cards */}
        <ViewSearch
          value={searchQuery}
          onChange={onSearchQueryChange}
          placeholder="Search tasks…"
        />

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 px-2 text-muted-foreground hover:text-foreground"
              title={`Sort: ${currentSortLabel}`}
            >
              <ArrowUpDown className="h-4 w-4" />
              {/* Name the order only when it isn't the default */}
              {sortBy !== "position" && (
                <span className="text-sm">{currentSortLabel}</span>
              )}
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
