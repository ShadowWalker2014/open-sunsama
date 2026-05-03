/**
 * Outlook Calendar provider implementation
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
  parseOutlookEvent,
  OUTLOOK_COLORS,
  type OutlookCalendar,
  type OutlookEvent,
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
      // Microsoft Graph identity returns 400 with `error:
      // "invalid_grant"` (refresh token revoked or expired),
      // `"interaction_required"` (consent rescinded), or
      // `"unauthorized_client"` (app deauthorized). 401 covers token
      // signature failures. All mean "user must reconnect" — surface
      // as the typed `ProviderAuthError` so the route layer can emit
      // a 401 with a clean "Reconnect" toast instead of a 500 with
      // the raw Microsoft Graph JSON.
      if (
        response.status === 400 ||
        response.status === 401 ||
        response.status === 403
      ) {
        throw new ProviderAuthError('outlook');
      }
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
      // Same shape as Google — 401/403 means the user must reconnect.
      // Surface as the typed error so the route layer's mapping fires
      // and the UI shows a clean "Reconnect" toast.
      if (response.status === 401 || response.status === 403) {
        throw new ProviderAuthError('outlook');
      }
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
        // calendarView/delta — NOT calendarView. The plain endpoint
        // returns "current state" with no `@removed` markers, so
        // events deleted upstream become permanent ghosts in our DB
        // (the user only sees them disappear after Settings → Reset
        // & re-sync). The `/delta` variant accepts the same window
        // params, returns the full set on first call with a
        // `@odata.deltaLink` at the end, then emits `@removed` on
        // subsequent calls — which our existing branch at the
        // event-loop below already handles.
        url = `${GRAPH_API}/me/calendars/${encodeURIComponent(calendarId)}/calendarView/delta?${params.toString()}`;
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
        if (response.status === 410 || response.status === 400) {
          throw new Error('SYNC_TOKEN_INVALID');
        }
        // 401/403: token rejected or scope rescinded — typed error
        // so the route layer + worker write a clean "Reconnect"
        // message instead of dumping raw Microsoft Graph JSON into
        // the sync-status row.
        if (response.status === 401 || response.status === 403) {
          throw new ProviderAuthError('outlook');
        }
        const error = await response.text();
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

    const body = buildOutlookEventBody({
      title: payload.title,
      description: payload.description,
      location: payload.location,
      startTime: payload.startTime,
      endTime: payload.endTime,
      isAllDay: payload.isAllDay,
      timezone: payload.timezone,
    });

    const response = await fetch(
      `${GRAPH_API}/me/calendars/${encodeURIComponent(calendarId)}/events`,
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
      throw await mapOutlookError('createEvent', response);
    }

    const data = (await response.json()) as OutlookEvent;
    const parsed = parseOutlookEvent(data);
    if (!parsed) {
      throw new Error('Outlook returned an event that could not be parsed');
    }
    return parsed;
  }

  async updateEvent(
    accessToken: string,
    calendarId: string,
    eventId: string,
    patch: EventPatch
  ): Promise<ExternalEvent> {
    const body: Record<string, unknown> = {};

    if (patch.title !== undefined) {
      body.subject = patch.title;
    }
    if (patch.description !== undefined) {
      body.body = {
        contentType: 'text',
        content: patch.description ?? '',
      };
    }
    if (patch.location !== undefined) {
      body.location = { displayName: patch.location ?? '' };
    }
    if (patch.startTime !== undefined || patch.endTime !== undefined) {
      if (patch.startTime === undefined || patch.endTime === undefined) {
        throw new Error('startTime and endTime must be supplied together');
      }
      if (patch.isAllDay) {
        // Microsoft Graph all-day: isAllDay=true, dateTime at 00:00
        // of the date, timeZone fixed to UTC.
        body.isAllDay = true;
        body.start = {
          dateTime: toUtcDateOnlyDateTime(patch.startTime),
          timeZone: 'UTC',
        };
        body.end = {
          dateTime: toUtcDateOnlyDateTime(patch.endTime),
          timeZone: 'UTC',
        };
      } else {
        // Send the UTC instant directly. Graph reads `dateTime` as
        // wall-clock in `timeZone`, so pairing the user's IANA zone
        // with a Z-stripped UTC string would tell Graph "this NYC
        // wall-clock time is 14:00" when it's actually 14:00 UTC =
        // 10:00 NYC — every write would shift the event by the
        // user's UTC offset on round-trip. Sending the UTC instant
        // with timeZone="UTC" lets Graph store the absolute instant
        // and display it in the user's mailbox-default zone, which
        // matches what the user dragged on screen. The `tz` argument
        // is intentionally unused — it's only relevant for create-
        // from-grid where the user might have a hint about which
        // zone to display the event in.
        body.isAllDay = false;
        body.start = {
          dateTime: patch.startTime.toISOString(),
          timeZone: 'UTC',
        };
        body.end = {
          dateTime: patch.endTime.toISOString(),
          timeZone: 'UTC',
        };
      }
    }

    // Note: PATCH /me/events/{id} works regardless of which calendar
    // the event lives on — Outlook resolves by event id alone. We
    // pass the calendar id only for symmetry with Google's URL shape;
    // it's not actually used in the path.
    void calendarId;
    const response = await fetch(
      `${GRAPH_API}/me/events/${encodeURIComponent(eventId)}`,
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
      throw await mapOutlookError('updateEvent', response);
    }

    const data = (await response.json()) as OutlookEvent;
    const parsed = parseOutlookEvent(data);
    if (!parsed) {
      throw new Error('Outlook returned an event that could not be parsed');
    }
    return parsed;
  }

  async deleteEvent(
    accessToken: string,
    calendarId: string,
    eventId: string
  ): Promise<void> {
    void calendarId; // Outlook resolves by event id alone (see updateEvent).
    const response = await fetch(
      `${GRAPH_API}/me/events/${encodeURIComponent(eventId)}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 404 / 410 = already gone — treat as success.
    if (!response.ok && response.status !== 404 && response.status !== 410) {
      throw await mapOutlookError('deleteEvent', response);
    }
  }
}

/**
 * Build the request body for Outlook create/update. We don't reuse
 * the update path's incremental builder because create requires the
 * full payload (subject + start + end at minimum), and the all-day
 * handling differs slightly from a partial PATCH.
 */
function buildOutlookEventBody(input: {
  title: string;
  description?: string | null;
  location?: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay?: boolean;
  timezone?: string | null;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {
    subject: input.title,
  };
  if (input.description !== undefined) {
    body.body = {
      contentType: 'text',
      content: input.description ?? '',
    };
  }
  if (input.location !== undefined) {
    body.location = { displayName: input.location ?? '' };
  }
  body.isAllDay = !!input.isAllDay;
  if (input.isAllDay) {
    body.start = {
      dateTime: toUtcDateOnlyDateTime(input.startTime),
      timeZone: 'UTC',
    };
    body.end = {
      dateTime: toUtcDateOnlyDateTime(input.endTime),
      timeZone: 'UTC',
    };
  } else {
    // See updateEvent for the full reasoning: send the UTC instant
    // with timeZone="UTC" so Graph stores the absolute moment. The
    // `input.timezone` is intentionally unused here.
    body.start = {
      dateTime: input.startTime.toISOString(),
      timeZone: 'UTC',
    };
    body.end = {
      dateTime: input.endTime.toISOString(),
      timeZone: 'UTC',
    };
  }
  return body;
}

/**
 * For all-day events, Microsoft Graph wants `dateTime` at
 * "YYYY-MM-DDT00:00:00.0000000" with timeZone="UTC". The Date arg
 * is expected to already be UTC midnight per the iCal convention.
 */
function toUtcDateOnlyDateTime(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${dd}T00:00:00.0000000`;
}

/**
 * Map a non-2xx response from Microsoft Graph to the right typed
 * error so the route layer can produce a clean toast (matching the
 * Google provider's pattern).
 */
async function mapOutlookError(
  op: string,
  response: Response
): Promise<Error> {
  if (response.status === 404 || response.status === 410) {
    return new ProviderEventNotFoundError('outlook');
  }
  if (response.status === 401 || response.status === 403) {
    return new ProviderAuthError('outlook');
  }
  const text = await response.text();
  return new Error(`Outlook ${op} failed (${response.status}): ${text}`);
}
