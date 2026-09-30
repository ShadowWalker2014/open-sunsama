import * as React from "react";
import {
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Check,
  CalendarDays,
  Columns3,
  Square,
  Download,
} from "lucide-react";
import { format, isToday } from "date-fns";
import type { BoardMode } from "./kanban-board";
import type { TaskSortBy } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
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
import { useIntegrationProviders } from "@/hooks/useIntegrations";

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
  /** Board (several days) or Today (one day). */
  mode: BoardMode;
  onModeChange: (mode: BoardMode) => void;
  onImportTask: () => void;
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
  mode,
  onModeChange,
  onImportTask,
  sortBy,
  onSortChange,
  searchQuery,
  onSearchQueryChange,
}: KanbanBoardToolbarProps) {
  const { data: providers = [] } = useIntegrationProviders();
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
              className="h-7 w-7"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </WithShortcut>
          {/* Sunsama's date menu: jump to today, step a day, or pick any date. */}
          <Popover open={goToOpen} onOpenChange={setGoToOpen}>
            <PopoverTrigger asChild>
              <WithShortcut label="Go to date" side="bottom">
                <Button variant="ghost" className="h-7 gap-1.5 px-2 text-[13px]">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {/* One day at a time shows which day it is. */}
                  {mode === "day" && firstVisibleDate && !isToday(firstVisibleDate)
                    ? format(firstVisibleDate, "EEE, MMM d")
                    : "Today"}
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
              className="h-7 w-7"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </WithShortcut>
        </div>

      </div>

      {/* Right-side actions */}
      <div className="flex items-center gap-2">
        {/* Today (one day) or Board (several days), as in Sunsama */}
        <div
          role="radiogroup"
          aria-label="View"
          className="flex h-7 items-center rounded-md bg-muted/50 p-0.5"
        >
          {(
            [
              { value: "day", label: "Today", icon: Square, shortcut: "todayView" },
              { value: "board", label: "Board", icon: Columns3, shortcut: "boardView" },
            ] as const
          ).map(({ value, label, icon: Icon, shortcut }) => (
            <WithShortcut key={value} label={label} shortcut={shortcut} side="bottom">
              <button
                aria-keyshortcuts={value === "day" ? "Shift+T" : "Shift+B"}
                type="button"
                role="radio"
                aria-checked={mode === value}
                onClick={() => onModeChange(value)}
                className={cn(
                  "flex h-6 items-center gap-1.5 rounded px-2 text-xs transition-colors",
                  mode === value
                    ? "bg-background text-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            </WithShortcut>
          ))}
        </div>

        {/* Filter the visible day columns down to matching cards */}
        <ViewSearch
          value={searchQuery}
          onChange={onSearchQueryChange}
          placeholder="Search tasks…"
        />

        {providers.length > 0 && <Button
          onClick={onImportTask}
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5"
          title="Import a task by pasting its link"
        >
          <Download className="h-4 w-4" />
          <span className="hidden sm:inline">Import</span>
        </Button>}

        {/* Sort Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="relative h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              aria-label={`Sort: ${currentSortLabel}`}
              title={`Sort: ${currentSortLabel}`}
            >
              <ArrowUpDown className="h-4 w-4" />
              {/* Name the order only when it isn't the default */}
              {sortBy !== "position" && (
                <span className="absolute right-1 top-1 h-1 w-1 rounded-full bg-primary" />
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
