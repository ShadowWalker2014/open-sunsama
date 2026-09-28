/**
 * Unit tests for reading guests and video call links out of Google and
 * Outlook events, and for Google RSVPs changing only our own answer.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { parseGoogleEvent } from './google-helpers.js';
import { parseOutlookEvent } from './outlook-helpers.js';
import { GoogleCalendarProvider } from './google.js';
import { ProviderReadOnlyError } from './index.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

const googleEvent = {
  id: 'evt1',
  summary: 'Growth Team Weekly',
  start: { dateTime: '2026-09-28T17:00:00Z' },
  end: { dateTime: '2026-09-28T18:30:00Z' },
  hangoutLink: 'https://meet.google.com/old-link',
  conferenceData: {
    entryPoints: [
      { entryPointType: 'phone', uri: 'tel:+1-555-0100' },
      { entryPointType: 'video', uri: 'https://meet.google.com/xkd-ktpk-rnz' },
    ],
  },
  attendees: [
    { email: 'kai@example.com', displayName: 'Kai', organizer: true, responseStatus: 'accepted' },
    { email: 'arya@example.com', self: true, responseStatus: 'tentative' },
    { email: 'room-1@resource.calendar.google.com', resource: true, responseStatus: 'accepted' },
  ],
};

describe('parseGoogleEvent', () => {
  it('reads guests without meeting rooms and the video link', () => {
    const parsed = parseGoogleEvent(googleEvent)!;
    expect(parsed.conferenceUrl).toBe('https://meet.google.com/xkd-ktpk-rnz');
    expect(parsed.responseStatus).toBe('tentative');
    expect(parsed.attendees).toEqual([
      { email: 'kai@example.com', name: 'Kai', responseStatus: 'accepted', organizer: true, self: false },
      { email: 'arya@example.com', name: null, responseStatus: 'tentative', organizer: false, self: true },
    ]);
  });

  it('falls back to hangoutLink and reports no guests as null', () => {
    const parsed = parseGoogleEvent({
      ...googleEvent,
      conferenceData: undefined,
      attendees: undefined,
    })!;
    expect(parsed.conferenceUrl).toBe('https://meet.google.com/old-link');
    expect(parsed.attendees).toBeNull();
  });
});

describe('parseOutlookEvent', () => {
  it('reads guests, adds the organizer, and reads the Teams link', () => {
    const parsed = parseOutlookEvent({
      id: 'o1',
      subject: 'Planning',
      start: { dateTime: '2026-09-28T17:00:00.0000000', timeZone: 'UTC' },
      end: { dateTime: '2026-09-28T18:00:00.0000000', timeZone: 'UTC' },
      organizer: { emailAddress: { name: 'Kai', address: 'kai@example.com' } },
      isOrganizer: false,
      attendees: [
        { type: 'required', status: { response: 'accepted' }, emailAddress: { name: 'Isha', address: 'isha@example.com' } },
        { type: 'resource', status: { response: 'accepted' }, emailAddress: { name: 'Room', address: 'room@example.com' } },
      ],
      onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/abc' },
    })!;
    expect(parsed.conferenceUrl).toBe('https://teams.microsoft.com/l/meetup-join/abc');
    expect(parsed.attendees?.map((a) => [a.email, a.organizer, a.responseStatus])).toEqual([
      ['kai@example.com', true, 'accepted'],
      ['isha@example.com', false, 'accepted'],
    ]);
  });
});

describe('GoogleCalendarProvider.respondToEvent', () => {
  it('sends the whole guest list back with only our answer changed', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (!init?.method) return new Response(JSON.stringify(googleEvent));
      const body = JSON.parse(init.body as string);
      return new Response(JSON.stringify({ ...googleEvent, attendees: body.attendees }));
    });

    const result = await new GoogleCalendarProvider().respondToEvent('token', 'primary', 'evt1', 'accepted');

    const patch = calls[1]!;
    expect(patch.init?.method).toBe('PATCH');
    expect(patch.url).toContain('sendUpdates=all');
    const sent = JSON.parse(patch.init!.body as string).attendees;
    expect(sent).toHaveLength(3);
    expect(sent.find((a: { self?: boolean }) => a.self).responseStatus).toBe('accepted');
    expect(sent.find((a: { organizer?: boolean }) => a.organizer).responseStatus).toBe('accepted');
    expect(result.responseStatus).toBe('accepted');
  });

  it('refuses when we are not a guest', async () => {
    vi.stubGlobal('fetch', async () =>
      new Response(JSON.stringify({ ...googleEvent, attendees: [googleEvent.attendees[0]] }))
    );
    await expect(
      new GoogleCalendarProvider().respondToEvent('token', 'primary', 'evt1', 'declined')
    ).rejects.toBeInstanceOf(ProviderReadOnlyError);
  });
});

describe('OutlookCalendarProvider.respondToEvent', () => {
  it('keeps a successful decline when Outlook removes the event', async () => {
    const { OutlookCalendarProvider } = await import('./outlook.js');
    const event = {
      id: 'o1', subject: 'Planning', isOrganizer: false,
      start: { dateTime: '2026-09-28T17:00:00', timeZone: 'UTC' },
      end: { dateTime: '2026-09-28T18:00:00', timeZone: 'UTC' },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify(event)))
      .mockResolvedValueOnce(new Response(null, { status: 202 }))
      .mockResolvedValueOnce(new Response(null, { status: 404 }));
    vi.stubGlobal('fetch', fetchMock);
    const result = await new OutlookCalendarProvider().respondToEvent('token', 'calendar', 'o1', 'declined');
    expect(result.responseStatus).toBe('declined');
    expect(fetchMock.mock.calls[1]![0]).toContain('/o1/decline');
  });
});
