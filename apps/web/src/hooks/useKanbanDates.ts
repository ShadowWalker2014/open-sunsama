import * as React from "react";
import {
  addDays,
  subDays,
  startOfDay,
  format,
  differenceInCalendarDays,
} from "date-fns";
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
  containerRef: React.RefObject<HTMLDivElement | null>;
  /** When true, disables infinite scroll navigation (e.g., during drag) */
  isDragging?: boolean;
}

export interface UseKanbanDatesReturn {
  dates: DateInfo[];
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>;
  navigatePrevious: () => void;
  navigateNext: () => void;
  navigateToToday: () => void;
  /** Scrolls so the day sits at the left edge, loading its range if needed. */
  navigateToDate: (date: Date) => void;
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
  isDragging = false,
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
  // Start at today's position immediately (BUFFER_DAYS = index of today)
  const virtualizer = useVirtualizer({
    count: dates.length,
    getScrollElement: () => containerRef.current,
    estimateSize: () => COLUMN_WIDTH,
    horizontal: true,
    overscan: 3,
    initialOffset: BUFFER_DAYS * COLUMN_WIDTH, // Start at today (no scrolling animation)
  });

  // Track if initial scroll position is set (for infinite scroll logic)
  const hasInitializedRef = React.useRef(false);
  
  // Mark as initialized after first render with container ready
  React.useEffect(() => {
    if (hasInitializedRef.current) return;
    
    const container = containerRef.current;
    if (container && container.clientWidth > 0) {
      hasInitializedRef.current = true;
    }
  }, [containerRef]);

  // Handle navigation (one day at a time)
  const navigatePrevious = React.useCallback(() => {
    const scrollOffset = virtualizer.scrollOffset ?? 0;
    const targetOffset = Math.max(0, scrollOffset - COLUMN_WIDTH);
    containerRef.current?.scrollTo({
      left: targetOffset,
      behavior: "smooth",
    });
  }, [virtualizer.scrollOffset, containerRef]);

  const navigateNext = React.useCallback(() => {
    const scrollOffset = virtualizer.scrollOffset ?? 0;
    const targetOffset = scrollOffset + COLUMN_WIDTH;
    containerRef.current?.scrollTo({
      left: targetOffset,
      behavior: "smooth",
    });
  }, [virtualizer.scrollOffset, containerRef]);

  // A day outside the loaded range: recenter on it, then put it at the left
  // edge once its columns exist (see the layout effect below).
  const pendingDateRef = React.useRef<Date | null>(null);

  const navigateToDate = React.useCallback(
    (target: Date) => {
      const day = startOfDay(target);
      const key = format(day, "yyyy-MM-dd");
      const index = dates.findIndex((d) => d.dateString === key);
      if (index >= 0) {
        virtualizer.scrollToIndex(index, { align: "start", behavior: "smooth" });
      } else {
        pendingDateRef.current = day;
        setCenterDate(day);
      }
    },
    [dates, virtualizer]
  );

  const navigateToToday = React.useCallback(
    () => navigateToDate(new Date()),
    [navigateToDate]
  );

  // When the loaded range moves, the same scroll position would show other
  // days. Shift the scroll by the same number of columns so the view stays
  // put, or land on the day someone asked to go to.
  const prevCenterRef = React.useRef(centerDate);
  React.useLayoutEffect(() => {
    const container = containerRef.current;
    const shiftDays = differenceInCalendarDays(prevCenterRef.current, centerDate);
    prevCenterRef.current = centerDate;
    if (!container) return;
    const pending = pendingDateRef.current;
    if (pending) {
      pendingDateRef.current = null;
      const index = dates.findIndex(
        (d) => d.dateString === format(pending, "yyyy-MM-dd")
      );
      if (index >= 0) container.scrollLeft = index * COLUMN_WIDTH;
      return;
    }
    if (shiftDays) container.scrollLeft += shiftDays * COLUMN_WIDTH;
  }, [centerDate, dates, containerRef]);

  // Load more days when scrolling near edges
  // Skip during drag and before initial render to prevent unwanted navigation
  const handleScroll = React.useCallback(() => {
    // Don't navigate during drag operations
    if (isDragging) return;
    // Don't navigate before initial render completes
    // This prevents browser scroll position restoration from triggering navigation
    if (!hasInitializedRef.current) return;
    
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
  }, [containerRef, isDragging]);

  // Calculate visible date range based on scroll position
  // Use scroll offset to determine the actual first visible column, not the first virtual item
  const scrollOffset = virtualizer.scrollOffset ?? 0;
  const firstVisibleIndex = Math.floor(scrollOffset / COLUMN_WIDTH);
  const containerWidth = containerRef.current?.clientWidth ?? COLUMN_WIDTH * VISIBLE_DAYS;
  const lastVisibleIndex = Math.floor((scrollOffset + containerWidth) / COLUMN_WIDTH);
  
  const firstVisibleDate = dates[firstVisibleIndex]?.date ?? null;
  const lastVisibleDate = dates[lastVisibleIndex]?.date ?? null;

  return {
    dates,
    virtualizer,
    navigatePrevious,
    navigateNext,
    navigateToToday,
    navigateToDate,
    handleScroll,
    firstVisibleDate,
    lastVisibleDate,
  };
}

export { COLUMN_WIDTH, VISIBLE_DAYS, BUFFER_DAYS };
