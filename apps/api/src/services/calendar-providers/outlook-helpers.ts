/**
 * Outlook Calendar helper functions and types
 */
import type { ExternalEvent } from './index';

// Outlook API interfaces
export interface OutlookCalendar {
  id: string;
  name: string;
  color?: string;
  canEdit: boolean;
}

export interface OutlookEvent {
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

export interface OutlookEventsResponse {
  value?: OutlookEvent[];
  '@odata.deltaLink'?: string;
  '@odata.nextLink'?: string;
}

export interface OutlookTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

export interface OutlookCalendarListResponse {
  value?: OutlookCalendar[];
}

// Microsoft color codes mapped to hex
export const OUTLOOK_COLORS: Record<string, string> = {
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

/**
 * Get Microsoft OAuth client ID from environment
 */
export function getClientId(): string {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  if (!clientId) {
    throw new Error('MICROSOFT_CLIENT_ID environment variable is required');
  }
  return clientId;
}

/**
 * Get Microsoft OAuth client secret from environment
 */
export function getClientSecret(): string {
  const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
  if (!clientSecret) {
    throw new Error('MICROSOFT_CLIENT_SECRET environment variable is required');
  }
  return clientSecret;
}

/**
 * Map Outlook showAs status to our status type
 */
export function mapShowAsToStatus(showAs?: string): 'confirmed' | 'tentative' | 'cancelled' {
  switch (showAs) {
    case 'tentative':
      return 'tentative';
    case 'free':
      return 'tentative';
    default:
      return 'confirmed';
  }
}

/**
 * Map Outlook response status to our response status type
 */
export function mapOutlookResponseStatus(
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

/**
 * Build RRULE string from Outlook recurrence pattern
 */
export function buildRRuleFromOutlook(recurrence?: OutlookEvent['recurrence']): string | null {
  if (!recurrence?.pattern) return null;

  const parts: string[] = [];
  const pattern = recurrence.pattern;
  const range = recurrence.range;

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

  if (pattern.interval && pattern.interval > 1) {
    parts.push(`INTERVAL=${pattern.interval}`);
  }

  if (pattern.daysOfWeek?.length) {
    const days = pattern.daysOfWeek.map((d) => d.slice(0, 2).toUpperCase());
    parts.push(`BYDAY=${days.join(',')}`);
  }

  if (pattern.dayOfMonth) {
    parts.push(`BYMONTHDAY=${pattern.dayOfMonth}`);
  }

  if (pattern.month) {
    parts.push(`BYMONTH=${pattern.month}`);
  }

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

/**
 * Parse an Outlook event into our ExternalEvent format
 */
export function parseOutlookEvent(event: OutlookEvent): ExternalEvent | null {
  if (!event.id || !event.start?.dateTime) {
    return null;
  }

  const isAllDay = event.isAllDay || false;
  let startTime: Date;
  let endTime: Date;

  if (isAllDay) {
    startTime = new Date(event.start.dateTime);
    endTime = event.end?.dateTime
      ? new Date(event.end.dateTime)
      : new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
  } else {
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
      endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    }
  }

  let description: string | null = null;
  if (event.body?.content) {
    if (event.body.contentType === 'text') {
      description = event.body.content;
    } else {
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
