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
import {
  buildVCalendar,
  parseCalDavEvent,
  parseCalDavEventWithRaw,
} from './icloud-helpers';
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
    // CalDAV PUT replaces the entire object (RFC 4791 §5.3.2) — we
    // must send the FULL ICS, not just the changed fields. Anything
    // we omit gets deleted server-side. The most catastrophic case
    // is RRULE: dropping it on update silently destroys a recurring
    // series everywhere it syncs (iPhone, Mac Calendar, shared
    // attendees), so the existing VEVENT's recurrence + sequence
    // must be carried forward by hand.
    const existingPair = await fetchSingleObjectWithRaw(
      client,
      calendarId,
      patch.eventUrl
    );
    if (!existingPair) {
      throw new ProviderEventNotFoundError('icloud');
    }
    const { event: existing, raw } = existingPair;
    const merged = mergePatchIntoEvent(existing, patch);
    const ics = buildVCalendar({
      uid: existing.externalId,
      title: merged.title,
      description: merged.description,
      location: merged.location,
      startTime: merged.startTime,
      endTime: merged.endTime,
      isAllDay: merged.isAllDay,
      // Preserve the recurrence rule so the series stays intact.
      // Per RFC 5545 §3.6.1, RRULE is a property of the master
      // VEVENT — omitting it on PUT means "no longer recurring".
      rrule: existing.recurrenceRule,
      // Bump SEQUENCE per RFC 5546 §3.1.4 so downstream clients
      // (iOS Calendar, shared attendees) accept the update instead
      // of treating it as stale.
      sequence: (raw.sequence ?? 0) + 1,
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
      // Carry the rest forward — RRULE was preserved on the wire
      // above, and timezone isn't exposed through our patch shape.
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

/**
 * Re-fetch a single CalDAV object and return both the parsed
 * `ExternalEvent` and its raw `VCalendarComponent`. Update needs the
 * raw component for iCloud-specific properties (SEQUENCE) that
 * aren't part of the cross-provider `ExternalEvent` shape.
 */
async function fetchSingleObjectWithRaw(
  client: DAVClient,
  calendarUrl: string,
  objectUrl: string
) {
  const objects = await client.fetchCalendarObjects({
    calendar: { url: calendarUrl },
    objectUrls: [objectUrl],
  });
  const obj = objects[0];
  if (!obj) return null;
  return parseCalDavEventWithRaw(obj);
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

/**
 * Map a thrown error from tsdav to a typed provider error.
 *
 * Pass-through for already-typed errors (`ProviderEventNotFoundError`,
 * `ProviderAuthError`, `ProviderReadOnlyError`) — without this guard,
 * a typed error thrown inside a `try` block would be re-wrapped here
 * as a generic `Error("iCloud ... failed: ...")`, the route's
 * `instanceof` checks would miss, and the user would see a 502
 * instead of the friendly 410/401 toast.
 */
function mapCalDavError(op: string, err: unknown): Error {
  if (
    err instanceof ProviderAuthError ||
    err instanceof ProviderEventNotFoundError
  ) {
    return err;
  }
  const message = err instanceof Error ? err.message : 'Unknown error';
  // tsdav's error messages vary across versions and code paths
  // (network-level, response-status, parse failures). Match a wider
  // set of auth-related patterns including the WWW-Authenticate
  // challenge wording iCloud emits and the literal status keywords.
  if (
    /401|403|Unauthorized|Forbidden|invalid_grant|authentication|credentials/i.test(
      message
    )
  ) {
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

/**
 * Resolve a CalDAV object URL relative to the calendar URL — must
 * use `new URL(...).href` so the resulting string matches what tsdav
 * itself produces internally on PUT (which percent-encodes special
 * characters like `@`). String-concatenation here would store
 * `...calendar/UUID@open-sunsama.ics` locally while iCloud's
 * canonical href is `...calendar/UUID%40open-sunsama.ics`, and the
 * next sync would create a duplicate row keyed off the encoded form.
 */
function joinUrl(base: string, filename: string): string {
  // `new URL(filename, base)` requires `base` to end with `/` to
  // resolve as a directory; ensure that.
  const baseWithSlash = base.endsWith('/') ? base : `${base}/`;
  return new URL(filename, baseWithSlash).href;
}
