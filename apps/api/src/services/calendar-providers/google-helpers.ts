/**
 * Google Calendar helper functions and types
 */
import type { ExternalEvent } from './index';

// Google API interfaces
export interface GoogleCalendarListItem {
  id: string;
  summary: string;
  backgroundColor?: string;
  accessRole: string;
}

export interface GoogleEvent {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  recurrence?: string[];
  recurringEventId?: string;
  status?: string;
  attendees?: Array<{
    self?: boolean;
    responseStatus?: string;
  }>;
  htmlLink?: string;
  etag?: string;
}

export interface GoogleEventsResponse {
  items?: GoogleEvent[];
  nextSyncToken?: string;
  nextPageToken?: string;
}

export interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface GoogleCalendarListResponse {
  items?: GoogleCalendarListItem[];
}

/**
 * Get Google OAuth client ID from environment
 */
export function getClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is required');
  }
  return clientId;
}

/**
 * Get Google OAuth client secret from environment
 */
export function getClientSecret(): string {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
  }
  return clientSecret;
}

/**
 * Map Google event status to our status type
 */
export function mapEventStatus(status?: string): 'confirmed' | 'tentative' | 'cancelled' {
  switch (status) {
    case 'tentative':
      return 'tentative';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'confirmed';
  }
}

/**
 * Map Google response status to our response status type
 */
export function mapResponseStatus(
  responseStatus?: string
): 'accepted' | 'declined' | 'tentative' | 'needsAction' | null {
  switch (responseStatus) {
    case 'accepted':
      return 'accepted';
    case 'declined':
      return 'declined';
    case 'tentative':
      return 'tentative';
    case 'needsAction':
      return 'needsAction';
    default:
      return null;
  }
}

/**
 * Parse a Google Calendar event into our ExternalEvent format
 */
export function parseGoogleEvent(event: GoogleEvent): ExternalEvent | null {
  if (!event.id || !event.start) {
    return null;
  }

  const isAllDay = !event.start.dateTime;
  let startTime: Date;
  let endTime: Date;

  if (isAllDay) {
    startTime = new Date(event.start.date + 'T00:00:00Z');
    endTime = event.end?.date
      ? new Date(event.end.date + 'T00:00:00Z')
      : new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
  } else {
    startTime = new Date(event.start.dateTime!);
    endTime = event.end?.dateTime
      ? new Date(event.end.dateTime)
      : new Date(startTime.getTime() + 60 * 60 * 1000);
  }

  const selfAttendee = event.attendees?.find((a) => a.self);
  const responseStatus = selfAttendee
    ? mapResponseStatus(selfAttendee.responseStatus)
    : null;

  const recurrenceRule =
    event.recurrence?.find((r) => r.startsWith('RRULE:'))?.replace('RRULE:', '') ?? null;

  return {
    externalId: event.id,
    title: event.summary || '(No title)',
    description: event.description ?? null,
    location: event.location ?? null,
    startTime,
    endTime,
    isAllDay,
    timezone: event.start.timeZone ?? null,
    recurrenceRule,
    recurringEventId: event.recurringEventId ?? null,
    status: mapEventStatus(event.status),
    responseStatus,
    htmlLink: event.htmlLink ?? null,
    etag: event.etag ?? null,
  };
}
