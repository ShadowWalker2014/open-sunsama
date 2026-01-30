import type {
  CalendarProvider,
  OAuthTokens,
  ExternalCalendar,
  ExternalEvent,
  SyncOptions,
  SyncResult,
} from './index';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
].join(' ');

interface GoogleCalendarListItem {
  id: string;
  summary: string;
  backgroundColor?: string;
  accessRole: string;
}

interface GoogleEvent {
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

interface GoogleEventsResponse {
  items?: GoogleEvent[];
  nextSyncToken?: string;
  nextPageToken?: string;
}

interface GoogleTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface GoogleCalendarListResponse {
  items?: GoogleCalendarListItem[];
}

function getClientId(): string {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID environment variable is required');
  }
  return clientId;
}

function getClientSecret(): string {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error('GOOGLE_CLIENT_SECRET environment variable is required');
  }
  return clientSecret;
}

function mapEventStatus(status?: string): 'confirmed' | 'tentative' | 'cancelled' {
  switch (status) {
    case 'tentative':
      return 'tentative';
    case 'cancelled':
      return 'cancelled';
    default:
      return 'confirmed';
  }
}

function mapResponseStatus(
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

function parseGoogleEvent(event: GoogleEvent): ExternalEvent | null {
  // Skip events without required fields
  if (!event.id || !event.start) {
    return null;
  }

  const isAllDay = !event.start.dateTime;
  let startTime: Date;
  let endTime: Date;

  if (isAllDay) {
    // All-day events use date strings (YYYY-MM-DD)
    startTime = new Date(event.start.date + 'T00:00:00Z');
    endTime = event.end?.date
      ? new Date(event.end.date + 'T00:00:00Z')
      : new Date(startTime.getTime() + 24 * 60 * 60 * 1000); // Default 1 day
  } else {
    startTime = new Date(event.start.dateTime!);
    endTime = event.end?.dateTime
      ? new Date(event.end.dateTime)
      : new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour
  }

  // Get the user's response status from attendees
  const selfAttendee = event.attendees?.find((a) => a.self);
  const responseStatus = selfAttendee
    ? mapResponseStatus(selfAttendee.responseStatus)
    : null;

  // Parse recurrence rule (first RRULE if present)
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

export class GoogleCalendarProvider implements CalendarProvider {
  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: getClientId(),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      state,
      access_type: 'offline',
      prompt: 'consent', // Force refresh token on every auth
    });

    return `${GOOGLE_OAUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: getClientId(),
        client_secret: getClientSecret(),
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to exchange code: ${error}`);
    }

    const data = (await response.json()) as GoogleTokenResponse;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token!,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: getClientId(),
        client_secret: getClientSecret(),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = (await response.json()) as GoogleTokenResponse;

    return {
      accessToken: data.access_token,
      // Google may return a new refresh token, but usually doesn't
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async listCalendars(accessToken: string): Promise<ExternalCalendar[]> {
    const response = await fetch(`${GOOGLE_CALENDAR_API}/users/me/calendarList`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list calendars: ${error}`);
    }

    const data = (await response.json()) as GoogleCalendarListResponse;
    const items: GoogleCalendarListItem[] = data.items || [];

    return items.map((cal) => ({
      externalId: cal.id,
      name: cal.summary,
      color: cal.backgroundColor ?? null,
      isReadOnly: cal.accessRole === 'reader' || cal.accessRole === 'freeBusyReader',
    }));
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    const events: ExternalEvent[] = [];
    const deleted: string[] = [];
    let pageToken: string | undefined;
    let nextSyncToken: string | null = null;

    do {
      const params = new URLSearchParams({
        maxResults: '250',
        singleEvents: 'true', // Expand recurring events
        showDeleted: 'true', // Include deleted for sync
      });

      if (options.syncToken) {
        params.set('syncToken', options.syncToken);
      } else {
        // Initial sync - require time bounds
        if (options.timeMin) {
          params.set('timeMin', options.timeMin.toISOString());
        }
        if (options.timeMax) {
          params.set('timeMax', options.timeMax.toISOString());
        }
      }

      if (pageToken) {
        params.set('pageToken', pageToken);
      }

      const response = await fetch(
        `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        
        // Handle invalid sync token - caller should retry without it
        if (response.status === 410) {
          throw new Error('SYNC_TOKEN_INVALID');
        }
        
        throw new Error(`Failed to list events: ${error}`);
      }

      const data = (await response.json()) as GoogleEventsResponse;

      for (const item of data.items || []) {
        if (item.status === 'cancelled') {
          deleted.push(item.id);
        } else {
          const event = parseGoogleEvent(item);
          if (event) {
            events.push(event);
          }
        }
      }

      pageToken = data.nextPageToken;
      if (data.nextSyncToken) {
        nextSyncToken = data.nextSyncToken;
      }
    } while (pageToken);

    return {
      events,
      deleted,
      nextSyncToken,
    };
  }
}
