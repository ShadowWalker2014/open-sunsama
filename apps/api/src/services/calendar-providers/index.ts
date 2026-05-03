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
  /**
   * Provider-specific resource URL needed for CalDAV addressing —
   * iCloud's PUT/DELETE target the .ics object's full HREF, not its
   * UID. Google and Outlook ignore this field; the route layer
   * populates it from the local row's `htmlLink` for iCloud.
   */
  eventUrl?: string | null;
}

export interface CalendarProvider {
  getAuthUrl(state: string, redirectUri: string): string;
  exchangeCode(code: string, redirectUri: string): Promise<OAuthTokens>;
  refreshTokens(refreshToken: string): Promise<OAuthTokens>;
  listCalendars(accessToken: string): Promise<ExternalCalendar[]>;
  listEvents(accessToken: string, calendarId: string, options: SyncOptions): Promise<SyncResult>;
  /**
   * Create a new event upstream. Returns the canonical post-write
   * representation so the caller can write it through to local
   * storage without waiting for the next incremental sync. Providers
   * without create support throw `ProviderReadOnlyError`.
   *
   * `EventPatch` is reused as the create shape — title is required,
   * start+end are required (the route layer enforces this).
   */
  createEvent?(
    accessToken: string,
    calendarExternalId: string,
    payload: EventPatch
  ): Promise<ExternalEvent>;
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
   *
   * `extras.eventUrl` is the CalDAV resource URL (only used by
   * iCloud — Google / Outlook resolve by event id alone).
   */
  deleteEvent?(
    accessToken: string,
    calendarExternalId: string,
    eventExternalId: string,
    extras?: { eventUrl?: string | null; etag?: string | null }
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

/**
 * Thrown when the upstream provider says the event no longer exists
 * (HTTP 404 / 410). The most common cause is local data drift — the
 * event was deleted in the provider's UI, or our local row points at
 * a calendar/event id pair that doesn't match upstream (typically a
 * residue of pre-PR-#21 attribution corruption).
 *
 * Routes translate this into a 410 Gone with a clean, actionable
 * message; clients also use the signal to trigger a quick re-sync
 * of the affected account so the next attempt has fresh data.
 */
export class ProviderEventNotFoundError extends Error {
  readonly code = 'EVENT_NOT_FOUND_UPSTREAM' as const;
  constructor(provider: string) {
    super(`${provider} no longer has this event`);
    this.name = 'ProviderEventNotFoundError';
  }
}

/**
 * Thrown when the access token is rejected (401 / 403) and the
 * refresh path can't recover. Client should prompt re-auth.
 */
export class ProviderAuthError extends Error {
  readonly code = 'PROVIDER_AUTH_FAILED' as const;
  constructor(provider: string) {
    super(`${provider} authentication failed — please reconnect the account`);
    this.name = 'ProviderAuthError';
  }
}

export { GoogleCalendarProvider } from './google';
export { OutlookCalendarProvider } from './outlook';
export { ICloudCalendarProvider } from './icloud';
