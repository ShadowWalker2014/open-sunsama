/**
 * Calendar events routes for Open Sunsama API
 * Handles fetching calendar events for display on timeline
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  getDb,
  eq,
  and,
  gte,
  lte,
  inArray,
  calendars,
  calendarEvents,
} from '@open-sunsama/database';
import { auth, requireScopes, type AuthVariables } from '../middleware/auth.js';
import {
  calendarEventsQuerySchema,
  parseCalendarIds,
} from '../validation/calendar.js';

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

export { calendarEventsRouter };
