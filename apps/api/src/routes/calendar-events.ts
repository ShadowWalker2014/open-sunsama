/**
 * Calendar events routes for Open Sunsama API
 * Fetch events for display, plus write-back (edit / delete) for providers
 * that support it.
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import {
  getDb,
  eq,
  and,
  gte,
  lte,
  inArray,
  calendars,
  calendarAccounts,
  calendarEvents,
} from '@open-sunsama/database';
import { auth, requireScopes, type AuthVariables } from '../middleware/auth.js';
import {
  calendarEventsQuerySchema,
  parseCalendarIds,
} from '../validation/calendar.js';
import {
  getProvider,
  refreshTokensIfNeeded,
} from '../services/calendar-sync.js';
import {
  ProviderReadOnlyError,
  type EventPatch,
} from '../services/calendar-providers/index.js';
import { publishEvent } from '../lib/websocket/index.js';

const calendarEventsRouter = new Hono<{ Variables: AuthVariables }>();
calendarEventsRouter.use('*', auth);

/**
 * GET /calendar-events
 * List calendar events for a date range from enabled calendars
 */
calendarEventsRouter.get(
  '/',
  requireScopes('user:read'),
  zValidator('query', calendarEventsQuerySchema),
  async (c) => {
    const userId = c.get('userId');
    const { from, to, calendarIds: calendarIdsParam } = c.req.valid('query');
    const db = getDb();

    // Parse date range
    const fromDate = new Date(from);
    const toDate = new Date(to);

    // Parse optional calendar IDs filter
    const calendarIds = parseCalendarIds(calendarIdsParam);

    // First, get enabled calendars for user
    const enabledCalendarQuery = db
      .select({ id: calendars.id })
      .from(calendars)
      .where(
        and(
          eq(calendars.userId, userId),
          eq(calendars.isEnabled, true)
        )
      );

    // If specific calendar IDs are provided, filter to those
    const enabledCalendars = await enabledCalendarQuery;
    let calendarIdFilter = enabledCalendars.map((c) => c.id);

    // If calendarIds filter is provided, intersect with enabled calendars
    if (calendarIds && calendarIds.length > 0) {
      calendarIdFilter = calendarIdFilter.filter((id) =>
        calendarIds.includes(id)
      );
    }

    // If no calendars to query, return empty result
    if (calendarIdFilter.length === 0) {
      return c.json({
        success: true,
        data: [],
      });
    }

    // Fetch events from enabled calendars within date range
    const events = await db
      .select({
        id: calendarEvents.id,
        calendarId: calendarEvents.calendarId,
        externalId: calendarEvents.externalId,
        title: calendarEvents.title,
        description: calendarEvents.description,
        location: calendarEvents.location,
        startTime: calendarEvents.startTime,
        endTime: calendarEvents.endTime,
        isAllDay: calendarEvents.isAllDay,
        timezone: calendarEvents.timezone,
        recurrenceRule: calendarEvents.recurrenceRule,
        recurringEventId: calendarEvents.recurringEventId,
        status: calendarEvents.status,
        responseStatus: calendarEvents.responseStatus,
        htmlLink: calendarEvents.htmlLink,
        createdAt: calendarEvents.createdAt,
        updatedAt: calendarEvents.updatedAt,
      })
      .from(calendarEvents)
      .where(
        and(
          eq(calendarEvents.userId, userId),
          inArray(calendarEvents.calendarId, calendarIdFilter),
          // Events that overlap with the date range:
          // Event starts before range ends AND event ends after range starts
          lte(calendarEvents.startTime, toDate),
          gte(calendarEvents.endTime, fromDate)
        )
      )
      .orderBy(calendarEvents.startTime);

    // Fetch calendar info to enrich events
    const calendarsInfo = await db
      .select({
        id: calendars.id,
        name: calendars.name,
        color: calendars.color,
        accountId: calendars.accountId,
      })
      .from(calendars)
      .where(inArray(calendars.id, calendarIdFilter));

    const calendarsMap = new Map(
      calendarsInfo.map((cal) => [cal.id, cal])
    );

    // Enrich events with calendar info
    const enrichedEvents = events.map((event) => {
      const calendar = calendarsMap.get(event.calendarId);
      return {
        ...event,
        calendar: calendar
          ? {
              id: calendar.id,
              name: calendar.name,
              color: calendar.color,
            }
          : null,
      };
    });

    return c.json({
      success: true,
      data: enrichedEvents,
      meta: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        total: enrichedEvents.length,
      },
    });
  }
);

/**
 * Common helper: load the event together with its calendar + account so
 * we can write back via the right provider with a fresh token. Returns
 * 404 with a `null` payload if the event doesn't belong to this user.
 */
async function loadEventForWrite(eventId: string, userId: string) {
  const db = getDb();
  const rows = await db
    .select({
      event: calendarEvents,
      calendar: calendars,
      account: calendarAccounts,
    })
    .from(calendarEvents)
    .innerJoin(calendars, eq(calendars.id, calendarEvents.calendarId))
    .innerJoin(
      calendarAccounts,
      eq(calendarAccounts.id, calendars.accountId)
    )
    .where(
      and(
        eq(calendarEvents.id, eventId),
        eq(calendarEvents.userId, userId)
      )
    )
    .limit(1);

  return rows[0] ?? null;
}

/**
 * Body for POST /calendar-events. The client picks which writable
 * calendar to host the new event on. Times are ISO 8601.
 */
const createEventBodySchema = z
  .object({
    calendarId: z.string().uuid(),
    title: z.string().min(1).max(500),
    description: z.string().max(50_000).nullable().optional(),
    location: z.string().max(1000).nullable().optional(),
    startTime: z.string().datetime(),
    endTime: z.string().datetime(),
    isAllDay: z.boolean().optional(),
    timezone: z.string().max(100).nullable().optional(),
  })
  .refine((b) => new Date(b.endTime) > new Date(b.startTime), {
    message: 'endTime must be after startTime',
    path: ['endTime'],
  });

/**
 * POST /calendar-events
 * Create a new external calendar event. Sends to the provider first;
 * only writes locally on success so we don't end up with orphan rows.
 * Returns the created event with calendar metadata enriched.
 */
calendarEventsRouter.post(
  '/',
  requireScopes('user:write'),
  zValidator('json', createEventBodySchema),
  async (c) => {
    const userId = c.get('userId');
    const body = c.req.valid('json');
    const db = getDb();

    // Resolve calendar + account; verify ownership and write capability.
    const [target] = await db
      .select({
        calendar: calendars,
        account: calendarAccounts,
      })
      .from(calendars)
      .innerJoin(
        calendarAccounts,
        eq(calendarAccounts.id, calendars.accountId)
      )
      .where(
        and(
          eq(calendars.id, body.calendarId),
          eq(calendars.userId, userId)
        )
      )
      .limit(1);

    if (!target) {
      return c.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Calendar not found' } },
        404
      );
    }

    if (target.calendar.isReadOnly) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CALENDAR_READ_ONLY',
            message: 'This calendar is read-only — events cannot be created here.',
          },
        },
        409
      );
    }

    const provider = getProvider(target.account.provider);
    if (!provider || !provider.createEvent) {
      return c.json(
        {
          success: false,
          error: {
            code: 'PROVIDER_READ_ONLY',
            message: `Creating ${target.account.provider} events is not yet supported.`,
          },
        },
        409
      );
    }

    const accessToken = await refreshTokensIfNeeded(
      {
        id: target.account.id,
        provider: target.account.provider,
        accessTokenEncrypted: target.account.accessTokenEncrypted,
        refreshTokenEncrypted: target.account.refreshTokenEncrypted,
        tokenExpiresAt: target.account.tokenExpiresAt,
      },
      provider
    );

    const payload: EventPatch = {
      title: body.title,
      description: body.description ?? undefined,
      location: body.location ?? undefined,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime),
      isAllDay: body.isAllDay ?? false,
      timezone: body.timezone ?? undefined,
    };

    let externalEvent;
    try {
      externalEvent = await provider.createEvent(
        accessToken,
        target.calendar.externalId,
        payload
      );
    } catch (err) {
      if (err instanceof ProviderReadOnlyError) {
        return c.json(
          {
            success: false,
            error: { code: 'PROVIDER_READ_ONLY', message: err.message },
          },
          409
        );
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json(
        {
          success: false,
          error: { code: 'PROVIDER_ERROR', message },
        },
        502
      );
    }

    const [created] = await db
      .insert(calendarEvents)
      .values({
        calendarId: body.calendarId,
        userId,
        externalId: externalEvent.externalId,
        title: externalEvent.title,
        description: externalEvent.description,
        location: externalEvent.location,
        startTime: externalEvent.startTime,
        endTime: externalEvent.endTime,
        isAllDay: externalEvent.isAllDay,
        timezone: externalEvent.timezone,
        recurrenceRule: externalEvent.recurrenceRule,
        recurringEventId: externalEvent.recurringEventId,
        status: externalEvent.status,
        responseStatus: externalEvent.responseStatus,
        htmlLink: externalEvent.htmlLink,
        etag: externalEvent.etag,
      })
      .returning();

    if (created) {
      await publishEvent(userId, 'calendar-event:updated', {
        id: created.id,
        calendarId: created.calendarId,
      });
    }

    return c.json(
      {
        success: true,
        data: {
          ...created,
          calendar: {
            id: target.calendar.id,
            name: target.calendar.name,
            color: target.calendar.color,
          },
        },
      },
      201
    );
  }
);

/**
 * Body for PATCH /calendar-events/:id. All fields optional. The client
 * may send any subset of the editable fields. Times are ISO 8601.
 */
const updateEventBodySchema = z
  .object({
    title: z.string().min(1).max(500).optional(),
    description: z.string().max(50_000).nullable().optional(),
    location: z.string().max(1000).nullable().optional(),
    startTime: z.string().datetime().optional(),
    endTime: z.string().datetime().optional(),
    isAllDay: z.boolean().optional(),
    timezone: z.string().max(100).nullable().optional(),
  })
  .refine(
    (b) =>
      (b.startTime === undefined && b.endTime === undefined) ||
      (b.startTime !== undefined && b.endTime !== undefined),
    {
      message: 'startTime and endTime must be provided together',
      path: ['endTime'],
    }
  )
  .refine(
    (b) =>
      b.startTime === undefined ||
      b.endTime === undefined ||
      new Date(b.endTime) > new Date(b.startTime),
    {
      message: 'endTime must be after startTime',
      path: ['endTime'],
    }
  );

/**
 * PATCH /calendar-events/:id
 * Edit an external calendar event. The change is sent upstream to the
 * provider and only persisted locally if the upstream write succeeds —
 * we don't want a divergent local state if the user lacks permission
 * or the provider is down. Returns the updated event payload.
 */
calendarEventsRouter.patch(
  '/:id',
  requireScopes('user:write'),
  zValidator('json', updateEventBodySchema),
  async (c) => {
    const userId = c.get('userId');
    const eventId = c.req.param('id');
    const body = c.req.valid('json');
    const db = getDb();

    const row = await loadEventForWrite(eventId, userId);
    if (!row) {
      return c.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        404
      );
    }

    if (row.calendar.isReadOnly) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CALENDAR_READ_ONLY',
            message: 'This calendar is read-only — events cannot be edited.',
          },
        },
        409
      );
    }

    const provider = getProvider(row.account.provider);
    if (!provider || !provider.updateEvent) {
      return c.json(
        {
          success: false,
          error: {
            code: 'PROVIDER_READ_ONLY',
            message: `Editing ${row.account.provider} events is not yet supported.`,
          },
        },
        409
      );
    }

    const accessToken = await refreshTokensIfNeeded(
      {
        id: row.account.id,
        provider: row.account.provider,
        accessTokenEncrypted: row.account.accessTokenEncrypted,
        refreshTokenEncrypted: row.account.refreshTokenEncrypted,
        tokenExpiresAt: row.account.tokenExpiresAt,
      },
      provider
    );

    const patch: EventPatch = {};
    if (body.title !== undefined) patch.title = body.title;
    if (body.description !== undefined) patch.description = body.description;
    if (body.location !== undefined) patch.location = body.location;
    if (body.startTime !== undefined && body.endTime !== undefined) {
      patch.startTime = new Date(body.startTime);
      patch.endTime = new Date(body.endTime);
    }
    if (body.isAllDay !== undefined) patch.isAllDay = body.isAllDay;
    if (body.timezone !== undefined) patch.timezone = body.timezone;

    let updatedExternal;
    try {
      updatedExternal = await provider.updateEvent(
        accessToken,
        row.calendar.externalId,
        row.event.externalId,
        patch
      );
    } catch (err) {
      if (err instanceof ProviderReadOnlyError) {
        return c.json(
          {
            success: false,
            error: { code: 'PROVIDER_READ_ONLY', message: err.message },
          },
          409
        );
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json(
        {
          success: false,
          error: { code: 'PROVIDER_ERROR', message },
        },
        502
      );
    }

    // Write-through to local DB so the user sees the change immediately
    // without waiting for the next sync. The provider response is the
    // canonical post-write state.
    const [updated] = await db
      .update(calendarEvents)
      .set({
        title: updatedExternal.title,
        description: updatedExternal.description,
        location: updatedExternal.location,
        startTime: updatedExternal.startTime,
        endTime: updatedExternal.endTime,
        isAllDay: updatedExternal.isAllDay,
        timezone: updatedExternal.timezone,
        status: updatedExternal.status,
        responseStatus: updatedExternal.responseStatus,
        htmlLink: updatedExternal.htmlLink,
        etag: updatedExternal.etag,
        updatedAt: new Date(),
      })
      .where(eq(calendarEvents.id, eventId))
      .returning();

    if (updated) {
      // Notify other tabs / devices via the realtime channel; the client
      // invalidates the calendar-events query on receipt.
      await publishEvent(userId, 'calendar-event:updated', {
        id: updated.id,
        calendarId: updated.calendarId,
      });
    }

    return c.json({
      success: true,
      data: {
        ...updated,
        calendar: {
          id: row.calendar.id,
          name: row.calendar.name,
          color: row.calendar.color,
        },
      },
    });
  }
);

/**
 * DELETE /calendar-events/:id
 * Delete an external calendar event upstream and locally.
 */
calendarEventsRouter.delete(
  '/:id',
  requireScopes('user:write'),
  async (c) => {
    const userId = c.get('userId');
    const eventId = c.req.param('id');
    const db = getDb();

    const row = await loadEventForWrite(eventId, userId);
    if (!row) {
      return c.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Event not found' } },
        404
      );
    }

    if (row.calendar.isReadOnly) {
      return c.json(
        {
          success: false,
          error: {
            code: 'CALENDAR_READ_ONLY',
            message: 'This calendar is read-only — events cannot be deleted.',
          },
        },
        409
      );
    }

    const provider = getProvider(row.account.provider);
    if (!provider || !provider.deleteEvent) {
      return c.json(
        {
          success: false,
          error: {
            code: 'PROVIDER_READ_ONLY',
            message: `Deleting ${row.account.provider} events is not yet supported.`,
          },
        },
        409
      );
    }

    const accessToken = await refreshTokensIfNeeded(
      {
        id: row.account.id,
        provider: row.account.provider,
        accessTokenEncrypted: row.account.accessTokenEncrypted,
        refreshTokenEncrypted: row.account.refreshTokenEncrypted,
        tokenExpiresAt: row.account.tokenExpiresAt,
      },
      provider
    );

    try {
      await provider.deleteEvent(
        accessToken,
        row.calendar.externalId,
        row.event.externalId
      );
    } catch (err) {
      if (err instanceof ProviderReadOnlyError) {
        return c.json(
          {
            success: false,
            error: { code: 'PROVIDER_READ_ONLY', message: err.message },
          },
          409
        );
      }
      const message = err instanceof Error ? err.message : 'Unknown error';
      return c.json(
        {
          success: false,
          error: { code: 'PROVIDER_ERROR', message },
        },
        502
      );
    }

    await db.delete(calendarEvents).where(eq(calendarEvents.id, eventId));

    await publishEvent(userId, 'calendar-event:deleted', {
      id: eventId,
      calendarId: row.calendar.id,
    });

    return c.json({ success: true });
  }
);

export { calendarEventsRouter };
