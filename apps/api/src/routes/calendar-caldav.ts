/**
 * CalDAV routes for Open Sunsama API
 * Handles iCloud calendar connections via CalDAV
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDb, eq, and, calendarAccounts, calendars } from '@open-sunsama/database';
import { ValidationError } from '@open-sunsama/utils';
import { auth, type AuthVariables } from '../middleware/auth.js';
import { encrypt } from '../services/encryption.js';
import { validateCalDavCredentials, listCalDavCalendars } from '../services/calendar-providers/icloud.js';
import { caldavConnectSchema } from '../validation/calendar.js';

const calendarCaldavRouter = new Hono<{ Variables: AuthVariables }>();
calendarCaldavRouter.use('*', auth);

/**
 * POST /calendar/caldav/connect
 * Connect an iCloud calendar account via CalDAV
 */
calendarCaldavRouter.post(
  '/connect',
  zValidator('json', caldavConnectSchema),
  async (c) => {
    const userId = c.get('userId');
    const { email, appPassword, caldavUrl } = c.req.valid('json');

    // Validate credentials first
    const validation = await validateCalDavCredentials({
      username: email,
      password: appPassword,
      serverUrl: caldavUrl,
    });

    if (!validation.valid) {
      throw new ValidationError(validation.error || 'Invalid CalDAV credentials', {
        credentials: [validation.error || 'Invalid CalDAV credentials'],
      });
    }

    const db = getDb();

    // Check if account already exists for this user
    const [existingAccount] = await db
      .select()
      .from(calendarAccounts)
      .where(
        and(
          eq(calendarAccounts.userId, userId),
          eq(calendarAccounts.provider, 'icloud'),
          eq(calendarAccounts.email, email)
        )
      )
      .limit(1);

    let accountId: string;

    if (existingAccount) {
      // Update existing account with new credentials
      const [updated] = await db
        .update(calendarAccounts)
        .set({
          caldavPasswordEncrypted: encrypt(appPassword),
          caldavUrl: caldavUrl || null,
          syncError: null,
          syncStatus: 'idle',
          isActive: true,
          updatedAt: new Date(),
        })
        .where(eq(calendarAccounts.id, existingAccount.id))
        .returning();

      accountId = updated!.id;
    } else {
      // Create new account
      const [newAccount] = await db
        .insert(calendarAccounts)
        .values({
          userId,
          provider: 'icloud',
          providerAccountId: email, // Use email as provider account ID for iCloud
          email,
          caldavPasswordEncrypted: encrypt(appPassword),
          caldavUrl: caldavUrl || null,
        })
        .returning();

      accountId = newAccount!.id;
    }

    // Fetch and store calendars
    const externalCalendars = await listCalDavCalendars({
      username: email,
      password: appPassword,
      serverUrl: caldavUrl,
    });

    for (const extCal of externalCalendars) {
      // Check if calendar already exists
      const [existingCalendar] = await db
        .select()
        .from(calendars)
        .where(
          and(
            eq(calendars.accountId, accountId),
            eq(calendars.externalId, extCal.externalId)
          )
        )
        .limit(1);

      if (existingCalendar) {
        // Update calendar info
        await db
          .update(calendars)
          .set({
            name: extCal.name,
            color: extCal.color,
            isReadOnly: extCal.isReadOnly,
            updatedAt: new Date(),
          })
          .where(eq(calendars.id, existingCalendar.id));
      } else {
        // Create new calendar
        await db
          .insert(calendars)
          .values({
            accountId,
            userId,
            externalId: extCal.externalId,
            name: extCal.name,
            color: extCal.color,
            isReadOnly: extCal.isReadOnly,
          });
      }
    }

    // Fetch the created/updated account with calendars count
    const [account] = await db
      .select()
      .from(calendarAccounts)
      .where(eq(calendarAccounts.id, accountId))
      .limit(1);

    // Format response (exclude sensitive fields)
    return c.json({
      success: true,
      data: {
        id: account!.id,
        provider: account!.provider,
        email: account!.email,
        syncStatus: account!.syncStatus,
        lastSyncedAt: account!.lastSyncedAt,
        isActive: account!.isActive,
        createdAt: account!.createdAt,
        calendarsCount: externalCalendars.length,
      },
    }, 201);
  }
);

export { calendarCaldavRouter };
