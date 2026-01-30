/**
 * iCloud Calendar (CalDAV) provider implementation
 */
import { DAVClient, type DAVCalendar } from 'tsdav';
import type {
  CalendarProvider,
  OAuthTokens,
  ExternalCalendar,
  ExternalEvent,
  SyncOptions,
  SyncResult,
} from './index';
import { parseCalDavEvent } from './icloud-helpers';

const ICLOUD_CALDAV_URL = 'https://caldav.icloud.com';

export interface CalDavCredentials {
  username: string; // Apple ID email
  password: string; // App-specific password
  serverUrl?: string; // Optional custom CalDAV URL
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

    const calendars = await client.fetchCalendars();

    if (!calendars || calendars.length === 0) {
      return { valid: false, error: 'No calendars found. Check your Apple ID and app-specific password.' };
    }

    return { valid: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

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
    isReadOnly: false,
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

  return {
    events,
    deleted,
    nextSyncToken: null,
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
