import { format, addDays, subDays } from "date-fns";
import type { CalendarEvent } from "@open-sunsama/types";
import { useCalendarEvents } from "@/hooks/useCalendars";

/**
 * Calendar-event search for the command palette.
 *
 * Events live in a date-ranged endpoint, so the palette searches a window
 * around today (a month back, a quarter forward) rather than all history —
 * that covers "what was that meeting called" without pulling years of data.
 */
export function useSearchEvents(query: string, limit = 20): CalendarEvent[] {
  const trimmed = query.trim().toLowerCase();
  const today = new Date();
  const from = format(subDays(today, 30), "yyyy-MM-dd");
  const to = format(addDays(today, 90), "yyyy-MM-dd");

  const { data: events = [] } = useCalendarEvents(
    from,
    to,
    trimmed.length > 0
  );

  if (!trimmed) return [];

  return events
    .filter((event) => {
      const haystack = [event.title, event.location, event.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(trimmed);
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    )
    .slice(0, limit);
}
