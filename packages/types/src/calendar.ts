/**
 * Calendar Integration Types
 *
 * Types for external calendar integration (Google Calendar, Outlook, iCloud)
 * supporting OAuth and CalDAV authentication methods.
 */

export type CalendarProvider = 'google' | 'outlook' | 'icloud';

export interface CalendarAccount {
  id: string;
  userId: string;
  provider: CalendarProvider;
  email: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncError: string | null;
  lastSyncedAt: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Calendar {
  id: string;
  accountId: string;
  userId: string;
  externalId: string;
  name: string;
  color: string | null;
  isEnabled: boolean;
  isDefaultForEvents: boolean;
  isDefaultForTasks: boolean;
  isReadOnly: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEventAttendee {
  email: string;
  name: string | null;
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction' | null;
  organizer: boolean;
  /** The connected account's own entry. */
  self: boolean;
}

export type CalendarRsvpResponse = 'accepted' | 'declined' | 'tentative';

export interface CalendarEvent {
  id: string;
  calendarId: string;
  userId: string;
  externalId: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: string;
  endTime: string;
  isAllDay: boolean;
  timezone: string | null;
  recurrenceRule: string | null;
  recurringEventId: string | null;
  status: 'confirmed' | 'tentative' | 'cancelled';
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction' | null;
  htmlLink: string | null;
  /** Guests, or null when the event has none or the provider doesn't say. */
  attendees?: CalendarEventAttendee[] | null;
  /** Video call join URL (Google Meet, Teams, Zoom). */
  conferenceUrl?: string | null;
  calendar?: Calendar;
  createdAt: string;
  updatedAt: string;
}

// API Request/Response types
export interface ConnectCalDavRequest {
  email: string;
  appPassword: string;
  caldavUrl?: string;
}

export interface CalendarEventQuery {
  from: string;
  to: string;
  calendarIds?: string[];
}

export interface UpdateCalendarRequest {
  isEnabled?: boolean;
  isDefaultForEvents?: boolean;
  isDefaultForTasks?: boolean;
  /**
   * Override the color the provider returned at sync time. Pass null
   * to clear the override — the column then stays null until the
   * user picks a new color (sync intentionally never overwrites
   * color on existing calendars, so the provider's color does NOT
   * come back automatically).
   */
  color?: string | null;
}
