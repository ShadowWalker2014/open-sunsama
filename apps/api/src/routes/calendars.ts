/**
 * Calendar management routes for Open Sunsama API
 * Handles listing calendars and updating calendar settings
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  getDb,
  eq,
  and,
  ne,
  calendars,
  calendarAccounts,
} from '@open-sunsama/database';
import { NotFoundError } from '@open-sunsama/utils';
import { auth, requireScopes, type AuthVariables } from '../middleware/auth.js';
import {
  calendarIdParamSchema,
  updateCalendarSettingsSchema,
} from '../validation/calendar.js';
import { publishEvent } from '../lib/websocket/index.js';

const calendarsRouter = new Hono<{ Variables: AuthVariables }>();
calendarsRouter.use('*', auth);

/**
 * GET /calendars
 * List all calendars grouped by account
 */
calendarsRouter.get(
  '/',
  requireScopes('user:read'),
  async (c) => {
    const userId = c.get('userId');
    const db = getDb();

    // Fetch accounts
    const accounts = await db
      .select({
        id: calendarAccounts.id,
        provider: calendarAccounts.provider,
        email: calendarAccounts.email,
        isActive: calendarAccounts.isActive,
      })
      .from(calendarAccounts)
      .where(eq(calendarAccounts.userId, userId))
      .orderBy(calendarAccounts.createdAt);

    // Fetch all calendars for user
    const allCalendars = await db
      .select()
      .from(calendars)
      .where(eq(calendars.userId, userId))
      .orderBy(calendars.name);

    // Group calendars by account
    const result = accounts.map((account) => ({
      ...account,
      calendars: allCalendars
        .filter((cal) => cal.accountId === account.id)
        .map((cal) => ({
          id: cal.id,
          externalId: cal.externalId,
          name: cal.name,
          color: cal.color,
          isEnabled: cal.isEnabled,
          isDefaultForEvents: cal.isDefaultForEvents,
          isDefaultForTasks: cal.isDefaultForTasks,
          isReadOnly: cal.isReadOnly,
          createdAt: cal.createdAt,
          updatedAt: cal.updatedAt,
        })),
    }));

    return c.json({
      success: true,
      data: result,
    });
  }
);

/**
 * PATCH /calendars/:id
 * Update calendar settings (isEnabled, isDefaultForEvents, isDefaultForTasks)
 */
calendarsRouter.patch(
  '/:id',
  requireScopes('user:write'),
  zValidator('param', calendarIdParamSchema),
  zValidator('json', updateCalendarSettingsSchema),
  async (c) => {
    const userId = c.get('userId');
    const { id } = c.req.valid('param');
    const updates = c.req.valid('json');
    const db = getDb();

    // Verify calendar belongs to user
    const [calendar] = await db
      .select()
      .from(calendars)
      .where(
        and(eq(calendars.id, id), eq(calendars.userId, userId))
      )
      .limit(1);

    if (!calendar) {
      throw new NotFoundError('Calendar', id);
    }

    // If setting as default for events, clear other defaults first
    if (updates.isDefaultForEvents === true) {
      await db
        .update(calendars)
        .set({ isDefaultForEvents: false, updatedAt: new Date() })
        .where(
          and(
            eq(calendars.userId, userId),
            ne(calendars.id, id),
            eq(calendars.isDefaultForEvents, true)
          )
        );
    }

    // If setting as default for tasks, clear other defaults first
    if (updates.isDefaultForTasks === true) {
      await db
        .update(calendars)
        .set({ isDefaultForTasks: false, updatedAt: new Date() })
        .where(
          and(
            eq(calendars.userId, userId),
            ne(calendars.id, id),
            eq(calendars.isDefaultForTasks, true)
          )
        );
    }

    // Build update data
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (updates.isEnabled !== undefined) {
      updateData.isEnabled = updates.isEnabled;
    }
    if (updates.isDefaultForEvents !== undefined) {
      updateData.isDefaultForEvents = updates.isDefaultForEvents;
    }
    if (updates.isDefaultForTasks !== undefined) {
      updateData.isDefaultForTasks = updates.isDefaultForTasks;
    }

    // Update calendar
    const [updatedCalendar] = await db
      .update(calendars)
      .set(updateData)
      .where(eq(calendars.id, id))
      .returning();

    // Publish realtime event
    publishEvent(userId, 'calendar:updated', {
      calendarId: id,
      changes: Object.keys(updates),
    });

    return c.json({
      success: true,
      data: {
        id: updatedCalendar!.id,
        externalId: updatedCalendar!.externalId,
        name: updatedCalendar!.name,
        color: updatedCalendar!.color,
        isEnabled: updatedCalendar!.isEnabled,
        isDefaultForEvents: updatedCalendar!.isDefaultForEvents,
        isDefaultForTasks: updatedCalendar!.isDefaultForTasks,
        isReadOnly: updatedCalendar!.isReadOnly,
        createdAt: updatedCalendar!.createdAt,
        updatedAt: updatedCalendar!.updatedAt,
      },
    });
  }
);

export { calendarsRouter };
