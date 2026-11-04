import type { CalendarEvent } from "@open-sunsama/types";

export function isDeclined(
  event: Pick<CalendarEvent, "responseStatus">
): boolean {
  return event.responseStatus === "declined";
}

/** Declined meetings stay visible but faded and struck through. */
export function declinedEventClass(
  event: Pick<CalendarEvent, "responseStatus">
) {
  return isDeclined(event) ? "opacity-50 line-through" : undefined;
}
