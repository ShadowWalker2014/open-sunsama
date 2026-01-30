/**
 * Outlook Calendar provider implementation
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
  parseOutlookEvent,
  OUTLOOK_COLORS,
  type OutlookCalendar,
  type OutlookEventsResponse,
  type OutlookTokenResponse,
  type OutlookCalendarListResponse,
} from './outlook-helpers';

const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API = 'https://graph.microsoft.com/v1.0';

const SCOPES = [
  'Calendars.Read',
  'Calendars.ReadWrite',
  'offline_access',
].join(' ');

export class OutlookCalendarProvider implements CalendarProvider {
  getAuthUrl(state: string, redirectUri: string): string {
    const params = new URLSearchParams({
      client_id: getClientId(),
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: SCOPES,
      state,
      response_mode: 'query',
    });

    return `${MICROSOFT_AUTH_URL}?${params.toString()}`;
  }

  async exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens> {
    const response = await fetch(MICROSOFT_TOKEN_URL, {
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

    const data = (await response.json()) as OutlookTokenResponse;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token!,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    const response = await fetch(MICROSOFT_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: getClientId(),
        client_secret: getClientSecret(),
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
        scope: SCOPES,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    const data = (await response.json()) as OutlookTokenResponse;

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    };
  }

  async listCalendars(accessToken: string): Promise<ExternalCalendar[]> {
    const response = await fetch(`${GRAPH_API}/me/calendars`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list calendars: ${error}`);
    }

    const data = (await response.json()) as OutlookCalendarListResponse;
    const items: OutlookCalendar[] = data.value || [];

    return items.map((cal) => {
      let color: string | null = null;
      if (cal.color) {
        const mappedColor = OUTLOOK_COLORS[cal.color];
        color = mappedColor !== undefined ? mappedColor : '#0078D4';
      }
      return {
        externalId: cal.id,
        name: cal.name,
        color,
        isReadOnly: !cal.canEdit,
      };
    });
  }

  async listEvents(
    accessToken: string,
    calendarId: string,
    options: SyncOptions
  ): Promise<SyncResult> {
    const events: ExternalEvent[] = [];
    const deleted: string[] = [];
    let nextLink: string | null = null;
    let deltaLink: string | null = null;

    let url: string;
    if (options.syncToken) {
      url = options.syncToken;
    } else {
      const params = new URLSearchParams({
        $top: '250',
        $select: 'id,subject,body,location,start,end,isAllDay,recurrence,seriesMasterId,showAs,responseStatus,webLink,changeKey',
      });

      if (options.timeMin && options.timeMax) {
        params.set('startDateTime', options.timeMin.toISOString());
        params.set('endDateTime', options.timeMax.toISOString());
        url = `${GRAPH_API}/me/calendars/${encodeURIComponent(calendarId)}/calendarView?${params.toString()}`;
      } else {
        url = `${GRAPH_API}/me/calendars/${encodeURIComponent(calendarId)}/events/delta?${params.toString()}`;
      }
    }

    do {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Prefer: 'odata.maxpagesize=250',
        },
      });

      if (!response.ok) {
        const error = await response.text();

        if (response.status === 410 || response.status === 400) {
          throw new Error('SYNC_TOKEN_INVALID');
        }

        throw new Error(`Failed to list events: ${error}`);
      }

      const data = (await response.json()) as OutlookEventsResponse;

      for (const item of data.value || []) {
        if (item['@removed']) {
          deleted.push(item.id);
        } else {
          const event = parseOutlookEvent(item);
          if (event) {
            events.push(event);
          }
        }
      }

      nextLink = data['@odata.nextLink'] ?? null;
      deltaLink = data['@odata.deltaLink'] ?? null;

      if (nextLink) {
        url = nextLink;
      }
    } while (nextLink);

    return {
      events,
      deleted,
      nextSyncToken: deltaLink,
    };
  }
}
