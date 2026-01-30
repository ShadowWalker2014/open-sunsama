import type {
  CalendarProvider,
  OAuthTokens,
  ExternalCalendar,
  ExternalEvent,
  SyncOptions,
  SyncResult,
} from './index';

const MICROSOFT_AUTH_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize';
const MICROSOFT_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
const GRAPH_API = 'https://graph.microsoft.com/v1.0';

const SCOPES = [
  'Calendars.Read',
  'Calendars.ReadWrite',
  'offline_access',
].join(' ');

interface OutlookCalendar {
  id: string;
  name: string;
  color?: string;
  canEdit: boolean;
}

interface OutlookEvent {
  id: string;
  subject?: string;
  body?: {
    content?: string;
    contentType?: string;
  };
  location?: {
    displayName?: string;
  };
  start?: {
    dateTime?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    timeZone?: string;
  };
  isAllDay?: boolean;
  recurrence?: {
    pattern?: {
      type?: string;
      interval?: number;
      daysOfWeek?: string[];
      dayOfMonth?: number;
      month?: number;
    };
    range?: {
      type?: string;
      startDate?: string;
      endDate?: string;
      numberOfOccurrences?: number;
    };
  };
  seriesMasterId?: string;
  showAs?: string;
  responseStatus?: {
    response?: string;
  };
  webLink?: string;
  changeKey?: string;
  '@removed'?: { reason: string };
}

interface OutlookEventsResponse {
  value?: OutlookEvent[];
  '@odata.deltaLink'?: string;
  '@odata.nextLink'?: string;
}

interface OutlookTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface OutlookCalendarListResponse {
  value?: OutlookCalendar[];
}

// Microsoft color codes mapped to hex
const OUTLOOK_COLORS: Record<string, string> = {
  auto: '#0078D4',
  lightBlue: '#8ED0FF',
  lightGreen: '#7FD37F',
  lightOrange: '#FFB878',
  lightGray: '#D5D5D5',
  lightYellow: '#FFF078',
  lightTeal: '#7FD2D5',
  lightPink: '#FFB3DE',
  lightBrown: '#D5B59C',
  lightRed: '#FF8080',
  maxColor: '#0078D4',
};

function getClientId(): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    throw new Error('MICROSOFT_CLIENT_ID environment variable is required');
  }
  return clientId;
}

function getClientSecret(): string {
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error('MICROSOFT_CLIENT_SECRET environment variable is required');
  }
  return clientSecret;
}

function mapShowAsToStatus(showAs?: string): 'confirmed' | 'tentative' | 'cancelled' {
  switch (showAs) {
    case 'tentative':
      return 'tentative';
    case 'free':
      return 'tentative'; // Map free as tentative
    default:
      return 'confirmed';
  }
}

function mapOutlookResponseStatus(
  response?: string
): 'accepted' | 'declined' | 'tentative' | 'needsAction' | null {
  switch (response) {
    case 'accepted':
      return 'accepted';
    case 'declined':
      return 'declined';
    case 'tentativelyAccepted':
      return 'tentative';
    case 'notResponded':
    case 'none':
      return 'needsAction';
    default:
      return null;
  }
}

function buildRRuleFromOutlook(recurrence?: OutlookEvent['recurrence']): string | null {
  if (!recurrence?.pattern) return null;

  const parts: string[] = [];
  const pattern = recurrence.pattern;
  const range = recurrence.range;

  // Frequency
  switch (pattern.type) {
    case 'daily':
      parts.push('FREQ=DAILY');
      break;
    case 'weekly':
      parts.push('FREQ=WEEKLY');
      break;
    case 'absoluteMonthly':
    case 'relativeMonthly':
      parts.push('FREQ=MONTHLY');
      break;
    case 'absoluteYearly':
    case 'relativeYearly':
      parts.push('FREQ=YEARLY');
      break;
    default:
      return null;
  }

  // Interval
  if (pattern.interval && pattern.interval > 1) {
    parts.push(`INTERVAL=${pattern.interval}`);
  }

  // Days of week
  if (pattern.daysOfWeek?.length) {
    const days = pattern.daysOfWeek.map((d) => d.slice(0, 2).toUpperCase());
    parts.push(`BYDAY=${days.join(',')}`);
  }

  // Day of month
  if (pattern.dayOfMonth) {
    parts.push(`BYMONTHDAY=${pattern.dayOfMonth}`);
  }

  // Month
  if (pattern.month) {
    parts.push(`BYMONTH=${pattern.month}`);
  }

  // Range
  if (range) {
    if (range.type === 'endDate' && range.endDate) {
      const until = range.endDate.replace(/-/g, '');
      parts.push(`UNTIL=${until}T235959Z`);
    } else if (range.type === 'numbered' && range.numberOfOccurrences) {
      parts.push(`COUNT=${range.numberOfOccurrences}`);
    }
  }

  return parts.join(';');
}

function parseOutlookEvent(event: OutlookEvent): ExternalEvent | null {
  // Skip events without required fields
  if (!event.id || !event.start?.dateTime) {
    return null;
  }

  const isAllDay = event.isAllDay || false;
  
  // Outlook returns dateTime in local time with timeZone specified
  // We need to handle this carefully
  let startTime: Date;
  let endTime: Date;

  if (isAllDay) {
    // All-day events - parse as UTC midnight
    startTime = new Date(event.start.dateTime);
    endTime = event.end?.dateTime
      ? new Date(event.end.dateTime)
      : new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
  } else {
    // Timed events - Outlook returns ISO format without Z suffix
    // Append Z if not present to treat as UTC (Graph API returns UTC when not specified)
    const startStr = event.start.dateTime.endsWith('Z')
      ? event.start.dateTime
      : event.start.dateTime + 'Z';
    startTime = new Date(startStr);
    
    if (event.end?.dateTime) {
      const endStr = event.end.dateTime.endsWith('Z')
        ? event.end.dateTime
        : event.end.dateTime + 'Z';
      endTime = new Date(endStr);
    } else {
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // Default 1 hour
    }
  }

  // Strip HTML from body if present
  let description: string | null = null;
  if (event.body?.content) {
    if (event.body.contentType === 'text') {
      description = event.body.content;
    } else {
      // Simple HTML stripping - remove tags
      description = event.body.content.replace(/<[^>]*>/g, '').trim() || null;
    }
  }

  return {
    externalId: event.id,
    title: event.subject || '(No title)',
    description,
    location: event.location?.displayName ?? null,
    startTime,
    endTime,
    isAllDay,
    timezone: event.start.timeZone ?? null,
    recurrenceRule: buildRRuleFromOutlook(event.recurrence),
    recurringEventId: event.seriesMasterId ?? null,
    status: mapShowAsToStatus(event.showAs),
    responseStatus: mapOutlookResponseStatus(event.responseStatus?.response),
    htmlLink: event.webLink ?? null,
    etag: event.changeKey ?? null,
  };
}

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

    // Use delta query for incremental sync
    let url: string;
    if (options.syncToken) {
      // syncToken is actually the deltaLink from previous sync
      url = options.syncToken;
    } else {
      // Initial sync - use calendarView for time range
      const params = new URLSearchParams({
        $top: '250',
        $select: 'id,subject,body,location,start,end,isAllDay,recurrence,seriesMasterId,showAs,responseStatus,webLink,changeKey',
      });

      if (options.timeMin && options.timeMax) {
        // Use calendarView for initial sync with time bounds
        params.set('startDateTime', options.timeMin.toISOString());
        params.set('endDateTime', options.timeMax.toISOString());
        url = `${GRAPH_API}/me/calendars/${encodeURIComponent(calendarId)}/calendarView?${params.toString()}`;
      } else {
        // Use delta query without time bounds
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
        
        // Handle invalid sync token
        if (response.status === 410 || response.status === 400) {
          throw new Error('SYNC_TOKEN_INVALID');
        }
        
        throw new Error(`Failed to list events: ${error}`);
      }

      const data = (await response.json()) as OutlookEventsResponse;

      for (const item of data.value || []) {
        // Check if this is a deleted event (delta query marks removed items)
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
