/**
 * MCP Tools for Calendar Events
 *
 * Events synced from the user's connected Google, Outlook and iCloud
 * calendars: meetings and other commitments that time blocks must plan
 * around. Read-only; attendees and descriptions are never returned.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { ApiClient, ApiResponse, CalendarEvent, CalendarEventsMeta } from "../lib/api-client.js";
import { defineTool } from "../lib/define-tool.js";

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const MAX_RANGE_DAYS = 31;

export const CALENDAR_SCOPE_MISSING =
  "This connection can't read calendar events. To include meetings, disconnect Open Sunsama in your AI app and connect it again, then allow calendar access (the calendar:read permission). API keys need the calendar:read scope.";

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function localDate(instant: Date, timeZone: string): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

function localTime(instant: Date, timeZone: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(instant);
}

/** Local dates [first, last] an event covers, in the user's timezone. */
function eventDays(event: CalendarEvent, timeZone: string): [string, string] {
  const start = new Date(event.startTime);
  const end = new Date(event.endTime);
  if (event.isAllDay) {
    // Stored as UTC midnight of the date, end exclusive.
    const first = event.startTime.slice(0, 10);
    const last = addDays(event.endTime.slice(0, 10), -1);
    return [first, last < first ? first : last];
  }
  const first = localDate(start, timeZone);
  const lastInstant = end > start ? new Date(end.getTime() - 1) : start;
  return [first, localDate(lastInstant, timeZone)];
}

function eventFlags(event: CalendarEvent): string {
  const flags: string[] = [];
  if (event.responseStatus === "declined") flags.push("declined");
  else if (event.status === "tentative" || event.responseStatus === "tentative") flags.push("tentative");
  else if (event.responseStatus === "needsAction") flags.push("not yet answered");
  return flags.length ? ` (${flags.join(", ")})` : "";
}

function formatEventLine(event: CalendarEvent, day: string, timeZone: string): string {
  let when: string;
  if (event.isAllDay) {
    when = "All day";
  } else {
    const start = new Date(event.startTime);
    const end = new Date(event.endTime);
    const startDay = localDate(start, timeZone);
    const endDay = localDate(end, timeZone);
    const startLabel = startDay === day ? localTime(start, timeZone) : `${startDay} ${localTime(start, timeZone)}`;
    const endLabel = endDay === day ? localTime(end, timeZone) : `${endDay} ${localTime(end, timeZone)}`;
    when = `${startLabel} - ${endLabel}`;
  }
  const calendar = event.calendar?.name ? ` [${event.calendar.name}]` : "";
  const location = event.location ? ` @ ${event.location}` : "";
  return `${when}: ${event.title}${calendar}${location}${eventFlags(event)}`;
}

/** Events for one local day, all-day first, then by start time. */
export function eventsOnDay(events: CalendarEvent[], day: string, timeZone: string): CalendarEvent[] {
  return events
    .filter((e) => e.status !== "cancelled")
    .filter((e) => {
      const [first, last] = eventDays(e, timeZone);
      return first <= day && day <= last;
    })
    .sort((a, b) => {
      if (a.isAllDay !== b.isAllDay) return a.isAllDay ? -1 : 1;
      return a.startTime.localeCompare(b.startTime);
    });
}

export function formatEventsForDay(events: CalendarEvent[], day: string, timeZone: string): string[] {
  return eventsOnDay(events, day, timeZone).map((e) => formatEventLine(e, day, timeZone));
}

export function isCalendarScopeError(response: ApiResponse<unknown, unknown>): boolean {
  const status = response.error?.statusCode;
  const message = response.error?.message ?? "";
  return (status === 401 || status === 403) && message.includes("calendar:read");
}

export async function fetchCalendarEvents(
  apiClient: ApiClient,
  params: { date?: string; from?: string; to?: string }
): Promise<
  | { ok: true; events: CalendarEvent[]; meta: CalendarEventsMeta }
  | { ok: false; message: string }
> {
  const response = await apiClient.listCalendarEvents(params);
  if (!response.success) {
    if (isCalendarScopeError(response)) return { ok: false, message: CALENDAR_SCOPE_MISSING };
    return { ok: false, message: response.error?.message || "Failed to list calendar events" };
  }
  return {
    ok: true,
    events: response.data ?? [],
    meta: response.meta ?? { total: response.data?.length ?? 0, timezone: "UTC" },
  };
}

function successResponse(text: string) {
  return { content: [{ type: "text" as const, text }] };
}

function errorResponse(message: string) {
  return { content: [{ type: "text" as const, text: `Error: ${message}` }], isError: true };
}

export function registerCalendarEventTools(server: McpServer, apiClient: ApiClient): void {
  defineTool(
    server,
    "list_calendar_events",
    `List events from the user's connected calendars (Google, Outlook, iCloud) for a day or a range of days.

Use this tool to:
- See meetings and other commitments before planning or time-blocking a day
- Find free time between meetings
- Answer "what's on my calendar this week?"

Dates are YYYY-MM-DD in the user's timezone, and times are shown in that timezone.
Treat events as busy time: they are read-only here and cannot be moved or edited.
For a full day view with time blocks too, use get_schedule_for_day.

Returns each event's time (or "All day"), title, calendar name, and location.
Declined and tentative events are marked. Cancelled events are left out.`,
    {
      date: z
        .string()
        .optional()
        .describe("A single day in YYYY-MM-DD format (e.g., '2024-01-15'). Cannot be used with from/to."),
      from: z
        .string()
        .optional()
        .describe(`First day of a range in YYYY-MM-DD format. Use with 'to'. Ranges are at most ${MAX_RANGE_DAYS} days.`),
      to: z
        .string()
        .optional()
        .describe("Last day of the range (inclusive) in YYYY-MM-DD format. Use with 'from'."),
      calendars: z
        .array(z.string())
        .optional()
        .describe("Only include events from these calendars, by calendar name (case-insensitive) or ID. Omit for all calendars."),
    },
    async (input) => {
      try {
        let fromDate: string;
        let toDate: string;
        if (input.date) {
          if (input.from || input.to) return errorResponse("Pass either 'date', or 'from' and 'to', not both.");
          fromDate = toDate = input.date;
        } else if (input.from && input.to) {
          fromDate = input.from;
          toDate = input.to;
        } else {
          return errorResponse("Pass 'date', or both 'from' and 'to' (YYYY-MM-DD).");
        }
        for (const d of [fromDate, toDate]) {
          if (!DATE_REGEX.test(d) || Number.isNaN(Date.parse(d))) {
            return errorResponse(`Invalid date '${d}'. Use YYYY-MM-DD format (e.g., '2024-01-15')`);
          }
        }
        if (toDate < fromDate) return errorResponse(`'to' (${toDate}) must not be before 'from' (${fromDate}).`);
        const spanDays = (Date.parse(toDate) - Date.parse(fromDate)) / 86_400_000 + 1;
        if (spanDays > MAX_RANGE_DAYS) {
          return errorResponse(`Range is ${spanDays} days; ask for at most ${MAX_RANGE_DAYS} days at a time.`);
        }

        const result = await fetchCalendarEvents(
          apiClient,
          input.date ? { date: fromDate } : { from: fromDate, to: toDate }
        );
        if (!result.ok) return errorResponse(result.message);

        const timeZone = result.meta.timezone;
        let events = result.events;
        if (input.calendars?.length) {
          const wanted = input.calendars.map((c) => c.trim().toLowerCase());
          events = events.filter(
            (e) =>
              !!e.calendar &&
              (wanted.includes(e.calendar.id.toLowerCase()) || wanted.includes(e.calendar.name.toLowerCase()))
          );
        }

        const rangeLabel = fromDate === toDate ? fromDate : `${fromDate} to ${toDate}`;
        const lines = [`Calendar events for ${rangeLabel} (times in ${timeZone}):`];
        let count = 0;
        for (let day = fromDate; day <= toDate; day = addDays(day, 1)) {
          const dayLines = formatEventsForDay(events, day, timeZone);
          count += dayLines.length;
          if (fromDate === toDate) {
            lines.push(...dayLines);
          } else if (dayLines.length) {
            lines.push("", `${day}:`, ...dayLines.map((l) => `  ${l}`));
          }
        }

        if (count === 0) {
          const scope = input.calendars?.length ? " in the selected calendars" : "";
          return successResponse(
            `No calendar events for ${rangeLabel}${scope}. (Only calendars connected and turned on in Open Sunsama are included.)`
          );
        }
        return successResponse(lines.join("\n"));
      } catch (error) {
        return errorResponse(error instanceof Error ? error.message : "Unknown error");
      }
    }
  );
}
