/**
 * Public webhook endpoints for provider push notifications.
 *
 * No `auth` middleware — providers can't authenticate against our
 * user system. Identity is established via the per-channel state
 * stored when we registered the watch:
 *   - Google sends `X-Goog-Channel-ID`; we look up the calendar by
 *     `watch_channel_id`, which acts as a 128-bit unguessable token.
 *   - We also confirm `X-Goog-Resource-ID` matches the persisted
 *     `watch_resource_id` so a stolen channel ID alone isn't enough.
 *
 * Handlers must respond fast — Google retries with exponential
 * backoff on non-2xx OR slow responses, and we don't want to be the
 * source of duplicate sync jobs. We enqueue via PG Boss with a
 * singleton key per account so concurrent webhooks for the same
 * account collapse into one sync job.
 */

import { Hono } from 'hono';
import {
  getDb,
  eq,
  calendars,
  calendarAccounts,
} from '@open-sunsama/database';
import { getPgBoss, JOBS } from '../lib/pgboss.js';
import type { SyncAccountPayload } from '../workers/calendar-sync/sync-account.js';

const webhooksRouter = new Hono();

/**
 * Google Calendar push notifications.
 *
 * Headers Google sends (per
 * https://developers.google.com/calendar/api/guides/push):
 *   X-Goog-Channel-ID         — our channel UUID
 *   X-Goog-Channel-Token      — optional verification token
 *   X-Goog-Resource-ID        — Google's resource handle
 *   X-Goog-Resource-State     — "sync" (initial) | "exists" (changed)
 *                              | "not_exists" (deleted)
 *   X-Goog-Resource-URI       — the watched resource URL
 *   X-Goog-Message-Number     — strictly increasing sequence
 *
 * Body is empty for `sync` and `exists`; we ignore it.
 */
webhooksRouter.post('/google/calendar', async (c) => {
  const channelId = c.req.header('x-goog-channel-id');
  const resourceId = c.req.header('x-goog-resource-id');
  const resourceState = c.req.header('x-goog-resource-state');

  if (!channelId || !resourceId || !resourceState) {
    return c.json({ ok: false, reason: 'missing_headers' }, 400);
  }

  // Google's first POST after registering a channel is `sync` and
  // doesn't represent a change — just acknowledge and bail. The
  // channel is now active.
  if (resourceState === 'sync') {
    return c.json({ ok: true, ignored: 'sync_handshake' }, 200);
  }

  // Look up the calendar row by the channel id we generated. If no
  // match (channel was stopped on our side, or this is a stale
  // notification for a deleted account), 200 + ignore. Returning
  // 4xx would just trigger Google retries and pollute logs without
  // achieving anything.
  const db = getDb();
  const [cal] = await db
    .select({
      id: calendars.id,
      accountId: calendars.accountId,
      userId: calendars.userId,
      watchResourceId: calendars.watchResourceId,
    })
    .from(calendars)
    .where(eq(calendars.watchChannelId, channelId))
    .limit(1);

  if (!cal) {
    return c.json({ ok: true, ignored: 'unknown_channel' }, 200);
  }

  // Reject mismatched resourceId — defends against a leaked/guessed
  // channel id being replayed against a different calendar.
  if (cal.watchResourceId !== resourceId) {
    return c.json({ ok: false, reason: 'resource_mismatch' }, 403);
  }

  // Find the account so we can enqueue an account-level sync. Going
  // calendar-by-calendar on every webhook would multiply sync-job
  // overhead on accounts with many watched calendars.
  const [account] = await db
    .select({
      id: calendarAccounts.id,
      userId: calendarAccounts.userId,
      provider: calendarAccounts.provider,
    })
    .from(calendarAccounts)
    .where(eq(calendarAccounts.id, cal.accountId))
    .limit(1);

  if (!account) {
    return c.json({ ok: true, ignored: 'no_account' }, 200);
  }

  // Enqueue with `singletonKey` per account: if a sync job is
  // already queued (e.g. burst of webhooks for many calendars), the
  // additional sends collapse into the existing job. The synced
  // window picks up all changes via syncToken-based delta in one
  // pass, so we don't lose anything by deduping.
  const boss = await getPgBoss();
  await boss.send(
    JOBS.SYNC_CALENDAR_ACCOUNT,
    {
      accountId: account.id,
      userId: account.userId,
      provider: account.provider,
    } satisfies SyncAccountPayload,
    {
      singletonKey: `webhook-sync-${account.id}`,
      // Short window — collapse webhooks within a few seconds, but
      // don't suppress legitimately-spaced changes.
      singletonSeconds: 10,
    }
  );

  return c.json({ ok: true }, 200);
});

export { webhooksRouter };
