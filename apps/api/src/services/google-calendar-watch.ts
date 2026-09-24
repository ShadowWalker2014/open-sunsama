/**
 * Google Calendar push notifications (events.watch).
 *
 * Sets up webhook channels so we hear about event changes within
 * seconds instead of polling every 5 minutes. Each watched calendar
 * gets a 7-day channel; Google POSTs to our webhook on every change
 * with `X-Goog-Resource-State: exists`. The webhook handler enqueues
 * an immediate sync job, which then uses our existing syncToken-based
 * delta path to fetch the actual changes.
 *
 * Lifecycle:
 *   1. After a calendar's first successful sync we call `registerWatch`
 *      to create the channel.
 *   2. Channel state (id, resourceId, expiresAt) is persisted on the
 *      `calendars` row.
 *   3. A daily renewal worker re-registers any channel expiring within
 *      24h (PR follow-up — without it watches die after 7 days and
 *      we silently fall back to the 5-min poll).
 *   4. On account/calendar disconnect we call `stopWatch` to tear down
 *      the channel (the actual stop is best-effort — Google forgets
 *      about expired channels anyway).
 *
 * Reference: https://developers.google.com/calendar/api/guides/push
 */

import { randomUUID } from 'node:crypto';

const GOOGLE_CALENDAR_API = 'https://www.googleapis.com/calendar/v3';

/**
 * Channel TTL on Google's side. They cap at 7 days; we ask for the
 * max minus a little so the renewal worker has slack.
 */
const WATCH_TTL_SECONDS = 7 * 24 * 60 * 60 - 60 * 60; // 7d - 1h

/**
 * Resolve the public webhook URL Google should POST to: WEBHOOK_BASE_URL,
 * else API_URL, so a self-hosted server receives its own pushes.
 *
 * Returns null when that base isn't a public https URL. Google only
 * delivers to https addresses it can reach, so registering a channel
 * for localhost or plain http would just fail; callers skip the watch
 * and keep polling instead.
 */
export function getWebhookUrl(): string | null {
  const base = process.env.WEBHOOK_BASE_URL || process.env.API_URL;
  if (!base) return null;
  let url: URL;
  try {
    url = new URL(base);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' || isPrivateHost(url.hostname)) return null;
  return `${base.replace(/\/$/, '')}/webhooks/google/calendar`;
}

function isPrivateHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (host === 'localhost' || host.endsWith('.localhost')) return true;
  if (host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host.includes(':')) {
    return host === '::1' || /^(f[cd]|fe80)/.test(host);
  }
  const ipv4 = host.match(/^(\d+)\.(\d+)\.\d+\.\d+$/);
  if (!ipv4) return false;
  const [a, b] = [Number(ipv4[1]), Number(ipv4[2])];
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168)
  );
}

let warnedNoWebhookUrl = false;

export interface RegisteredWatch {
  channelId: string;
  resourceId: string;
  expiresAt: Date;
}

/**
 * Register a Google `events.watch` channel for the given calendar.
 *
 * Returns null when there's no public https webhook URL to register
 * (see getWebhookUrl), or when Google rejects the request (common for read-only
 * holiday calendars that don't accept push channels — `events.watch`
 * is forbidden on subscribed calendars). Caller should treat null as
 * "watch not available, keep using the poll" rather than an error.
 *
 * Throws on auth failures so the existing token-refresh / reconnect
 * pipeline kicks in.
 */
export async function registerWatch(params: {
  accessToken: string;
  externalCalendarId: string;
}): Promise<RegisteredWatch | null> {
  const address = getWebhookUrl();
  if (!address) {
    if (!warnedNoWebhookUrl) {
      warnedNoWebhookUrl = true;
      console.warn(
        '[Google Watch] WEBHOOK_BASE_URL / API_URL is not a public https URL; skipping push channels and polling instead'
      );
    }
    return null;
  }

  // Channel ID is our token — it must be globally unique and we use
  // it to look up the owning calendar when Google POSTs the webhook.
  // Random UUID is plenty.
  const channelId = randomUUID();

  const response = await fetch(
    `${GOOGLE_CALENDAR_API}/calendars/${encodeURIComponent(
      params.externalCalendarId
    )}/events/watch`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: channelId,
        type: 'web_hook',
        address,
        params: {
          ttl: String(WATCH_TTL_SECONDS),
        },
      }),
    }
  );

  if (response.status === 401 || response.status === 403) {
    throw new Error(`google_watch_auth_failed_${response.status}`);
  }

  // Google rejects watches on shared/read-only calendars (holiday
  // calendars, freeBusy-only, etc.) with a 403 + "channelUnsupported"
  // — but we already auth-branched above. 400/404 likely means the
  // calendar is gone or the body shape is wrong. Either way the
  // safe degradation is "no watch, keep polling."
  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    id: string;
    resourceId: string;
    expiration?: string;
  };

  // Google returns expiration as a Unix-millis string. When absent
  // (some sandbox responses), assume the TTL we asked for.
  const expiresAtMs = data.expiration
    ? parseInt(data.expiration, 10)
    : Date.now() + WATCH_TTL_SECONDS * 1000;

  return {
    channelId: data.id,
    resourceId: data.resourceId,
    expiresAt: new Date(expiresAtMs),
  };
}

/**
 * Tear down an existing watch channel. Best-effort — if Google has
 * already expired it, the call returns 404 which we swallow.
 */
export async function stopWatch(params: {
  accessToken: string;
  channelId: string;
  resourceId: string;
}): Promise<void> {
  const response = await fetch(`${GOOGLE_CALENDAR_API}/channels/stop`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      id: params.channelId,
      resourceId: params.resourceId,
    }),
  });

  // 404 / 410 — already gone. Anything else and we don't really
  // care; the channel will expire on its own within 7 days.
  if (!response.ok && response.status !== 404 && response.status !== 410) {
    // Don't throw — disconnect flows shouldn't fail just because
    // Google's stop endpoint is unhappy.
    console.warn(
      `[Google Watch] stopWatch failed (${response.status}) for channel ${params.channelId}`
    );
  }
}
