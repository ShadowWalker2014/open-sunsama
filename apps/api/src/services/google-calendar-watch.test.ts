/**
 * Unit tests for where Google Calendar push channels deliver, and for
 * skipping registration when the server has no public https address.
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import { getWebhookUrl, registerWatch } from './google-calendar-watch.js';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function setEnv(env: { WEBHOOK_BASE_URL?: string; API_URL?: string }) {
  vi.stubEnv('WEBHOOK_BASE_URL', env.WEBHOOK_BASE_URL ?? '');
  vi.stubEnv('API_URL', env.API_URL ?? '');
}

describe('getWebhookUrl', () => {
  it('prefers WEBHOOK_BASE_URL over API_URL', () => {
    setEnv({
      WEBHOOK_BASE_URL: 'https://hooks.example.com/',
      API_URL: 'https://api.example.com',
    });
    expect(getWebhookUrl()).toBe(
      'https://hooks.example.com/webhooks/google/calendar'
    );
  });

  it('falls back to API_URL so a self-hosted server gets its own pushes', () => {
    setEnv({ API_URL: 'https://tasks.example.org' });
    expect(getWebhookUrl()).toBe(
      'https://tasks.example.org/webhooks/google/calendar'
    );
  });

  it('keeps production on api.opensunsama.com', () => {
    setEnv({ API_URL: 'https://api.opensunsama.com' });
    expect(getWebhookUrl()).toBe(
      'https://api.opensunsama.com/webhooks/google/calendar'
    );
  });

  it('returns null when neither variable is set', () => {
    setEnv({});
    expect(getWebhookUrl()).toBeNull();
  });

  it.each([
    'http://localhost:3001',
    'http://tasks.example.org',
    'https://localhost:3001',
    'https://127.0.0.1',
    'https://10.0.0.5',
    'https://172.20.1.1',
    'https://192.168.1.10',
    'https://[::1]:3001',
    'https://nas.local',
    'not a url',
  ])('returns null for non-public or non-https %s', (apiUrl) => {
    setEnv({ API_URL: apiUrl });
    expect(getWebhookUrl()).toBeNull();
  });
});

describe('registerWatch', () => {
  it('skips the Google call and returns null without a public https URL', async () => {
    setEnv({ API_URL: 'http://localhost:3001' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    const watch = await registerWatch({
      accessToken: 'token',
      externalCalendarId: 'primary',
    });

    expect(watch).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('registers the channel at the API_URL webhook', async () => {
    setEnv({ API_URL: 'https://tasks.example.org' });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({ id: 'ch', resourceId: 'res', expiration: '1000' }),
        { status: 200 }
      )
    );
    vi.stubGlobal('fetch', fetchMock);

    const watch = await registerWatch({
      accessToken: 'token',
      externalCalendarId: 'primary',
    });

    expect(watch).toEqual({
      channelId: 'ch',
      resourceId: 'res',
      expiresAt: new Date(1000),
    });
    const body = JSON.parse(fetchMock.mock.calls[0]![1].body);
    expect(body.address).toBe(
      'https://tasks.example.org/webhooks/google/calendar'
    );
  });
});
