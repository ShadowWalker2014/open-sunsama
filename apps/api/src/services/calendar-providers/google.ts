/**
 * Google Calendar provider implementation
 */
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
  getClientId,
  getClientSecret,
  parseGoogleEvent,
  type GoogleCalendarListItem,
  type GoogleEvent,
  type GoogleEventsResponse,
  type GoogleTokenResponse,
  type GoogleCalendarListResponse,
} from './google-helpers';

const GOOGLE_OAUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
].join(' ');

export class GoogleCalendarProvider implements CalendarProvider {
  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: getClientId(),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      state,
      access_type: 'offline',
      prompt: 'consent',
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
        singleEvents: 'true',
        showDeleted: 'true',
      });

      if (options.syncToken) {
        params.set('syncToken', options.syncToken);
      } else {
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

    const body: Partial<GoogleEvent> = {
      summary: payload.title,
    };
    if (payload.description !== undefined) {
      body.description = payload.description ?? '';
    }
    if (payload.location !== undefined) {
      body.location = payload.location ?? '';
    }
    if (payload.isAllDay) {
      body.start = { date: toUtcDateString(payload.startTime) };
      body.end = { date: toUtcDateString(payload.endTime) };
    } else {
      const tz = payload.timezone ?? 'UTC';
      body.start = {
        dateTime: payload.startTime.toISOString(),
        timeZone: tz,
      };
      body.end = {
        dateTime: payload.endTime.toISOString(),
        timeZone: tz,
      };
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      if (response.status === 404 || response.status === 410) {
        throw new ProviderEventNotFoundError('google');
      }
      if (response.status === 401 || response.status === 403) {
        throw new ProviderAuthError('google');
      }
      const error = await response.text();
      throw new Error(
        `Google createEvent failed (${response.status}): ${error}`
      );
    }

    const data = (await response.json()) as GoogleEvent;
    const parsed = parseGoogleEvent(data);
    if (!parsed) {
      throw new Error('Google returned an event that could not be parsed');
    }
    return parsed;
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    patch: EventPatch
  ): Promise<ExternalEvent> {
    const body: Partial<GoogleEvent> = {};

    if (patch.title !== undefined) {
      body.summary = patch.title;
    }
    if (patch.description !== undefined) {
      // Google accepts empty string to clear; sending null is invalid.
      body.description = patch.description ?? '';
    }
    if (patch.location !== undefined) {
      body.location = patch.location ?? '';
    }
    if (patch.startTime !== undefined || patch.endTime !== undefined) {
      if (patch.startTime === undefined || patch.endTime === undefined) {
        throw new Error('startTime and endTime must be supplied together');
      }
      if (patch.isAllDay) {
        // Google all-day events use `date: "YYYY-MM-DD"` and the
        // exclusive-end convention (end is the day AFTER the last
        // covered day). Caller is expected to follow that convention.
        body.start = { date: toUtcDateString(patch.startTime) };
        body.end = { date: toUtcDateString(patch.endTime) };
      } else {
        const tz = patch.timezone ?? 'UTC';
        body.start = {
          dateTime: patch.startTime.toISOString(),
          timeZone: tz,
        };
        body.end = {
          dateTime: patch.endTime.toISOString(),
          timeZone: tz,
        };
      }
    }

    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }
    );

    if (!response.ok) {
      // Map common Google error codes to typed errors so the route
      // layer can produce clean, actionable messages instead of
      // forwarding the raw Google JSON to the user.
      if (response.status === 404 || response.status === 410) {
        throw new ProviderEventNotFoundError('google');
      }
      if (response.status === 401 || response.status === 403) {
        throw new ProviderAuthError('google');
      }
      const error = await response.text();
      throw new Error(
        `Google updateEvent failed (${response.status}): ${error}`
      );
    }

    const data = (await response.json()) as GoogleEvent;
    const parsed = parseGoogleEvent(data);
    if (!parsed) {
      throw new Error('Google returned an event that could not be parsed');
    }
    return parsed;
  }

  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    const response = await fetch(
      `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(calendarId)}/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 404 / 410 = already deleted upstream. Treat as success — local
    // row will be cleaned up alongside.
    if (!response.ok && response.status !== 410 && response.status !== 404) {
      if (response.status === 401 || response.status === 403) {
        throw new ProviderAuthError('google');
      }
      const error = await response.text();
      throw new Error(
        `Google deleteEvent failed (${response.status}): ${error}`
      );
    }
  }
}

/**
 * Format a Date as YYYY-MM-DD using UTC components — required by Google's
 * all-day event date format. The input is expected to already represent
 * UTC midnight on the target calendar date (per the iCal convention).
 */
function toUtcDateString(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}
