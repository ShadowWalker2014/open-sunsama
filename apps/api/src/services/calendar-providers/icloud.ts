import { DAVClient, DAVCalendar, DAVObject } from 'tsdav';
import type {
  CalendarProvider,
  OAuthTokens,
  ExternalCalendar,
  ExternalEvent,
  SyncOptions,
  SyncResult,
} from './index';

const ICLOUD_CALDAV_URL = 'https://caldav.icloud.com';

interface CalDavCredentials {
  username: string; // Apple ID email
  password: string; // App-specific password
  serverUrl?: string; // Optional custom CalDAV URL
}

interface VCalendarComponent {
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
function parseICalDateTime(value: string, isAllDay: boolean): Date {
  if (isAllDay || value.length === 8) {
    // All-day: YYYYMMDD
    const year = parseInt(value.slice(0, 4), 10);
    const month = parseInt(value.slice(4, 6), 10) - 1;
    const day = parseInt(value.slice(6, 8), 10);
    return new Date(Date.UTC(year, month, day));
  }

  // Timed: YYYYMMDDTHHmmss or YYYYMMDDTHHmmssZ
  const year = parseInt(value.slice(0, 4), 10);
  const month = parseInt(value.slice(4, 6), 10) - 1;
  const day = parseInt(value.slice(6, 8), 10);
  const hour = parseInt(value.slice(9, 11), 10);
  const minute = parseInt(value.slice(11, 13), 10);
  const second = parseInt(value.slice(13, 15), 10);

  if (value.endsWith('Z')) {
    return new Date(Date.UTC(year, month, day, hour, minute, second));
  }

  // Without Z, assume local time - create as UTC for consistency
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

/**
 * Simple iCalendar parser - extracts VEVENT components
 * Note: This is a simplified parser. For production, consider a full iCal library.
 */
function parseVCalendar(icalData: string): VCalendarComponent | null {
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

    // Handle properties with parameters (e.g., DTSTART;VALUE=DATE:20240101)
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

function mapCalDavStatus(status?: string): 'confirmed' | 'tentative' | 'cancelled' {
  switch (status?.toUpperCase()) {
    case 'TENTATIVE':
      return 'tentative';
    case 'CANCELLED':
      return 'cancelled';
    default:
      return 'confirmed';
  }
}

function parseCalDavEvent(obj: DAVObject): ExternalEvent | null {
  if (!obj.data) return null;

  const event = parseVCalendar(obj.data);
  if (!event?.uid || !event.dtstart) return null;

  const isAllDay = event.dtstart.length === 8;
  const startTime = parseICalDateTime(event.dtstart, isAllDay);
  
  let endTime: Date;
  if (event.dtend) {
    endTime = parseICalDateTime(event.dtend, isAllDay);
  } else {
    // Default duration
    endTime = new Date(startTime.getTime() + (isAllDay ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000));
  }

  // Extract etag from response
  const etag = obj.etag ?? null;

  return {
    externalId: event.uid,
    title: event.summary || '(No title)',
    description: event.description ?? null,
    location: event.location ?? null,
    startTime,
    endTime,
    isAllDay,
    timezone: null, // CalDAV doesn't reliably provide timezone in simplified format
    recurrenceRule: event.rrule ?? null,
    recurringEventId: null, // Would need more parsing for recurring events
    status: mapCalDavStatus(event.status),
    responseStatus: null, // Not typically available in CalDAV for personal calendars
    htmlLink: null, // iCloud doesn't provide web links
    etag,
  };
}

/**
 * Validate CalDAV credentials by attempting to connect and list calendars
 */
export async function validateCalDavCredentials(
  credentials: CalDavCredentials
): Promise<{ valid: boolean; error?: string }> {
  try {
    const client = new DAVClient({
      serverUrl: credentials.serverUrl || ICLOUD_CALDAV_URL,
      credentials: {
        username: credentials.username,
        password: credentials.password,
      },
      authMethod: 'Basic',
      defaultAccountType: 'caldav',
    });

    await client.login();
    
    // Try to fetch calendars to verify access
    const calendars = await client.fetchCalendars();
    
    if (!calendars || calendars.length === 0) {
      return { valid: false, error: 'No calendars found. Check your Apple ID and app-specific password.' };
    }

    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    
    // Provide helpful error messages
    if (message.includes('401') || message.includes('Unauthorized')) {
      return {
        valid: false,
        error: 'Invalid credentials. Make sure you are using an app-specific password, not your Apple ID password.',
      };
    }
    
    return { valid: false, error: message };
  }
}

/**
 * List all calendars from a CalDAV account
 */
export async function listCalDavCalendars(
  credentials: CalDavCredentials
): Promise<ExternalCalendar[]> {
  const client = new DAVClient({
    serverUrl: credentials.serverUrl || ICLOUD_CALDAV_URL,
    credentials: {
      username: credentials.username,
      password: credentials.password,
    },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  });

  await client.login();
  const calendars = await client.fetchCalendars();

  return calendars.map((cal: DAVCalendar) => ({
    externalId: cal.url,
    name: typeof cal.displayName === 'string' ? cal.displayName : 'Unnamed Calendar',
    color: cal.calendarColor ?? null,
    isReadOnly: false, // CalDAV doesn't expose this reliably
  }));
}

/**
 * List events from a CalDAV calendar within a date range
 */
export async function listCalDavEvents(
  credentials: CalDavCredentials,
  calendarUrl: string,
  options: SyncOptions
): Promise<SyncResult> {
  const client = new DAVClient({
    serverUrl: credentials.serverUrl || ICLOUD_CALDAV_URL,
    credentials: {
      username: credentials.username,
      password: credentials.password,
    },
    authMethod: 'Basic',
    defaultAccountType: 'caldav',
  });

  await client.login();

  // Fetch calendar objects
  const objects = await client.fetchCalendarObjects({
    calendar: {
      url: calendarUrl,
    },
    timeRange: options.timeMin && options.timeMax
      ? {
          start: options.timeMin.toISOString(),
          end: options.timeMax.toISOString(),
        }
      : undefined,
  });

  const events: ExternalEvent[] = [];
  const deleted: string[] = [];

  for (const obj of objects) {
    const event = parseCalDavEvent(obj);
    if (event) {
      events.push(event);
    }
  }

  // CalDAV doesn't have a sync token mechanism like Google/Outlook
  // We rely on ETags for change detection at the event level
  // The caller should compare ETags to detect changes
  return {
    events,
    deleted,
    nextSyncToken: null, // CalDAV uses ETags per-event, not sync tokens
  };
}

/**
 * ICloudCalendarProvider implements the CalendarProvider interface
 * but uses CalDAV instead of OAuth.
 * 
 * Note: getAuthUrl, exchangeCode, and refreshTokens throw errors
 * since iCloud uses CalDAV with app-specific passwords, not OAuth.
 * Use the standalone functions above for iCloud operations.
 */
export class ICloudCalendarProvider implements CalendarProvider {
  private credentials: CalDavCredentials | null = null;

  constructor(credentials?: CalDavCredentials) {
    this.credentials = credentials ?? null;
  }

  getAuthUrl(): string {
    throw new Error(
      'iCloud does not use OAuth. Use app-specific passwords with CalDAV instead.'
    );
  }

  exchangeCode(): Promise<OAuthTokens> {
    throw new Error(
      'iCloud does not use OAuth. Use app-specific passwords with CalDAV instead.'
    );
  }

  refreshTokens(): Promise<OAuthTokens> {
    throw new Error(
      'iCloud does not use OAuth tokens. CalDAV credentials do not expire.'
    );
  }

  async listCalendars(accessToken: string): Promise<ExternalCalendar[]> {
    // For the interface, we expect credentials to be JSON-encoded in accessToken
    // This is a workaround to fit CalDAV into the OAuth-based interface
    const credentials = this.credentials || JSON.parse(accessToken) as CalDavCredentials;
    return listCalDavCalendars(credentials);
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    const credentials = this.credentials || JSON.parse(accessToken) as CalDavCredentials;
    return listCalDavEvents(credentials, calendarId, options);
  }
}
