import * as React from "react";
import { addDays, subDays, startOfDay, isToday, format } from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";

// Number of days to show at a time
const VISIBLE_DAYS = 7;
// Number of days to load on each side (for smooth scrolling)
const BUFFER_DAYS = 14;
// Column width in pixels
const COLUMN_WIDTH = 280;

export interface DateInfo {
  date: Date;
  dateString: string;
}

export interface UseKanbanDatesOptions {
  containerRef: React.RefObject<HTMLDivElement>;
}

export interface UseKanbanDatesReturn {
  dates: DateInfo[];
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
  navigatePrevious: () => void;
  navigateNext: () => void;
  navigateToToday: () => void;
  handleScroll: () => void;
  firstVisibleDate: Date | null;
  lastVisibleDate: Date | null;
}

/**
 * Custom hook for managing kanban board dates and navigation.
 * Handles date generation, virtualization, and infinite scrolling.
 */
export function useKanbanDates({
  containerRef,
}: UseKanbanDatesOptions): UseKanbanDatesReturn {
  const [centerDate, setCenterDate] = React.useState(() =>
    startOfDay(new Date())
  );

  // Generate array of dates for the viewport
  const dates = React.useMemo(() => {
    const result: DateInfo[] = [];
    const startDate = subDays(centerDate, BUFFER_DAYS);
    const totalDays = VISIBLE_DAYS + BUFFER_DAYS * 2;

    for (let i = 0; i < totalDays; i++) {
      const date = addDays(startDate, i);
      result.push({
        date,
        dateString: format(date, "yyyy-MM-dd"),
      });
    }
    return result;
  }, [centerDate]);

  // Setup virtualizer for horizontal scrolling
  const virtualizer = useVirtualizer({
    count: dates.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => COLUMN_WIDTH,
    horizontal: true,
    overscan: 3,
  });

  // Scroll to today on mount - align to left edge
  // We intentionally run this only once on mount to set initial position
  const hasScrolledToTodayRef = React.useRef(false);
  React.useEffect(() => {
    if (hasScrolledToTodayRef.current) return;
    const todayIndex = dates.findIndex((d) => isToday(d.date));
    if (todayIndex >= 0) {
      // Use requestAnimationFrame to ensure the DOM is ready and measured
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(todayIndex, { align: "start" });
        hasScrolledToTodayRef.current = true;
      });
    }
  }, [dates, virtualizer]);

  // Handle navigation
  const navigatePrevious = React.useCallback(() => {
    const scrollOffset = virtualizer.scrollOffset ?? 0;
    const targetOffset = Math.max(0, scrollOffset - COLUMN_WIDTH * VISIBLE_DAYS);
    containerRef.current?.scrollTo({
      left: targetOffset,
      behavior: "smooth",
    });
  }, [virtualizer.scrollOffset, containerRef]);

  const navigateNext = React.useCallback(() => {
    const scrollOffset = virtualizer.scrollOffset ?? 0;
    const targetOffset = scrollOffset + COLUMN_WIDTH * VISIBLE_DAYS;
    containerRef.current?.scrollTo({
      left: targetOffset,
      behavior: "smooth",
    });
  }, [virtualizer.scrollOffset, containerRef]);

  const navigateToToday = React.useCallback(() => {
    const todayIndex = dates.findIndex((d) => isToday(d.date));
    if (todayIndex >= 0) {
      virtualizer.scrollToIndex(todayIndex, {
        align: "start",
        behavior: "smooth",
      });
    }
  }, [dates, virtualizer]);

  // Load more days when scrolling near edges
  const handleScroll = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const { scrollLeft, scrollWidth, clientWidth } = container;
    const scrollRight = scrollWidth - scrollLeft - clientWidth;

    if (scrollLeft < COLUMN_WIDTH * 3) {
      setCenterDate((prev) => subDays(prev, 7));
    }

    if (scrollRight < COLUMN_WIDTH * 3) {
      setCenterDate((prev) => addDays(prev, 7));
    }
  }, [containerRef]);

  // Calculate visible date range for header
  const visibleItems = virtualizer.getVirtualItems();
  const firstVisibleItem = visibleItems[0];
  const lastVisibleItem = visibleItems[visibleItems.length - 1];
  const firstVisibleDate = firstVisibleItem
    ? dates[firstVisibleItem.index]?.date ?? null
    : null;
  const lastVisibleDate = lastVisibleItem
    ? dates[lastVisibleItem.index]?.date ?? null
    : null;

  return {
    dates,
    virtualizer,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    handleScroll,
    firstVisibleDate,
    lastVisibleDate,
  };
}

export { COLUMN_WIDTH, VISIBLE_DAYS, BUFFER_DAYS };
