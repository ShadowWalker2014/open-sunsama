export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface ExternalCalendar {
  externalId: string;
  name: string;
  color: string | null;
  isReadOnly: boolean;
}

export interface ExternalEvent {
  externalId: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  timezone: string | null;
  recurrenceRule: string | null;
  recurringEventId: string | null;
  status: 'confirmed' | 'tentative' | 'cancelled';
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction' | null;
  htmlLink: string | null;
  etag: string | null;
}

export interface SyncOptions {
  syncToken?: string;
  timeMin?: Date;
  timeMax?: Date;
}

export interface SyncResult {
  events: ExternalEvent[];
  deleted: string[]; // External IDs of deleted events
  nextSyncToken: string | null;
}

export interface CalendarProvider {
  getAuthUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshTokens(refreshToken: string): Promise<OAuthTokens>;
  listCalendars(accessToken: string): Promise<ExternalCalendar[]>;
  listEvents(accessToken: string, calendarId: string, options: SyncOptions): Promise<SyncResult>;
}

export { GoogleCalendarProvider } from './google';
export { OutlookCalendarProvider } from './outlook';
export { ICloudCalendarProvider } from './icloud';
