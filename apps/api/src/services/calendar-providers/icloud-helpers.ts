/**
 * iCloud Calendar (CalDAV) helper functions and types
 */
import type { DAVObject } from 'tsdav';
import type { ExternalEvent } from './index';

export interface VCalendarComponent {
  uid?: string;
  summary?: string;
  description?: string;
  location?: string;
  dtstart?: string;
  dtend?: string;
  rrule?: string;
  status?: string;
  etag?: string;
}

/**
 * Parse an iCalendar date-time string
 * Handles formats: YYYYMMDD, YYYYMMDDTHHmmss, YYYYMMDDTHHmmssZ
 */
export function parseICalDateTime(value: string, isAllDay: boolean): Date {
  if (isAllDay || value.length === 8) {
    const year = parseInt(value.slice(0, 4), 10);
    const month = parseInt(value.slice(4, 6), 10) - 1;
    const day = parseInt(value.slice(6, 8), 10);
    return new Date(Date.UTC(year, month, day));
  }

  const year = parseInt(value.slice(0, 4), 10);
  const month = parseInt(value.slice(4, 6), 10) - 1;
  const day = parseInt(value.slice(6, 8), 10);
  const hour = parseInt(value.slice(9, 11), 10);
  const minute = parseInt(value.slice(11, 13), 10);
  const second = parseInt(value.slice(13, 15), 10);

  if (value.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

/**
 * Simple iCalendar parser - extracts VEVENT components
 * Note: This is a simplified parser. For production, consider a full iCal library.
 */
export function parseVCalendar(icalData: string): VCalendarComponent | null {
  const lines = icalData.replace(/\r\n /g, '').split(/\r?\n/);

  let inEvent = false;
  const event: VCalendarComponent = {};

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      inEvent = true;
      continue;
    }
    if (line === 'END:VEVENT') {
      break;
    }
    if (!inEvent) continue;

    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    let key = line.slice(0, colonIndex);
    const value = line.slice(colonIndex + 1);

    const semicolonIndex = key.indexOf(';');
    if (semicolonIndex !== -1) {
      key = key.slice(0, semicolonIndex);
    }

    switch (key.toUpperCase()) {
      case 'UID':
        event.uid = value;
        break;
      case 'SUMMARY':
        event.summary = value;
        break;
      case 'DESCRIPTION':
        event.description = value;
        break;
      case 'LOCATION':
        event.location = value;
        break;
      case 'DTSTART':
        event.dtstart = value;
        break;
      case 'DTEND':
        event.dtend = value;
        break;
      case 'RRULE':
        event.rrule = value;
        break;
      case 'STATUS':
        event.status = value;
        break;
    }
  }

  return event.uid ? event : null;
}

/**
 * Map CalDAV status to our status type
 */
export function mapCalDavStatus(status?: string): 'confirmed' | 'tentative' | 'cancelled' {
  switch (status?.toUpperCase()) {
    case 'TENTATIVE':
      return 'tentative';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'confirmed';
  }
}

/**
 * Parse a CalDAV event object into our ExternalEvent format
 */
export function parseCalDavEvent(obj: DAVObject): ExternalEvent | null {
  if (!obj.data) return null;

  const event = parseVCalendar(obj.data);
  if (!event?.uid || !event.dtstart) return null;

  const isAllDay = event.dtstart.length === 8;
  const startTime = parseICalDateTime(event.dtstart, isAllDay);

  let endTime: Date;
  if (event.dtend) {
    endTime = parseICalDateTime(event.dtend, isAllDay);
  } else {
    endTime = new Date(startTime.getTime() + (isAllDay ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000));
  }

  const etag = obj.etag ?? null;

  return {
    externalId: event.uid,
    title: event.summary || '(No title)',
    description: event.description ?? null,
    location: event.location ?? null,
    startTime,
    endTime,
    isAllDay,
    timezone: null,
    recurrenceRule: event.rrule ?? null,
    recurringEventId: null,
    status: mapCalDavStatus(event.status),
    responseStatus: null,
    // CalDAV addresses events by URL (the .ics object's full HREF),
    // not just by UID. Stash it in `htmlLink` so write-back can
    // reach the right object via tsdav's update/delete methods.
    // For Google/Outlook, htmlLink is the user-facing web URL; for
    // iCloud, we repurpose the column as the addressable resource
    // URL. Existing rows synced before this change will have null
    // here — write-back returns a clear 410 telling the user to run
    // "Reset & re-sync" to repopulate.
    htmlLink: obj.url ?? null,
    etag,
  };
}

/**
 * Build a minimal vCalendar VEVENT string for CalDAV PUT operations.
 * This is enough for create/update — iCloud accepts a full VCALENDAR
 * envelope around a single VEVENT. We don't write timezone components
 * (VTIMEZONE) because iCloud accepts UTC dateTimes via the Z suffix.
 */
export function buildVCalendar(input: {
  uid: string;
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
}): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Open Sunsama//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${escapeICS(input.uid)}`,
    `DTSTAMP:${formatICalUtc(new Date())}`,
    `SUMMARY:${escapeICS(input.title)}`,
  ];
  if (input.description) {
    lines.push(`DESCRIPTION:${escapeICS(input.description)}`);
  }
  if (input.location) {
    lines.push(`LOCATION:${escapeICS(input.location)}`);
  }
  if (input.isAllDay) {
    lines.push(`DTSTART;VALUE=DATE:${formatICalDate(input.startTime)}`);
    lines.push(`DTEND;VALUE=DATE:${formatICalDate(input.endTime)}`);
  } else {
    lines.push(`DTSTART:${formatICalUtc(input.startTime)}`);
    lines.push(`DTEND:${formatICalUtc(input.endTime)}`);
  }
  lines.push('END:VEVENT', 'END:VCALENDAR');
  // CRLF line endings per RFC 5545.
  return lines.join('\r\n');
}

/** YYYYMMDD for VALUE=DATE all-day events. Reads UTC components per the iCal convention. */
function formatICalDate(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}${m}${dd}`;
}

/** YYYYMMDDTHHMMSSZ — iCal UTC dateTime. */
function formatICalUtc(d: Date): string {
  const y = d.getUTCFullYear();
  const M = String(d.getUTCMonth() + 1).padStart(2, '0');
  const D = String(d.getUTCDate()).padStart(2, '0');
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${y}${M}${D}T${h}${m}${s}Z`;
}

/** Escape commas, semicolons, backslashes, newlines per RFC 5545. */
function escapeICS(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}
