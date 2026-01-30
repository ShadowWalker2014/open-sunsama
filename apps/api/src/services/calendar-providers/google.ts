/**
 * Google Calendar provider implementation
 */
import type {
  CalendarProvider,
  OAuthTokens,
  ExternalCalendar,
  ExternalEvent,
  SyncOptions,
  SyncResult,
} from './index';
import {
  getClientId,
  getClientSecret,
  parseGoogleEvent,
  type GoogleCalendarListItem,
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
}
