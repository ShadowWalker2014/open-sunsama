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

/**
 * Patch shape for an existing event. All fields optional — providers
 * apply only the supplied keys, leaving the rest untouched.
 *
 * `startTime` / `endTime` should be supplied together if either changes.
 * `isAllDay` flips the event between timed and date-only representations
 * (Google: `start.dateTime` ↔ `start.date`).
 */
export interface EventPatch {
  title?: string;
  description?: string | null;
  location?: string | null;
  startTime?: Date;
  endTime?: Date;
  isAllDay?: boolean;
  /**
   * IANA timezone name to attach to a timed event. If omitted on a
   * start/end change, providers fall back to UTC. Ignored for all-day.
   */
  timezone?: string | null;
}

export interface CalendarProvider {
  getAuthUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshTokens(refreshToken: string): Promise<OAuthTokens>;
  listCalendars(accessToken: string): Promise<ExternalCalendar[]>;
  listEvents(accessToken: string, calendarId: string, options: SyncOptions): Promise<SyncResult>;
  /**
   * Patch an event in place upstream. Returns the canonical post-write
   * representation so the caller can update local storage without
   * waiting for the next incremental sync. Throws on failure.
   *
   * Providers that don't support write-back yet must throw a
   * `ProviderReadOnlyError` so the route layer can return 409.
   */
  updateEvent?(
    accessToken: string,
    calendarExternalId: string,
    eventExternalId: string,
    patch: EventPatch
  ): Promise<ExternalEvent>;
  /**
   * Delete an event upstream. Resolves on success. Providers that
   * can't delete throw `ProviderReadOnlyError`.
   */
  deleteEvent?(
    accessToken: string,
    calendarExternalId: string,
    eventExternalId: string
  ): Promise<void>;
}

/**
 * Sentinel thrown when a provider doesn't support a write-back action
 * yet. Routes catch this and return 409 Conflict so the client can
 * surface a "read-only" message and disable the action.
 */
export class ProviderReadOnlyError extends Error {
  readonly code = 'PROVIDER_READ_ONLY' as const;
  constructor(provider: string) {
    super(`${provider} provider does not support write-back yet`);
    this.name = 'ProviderReadOnlyError';
  }
}

export { GoogleCalendarProvider } from './google';
export { OutlookCalendarProvider } from './outlook';
export { ICloudCalendarProvider } from './icloud';
