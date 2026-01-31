/**
 * Calendar OAuth routes for Open Sunsama API
 * Handles OAuth flows for Google Calendar and Outlook
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { getDb, eq, and, calendarAccounts, calendars } from '@open-sunsama/database';
import { auth, type AuthVariables } from '../middleware/auth.js';
import { encrypt } from '../services/encryption.js';
import {
  GoogleCalendarProvider,
  OutlookCalendarProvider,
  type CalendarProvider,
} from '../services/calendar-providers/index.js';
import { oauthInitiateParamsSchema, oauthCallbackQuerySchema } from '../validation/calendar.js';
import {
  createOAuthState,
  validateOAuthState,
  deleteOAuthState,
  verifyStateProvider,
} from '../services/oauth-state.js';

const calendarOAuthRouter = new Hono<{ Variables: AuthVariables }>();

function getProvider(providerName: 'google' | 'outlook'): CalendarProvider {
  switch (providerName) {
    case 'google':
      return new GoogleCalendarProvider();
    case 'outlook':
      return new OutlookCalendarProvider();
  }
}

function getRedirectUri(provider: 'google' | 'outlook'): string {
  const baseUrl = process.env.API_URL || 'http://localhost:3001';
  return `${baseUrl}/calendar/oauth/${provider}/callback`;
}

function getWebAppUrl(): string {
  return process.env.WEB_APP_URL || 'http://localhost:3000';
}

/**
 * GET /calendar/oauth/:provider/initiate
 * Initiates OAuth flow by generating auth URL
 */
calendarOAuthRouter.get(
  '/:provider/initiate',
  auth,
  zValidator('param', oauthInitiateParamsSchema),
  async (c) => {
    const userId = c.get('userId');
    const { provider: providerName } = c.req.valid('param');

    const state = createOAuthState(userId, providerName);
    const provider = getProvider(providerName);
    const redirectUri = getRedirectUri(providerName);
    const authUrl = provider.getAuthUrl(state, redirectUri);

    return c.json({
      success: true,
      data: {
        authUrl,
        state,
      },
    });
  }
);

/**
 * GET /calendar/oauth/:provider/callback
 * OAuth callback handler - exchanges code for tokens
 */
calendarOAuthRouter.get(
  '/:provider/callback',
  zValidator('param', oauthInitiateParamsSchema),
  zValidator('query', oauthCallbackQuerySchema),
  async (c) => {
    const { provider: providerName } = c.req.valid('param');
    const { code, state, error, error_description } = c.req.valid('query');

    const webAppUrl = getWebAppUrl();
    const settingsUrl = `${webAppUrl}/app/settings`;

    if (error) {
      console.error(`[Calendar OAuth] Provider error: ${error} - ${error_description}`);
      return c.redirect(`${settingsUrl}?calendar=error&message=${encodeURIComponent(error_description || error)}`);
    }

    const storedState = validateOAuthState(state);
    if (!storedState) {
      console.error('[Calendar OAuth] Invalid or expired state');
      return c.redirect(`${settingsUrl}?calendar=error&message=${encodeURIComponent('Invalid or expired state. Please try again.')}`);
    }

    if (!verifyStateProvider(storedState, providerName)) {
      deleteOAuthState(state);
      console.error('[Calendar OAuth] Provider mismatch in state');
      return c.redirect(`${settingsUrl}?calendar=error&message=${encodeURIComponent('Provider mismatch. Please try again.')}`);
    }

    deleteOAuthState(state);

    const { userId } = storedState;
    const provider = getProvider(providerName);
    const redirectUri = getRedirectUri(providerName);

    try {
      const tokens = await provider.exchangeCode(code, redirectUri);
      const externalCalendars = await provider.listCalendars(tokens.accessToken);

      let email = '';
      let providerAccountId = '';

      if (providerName === 'google') {
        // Fetch user profile from Google to get the actual email
        const profileResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        if (profileResponse.ok) {
          const profile = await profileResponse.json() as { id: string; email: string; verified_email: boolean; name?: string; picture?: string };
          email = profile.email || '';
          providerAccountId = profile.id;
        }
      } else {
        const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });
        if (profileResponse.ok) {
          const profile = await profileResponse.json() as { mail?: string; userPrincipalName?: string; id: string };
          email = profile.mail || profile.userPrincipalName || '';
          providerAccountId = profile.id;
        }
      }

      if (!email || !providerAccountId) {
        throw new Error('Could not determine account email');
      }

      const db = getDb();

      const [existingAccount] = await db
        .select()
        .from(calendarAccounts)
        .where(
          and(
            eq(calendarAccounts.userId, userId),
            eq(calendarAccounts.provider, providerName),
            eq(calendarAccounts.providerAccountId, providerAccountId)
          )
        )
        .limit(1);

      let accountId: string;

      if (existingAccount) {
        const [updated] = await db
          .update(calendarAccounts)
          .set({
            accessTokenEncrypted: encrypt(tokens.accessToken),
            refreshTokenEncrypted: encrypt(tokens.refreshToken),
            tokenExpiresAt: tokens.expiresAt,
            syncError: null,
            syncStatus: 'idle',
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(calendarAccounts.id, existingAccount.id))
          .returning();

        accountId = updated!.id;
      } else {
        const [newAccount] = await db
          .insert(calendarAccounts)
          .values({
            userId,
            provider: providerName,
            providerAccountId,
            email,
            accessTokenEncrypted: encrypt(tokens.accessToken),
            refreshTokenEncrypted: encrypt(tokens.refreshToken),
            tokenExpiresAt: tokens.expiresAt,
          })
          .returning();

        accountId = newAccount!.id;
      }

      for (const extCal of externalCalendars) {
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

      console.log(`[Calendar OAuth] Successfully connected ${providerName} account for user ${userId}`);
      return c.redirect(`${settingsUrl}?calendar=connected&provider=${providerName}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      console.error(`[Calendar OAuth] Error: ${message}`);
      return c.redirect(`${settingsUrl}?calendar=error&message=${encodeURIComponent(message)}`);
    }
  }
);

export { calendarOAuthRouter };
