import * as React from "react";
import {
  addDays,
  addWeeks,
  format,
  isSameDay,
  isSameYear,
  isToday,
  startOfDay,
  startOfWeek,
} from "date-fns";
import { ChevronDown, CornerUpLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import type { Task } from "@open-sunsama/types";
import { taskKeys } from "@/lib/query-keys";
import { useKanbanRangePrefetch } from "@/hooks/useKanbanRangePrefetch";
import { getApi } from "@/lib/api";
import { MobileDatePicker } from "./mobile-date-picker";

interface MobileDateHeaderProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  /** Left of the month title (e.g. the backlog button). */
  leading?: React.ReactNode;
  /** Right side of the title row (search, view controls). */
  trailing?: React.ReactNode;
  /** Hides the week strip, e.g. while searching. */
  hideStrip?: boolean;
  /** Rendered under the strip (e.g. a progress bar). */
  children?: React.ReactNode;
}

/**
 * Header for the phone Tasks views: month title (tap for a calendar), a
 * "Today" pill whenever another day is selected, and a swipeable week strip.
 */
export function MobileDateHeader({
  selectedDate,
  onSelectDate,
  leading,
  trailing,
  hideStrip,
  children,
}: MobileDateHeaderProps) {
  const onToday = isToday(selectedDate);

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex h-12 items-center gap-1 px-3">
        {leading}
        <MobileDatePicker value={selectedDate} onChange={(d) => onSelectDate(startOfDay(d))}>
          <button
            type="button"
            className="flex min-w-0 items-center gap-1 rounded-lg px-1.5 py-1 text-left active:bg-muted"
            aria-label={`Pick a date. Showing ${format(selectedDate, "EEEE, MMMM d")}`}
          >
            <span className="truncate text-lg font-semibold tracking-tight">
              {format(selectedDate, "MMMM")}
            </span>
            {!isSameYear(selectedDate, new Date()) && (
              <span className="text-lg font-semibold tracking-tight text-muted-foreground">
                {format(selectedDate, "yyyy")}
              </span>
            )}
            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </MobileDatePicker>

        {!onToday && (
          <button
            type="button"
            onClick={() => onSelectDate(startOfDay(new Date()))}
            className="ml-0.5 flex h-7 shrink-0 animate-[today-pill-in_220ms_cubic-bezier(0.34,1.56,0.64,1)] items-center gap-1 rounded-full bg-primary/10 px-2.5 text-[13px] font-semibold text-primary active:scale-95"
          >
            <CornerUpLeft className="h-3.5 w-3.5" strokeWidth={2.5} />
            Today
          </button>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-1.5">{trailing}</div>
      </div>

      {!hideStrip && <WeekStrip selectedDate={selectedDate} onSelectDate={onSelectDate} />}
      {children}
    </header>
  );
}

/**
 * Seven day pills for the selected date's week. Swipe sideways for the
 * previous or next week; the selection keeps its weekday, like iOS Calendar.
 */
function WeekStrip({
  selectedDate,
  onSelectDate,
}: {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
}) {
  const { user } = useAuth();
  const weekStartsOn = (user?.preferences?.weekStartsOn ?? 0) as 0 | 1;
  const weekStart = startOfWeek(selectedDate, { weekStartsOn });
  const weekKey = weekStart.getTime();
  // One request for the three weeks on screen; it seeds each day's cache.
  useKanbanRangePrefetch({ centerDate: weekStart });

  const pagerRef = React.useRef<HTMLDivElement>(null);
  const settle = usePagerSettle(pagerRef, weekKey, (offset) =>
    onSelectDate(addWeeks(selectedDate, offset))
  );

  return (
    <div
      ref={pagerRef}
      onScroll={settle.onScroll}
      onTouchStart={settle.onTouchStart}
      onTouchEnd={settle.onTouchEnd}
      className="flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {[-1, 0, 1].map((offset) => {
        const start = addWeeks(weekStart, offset);
        return (
          <div
            key={start.getTime()}
            className="grid w-full shrink-0 snap-center grid-cols-7 px-2"
            aria-hidden={offset !== 0}
          >
            {Array.from({ length: 7 }, (_, i) => {
              const day = addDays(start, i);
              return (
                <DayPill
                  key={i}
                  day={day}
                  selected={isSameDay(day, selectedDate)}
                  onSelect={() => onSelectDate(day)}
                  tabbable={offset === 0}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

function DayPill({
  day,
  selected,
  onSelect,
  tabbable,
}: {
  day: Date;
  selected: boolean;
  onSelect: () => void;
  tabbable: boolean;
}) {
  const today = isToday(day);
  const dateString = format(day, "yyyy-MM-dd");
  // Reads the day's cache (seeded by the range prefetch, kept current by
  // mutations) without firing a request per pill.
  const { data: tasks } = useQuery<Task[]>({
    queryKey: taskKeys.list({ scheduledDate: dateString, limit: 200 }),
    queryFn: async () =>
      (await getApi().tasks.list({ scheduledDate: dateString, limit: 200 })).data ?? [],
    enabled: false,
  });
  const total = tasks?.length ?? 0;
  const open = tasks?.filter((t) => !t.completedAt).length ?? 0;

  return (
    <button
      type="button"
      onClick={onSelect}
      tabIndex={tabbable ? 0 : -1}
      aria-pressed={selected}
      aria-label={`${format(day, "EEEE, MMMM d")}${total ? `, ${open} open of ${total} tasks` : ""}`}
      data-date={dateString}
      className="group flex flex-col items-center gap-1 pt-0.5"
    >
      <span
        className={cn(
          "text-[11px] font-medium uppercase tracking-wide",
          selected ? "text-foreground" : today ? "text-primary" : "text-muted-foreground/70"
        )}
      >
        {format(day, "EEEEE")}
      </span>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full text-[16px] font-semibold tabular-nums transition-all duration-200",
          "group-active:scale-90",
          selected
            ? today
              ? "bg-primary text-primary-foreground shadow-sm shadow-primary/40"
              : "bg-foreground text-background"
            : today
              ? "text-primary"
              : "text-foreground"
        )}
      >
        {format(day, "d")}
      </span>
      {/* Load dot: filled while tasks remain, hollow when all are done */}
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full transition-colors",
          total === 0
            ? "bg-transparent"
            : open > 0
              ? "bg-muted-foreground/45"
              : "border border-emerald-500/70"
        )}
      />
    </button>
  );
}

/**
 * Infinite paging for a three-page snap scroller (previous · current · next).
 * Keeps the middle page centred; when a swipe settles on a side page it
 * reports the offset (-1 or 1) so the owner can move its date, and the
 * re-render re-centres on the new middle page before paint.
 */
export function usePagerSettle(
  ref: React.RefObject<HTMLDivElement | null>,
  pageKey: number | string,
  onPage: (offset: -1 | 1) => void
) {
  const touching = React.useRef(false);
  const timer = React.useRef<number | undefined>(undefined);
  const onPageRef = React.useRef(onPage);
  onPageRef.current = onPage;

  const center = React.useCallback(() => {
    const el = ref.current;
    if (el) el.scrollLeft = el.clientWidth;
  }, [ref]);

  React.useLayoutEffect(center, [center, pageKey]);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(center);
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, center]);

  const settle = React.useCallback(() => {
    const el = ref.current;
    if (!el || touching.current || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    if (index === 0) onPageRef.current(-1);
    else if (index === 2) onPageRef.current(1);
  }, [ref]);

  const schedule = React.useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(settle, 110);
  }, [settle]);

  React.useEffect(() => () => window.clearTimeout(timer.current), []);

  return {
    onScroll: schedule,
    onTouchStart: () => {
      touching.current = true;
    },
    onTouchEnd: () => {
      touching.current = false;
      schedule();
    },
  };
}
