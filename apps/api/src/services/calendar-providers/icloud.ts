/**
 * iCloud Calendar (CalDAV) provider implementation
 */
import { DAVClient, type DAVCalendar } from 'tsdav';
import type {
  CalendarProvider,
  OAuthTokens,
  ExternalCalendar,
  ExternalEvent,
  EventPatch,
  SyncOptions,
  SyncResult,
} from './index';
import {
  ProviderAuthError,
  ProviderEventNotFoundError,
} from './index';
import { buildVCalendar, parseCalDavEvent } from './icloud-helpers';
// Node's built-in randomUUID — used when generating UIDs for new events.
import { randomUUID } from 'node:crypto';

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

  async createEvent(
    accessToken: string,
    calendarId: string,
    payload: EventPatch
  ): Promise<ExternalEvent> {
    if (
      !payload.title ||
      payload.startTime === undefined ||
      payload.endTime === undefined
    ) {
      throw new Error('createEvent requires title, startTime, and endTime');
    }
    const credentials =
      this.credentials || (JSON.parse(accessToken) as CalDavCredentials);
    const client = await getCalDavClient(credentials);
    // Generate a stable UID for the new event. CalDAV servers
    // identify events by UID inside the ICS plus by URL on the
    // wire; we derive a filename from the UID so subsequent reads
    // can locate the same object.
    const uid = `${randomUUID()}@open-sunsama`;
    const ics = buildVCalendar({
      uid,
      title: payload.title,
      description: payload.description ?? null,
      location: payload.location ?? null,
      startTime: payload.startTime,
      endTime: payload.endTime,
      isAllDay: payload.isAllDay ?? false,
    });
    const filename = `${uid}.ics`;
    let response: Response;
    try {
      response = (await client.createCalendarObject({
        calendar: { url: calendarId },
        filename,
        iCalString: ics,
      })) as unknown as Response;
    } catch (err) {
      throw mapCalDavError('createEvent', err);
    }
    if (!response.ok) {
      throw await mapCalDavHttpError('createEvent', response);
    }
    // tsdav doesn't return the parsed event — refetch by UID via
    // a single calendar-object query. The new object's URL is the
    // calendar URL + filename.
    const eventUrl = joinUrl(calendarId, filename);
    return {
      externalId: uid,
      title: payload.title,
      description: payload.description ?? null,
      location: payload.location ?? null,
      startTime: payload.startTime,
      endTime: payload.endTime,
      isAllDay: payload.isAllDay ?? false,
      timezone: null,
      recurrenceRule: null,
      recurringEventId: null,
      status: 'confirmed',
      responseStatus: null,
      htmlLink: eventUrl,
      etag: response.headers.get('ETag'),
    };
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventExternalId: string,
    patch: EventPatch
  ): Promise<ExternalEvent> {
    if (!patch.eventUrl) {
      // No URL stored locally → row predates the htmlLink-stores-URL
      // change. Tell the user to re-sync rather than guessing.
      throw new ProviderEventNotFoundError('icloud');
    }
    const credentials =
      this.credentials || (JSON.parse(accessToken) as CalDavCredentials);
    const client = await getCalDavClient(credentials);
    // CalDAV PUT replaces the entire object — we need to send the
    // FULL ICS, not just the changed fields. Fetch the current
    // object, parse it, merge the patch, then re-serialise.
    const existing = await fetchSingleObject(client, calendarId, patch.eventUrl);
    if (!existing) {
      throw new ProviderEventNotFoundError('icloud');
    }
    const merged = mergePatchIntoEvent(existing, patch);
    const ics = buildVCalendar({
      uid: existing.externalId,
      title: merged.title,
      description: merged.description,
      location: merged.location,
      startTime: merged.startTime,
      endTime: merged.endTime,
      isAllDay: merged.isAllDay,
    });
    let response: Response;
    try {
      response = (await client.updateCalendarObject({
        calendarObject: {
          url: patch.eventUrl,
          data: ics,
          etag: existing.etag ?? '',
        },
      })) as unknown as Response;
    } catch (err) {
      throw mapCalDavError('updateEvent', err);
    }
    if (!response.ok) {
      throw await mapCalDavHttpError('updateEvent', response);
    }
    return {
      externalId: existing.externalId,
      title: merged.title,
      description: merged.description,
      location: merged.location,
      startTime: merged.startTime,
      endTime: merged.endTime,
      isAllDay: merged.isAllDay,
      // Carry the rest forward from the existing event — CalDAV
      // doesn't surface RRULE/timezone changes through this path
      // so they stay as they were.
      timezone: existing.timezone,
      recurrenceRule: existing.recurrenceRule,
      recurringEventId: existing.recurringEventId,
      status: existing.status,
      responseStatus: existing.responseStatus,
      htmlLink: patch.eventUrl,
      etag: response.headers.get('ETag') ?? existing.etag,
    };
  }

  async deleteEvent(
    accessToken: string,
    _calendarId: string,
    _eventExternalId: string,
    extra?: { eventUrl?: string | null; etag?: string | null }
  ): Promise<void> {
    const eventUrl = extra?.eventUrl;
    if (!eventUrl) {
      throw new ProviderEventNotFoundError('icloud');
    }
    const credentials =
      this.credentials || (JSON.parse(accessToken) as CalDavCredentials);
    const client = await getCalDavClient(credentials);
    try {
      const response = (await client.deleteCalendarObject({
        calendarObject: {
          url: eventUrl,
          etag: extra.etag ?? '',
        },
      })) as unknown as Response;
      // 404/410 = already gone. Anything else non-2xx is real.
      if (
        !response.ok &&
        response.status !== 404 &&
        response.status !== 410
      ) {
        throw await mapCalDavHttpError('deleteEvent', response);
      }
    } catch (err) {
      throw mapCalDavError('deleteEvent', err);
    }
  }
}

/** Build (and login to) a tsdav client for the supplied credentials. */
async function getCalDavClient(
  credentials: CalDavCredentials
): Promise<DAVClient> {
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
  return client;
}

/** Re-fetch a single CalDAV object so we can merge a partial patch. */
async function fetchSingleObject(
  client: DAVClient,
  calendarUrl: string,
  objectUrl: string
): Promise<ExternalEvent | null> {
  const objects = await client.fetchCalendarObjects({
    calendar: { url: calendarUrl },
    objectUrls: [objectUrl],
  });
  const obj = objects[0];
  if (!obj) return null;
  return parseCalDavEvent(obj);
}

/**
 * Merge an EventPatch into an existing parsed event, returning the
 * full set of fields needed to rebuild the ICS. CalDAV PUT replaces
 * the entire object so we can't send a partial — every field must be
 * specified or the server treats omissions as deletions.
 */
function mergePatchIntoEvent(
  existing: ExternalEvent,
  patch: EventPatch
): {
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
} {
  return {
    title: patch.title ?? existing.title,
    description:
      patch.description !== undefined ? patch.description : existing.description,
    location:
      patch.location !== undefined ? patch.location : existing.location,
    startTime: patch.startTime ?? existing.startTime,
    endTime: patch.endTime ?? existing.endTime,
    isAllDay: patch.isAllDay ?? existing.isAllDay,
  };
}

/** Map a thrown error from tsdav to a typed provider error. */
function mapCalDavError(op: string, err: unknown): Error {
  const message = err instanceof Error ? err.message : 'Unknown error';
  if (/401|Unauthorized|403|Forbidden/i.test(message)) {
    return new ProviderAuthError('icloud');
  }
  if (/404|410|Not Found|Gone/i.test(message)) {
    return new ProviderEventNotFoundError('icloud');
  }
  return new Error(`iCloud ${op} failed: ${message}`);
}

/** Map a non-2xx Response from a tsdav call to a typed error. */
async function mapCalDavHttpError(op: string, response: Response): Promise<Error> {
  if (response.status === 404 || response.status === 410) {
    return new ProviderEventNotFoundError('icloud');
  }
  if (response.status === 401 || response.status === 403) {
    return new ProviderAuthError('icloud');
  }
  let body = '';
  try {
    body = await response.text();
  } catch {
    /* ignore */
  }
  return new Error(`iCloud ${op} failed (${response.status}): ${body.slice(0, 200)}`);
}

/** Concatenate a base URL with a filename, handling trailing slashes. */
function joinUrl(base: string, filename: string): string {
  return base.endsWith('/') ? `${base}${filename}` : `${base}/${filename}`;
}
