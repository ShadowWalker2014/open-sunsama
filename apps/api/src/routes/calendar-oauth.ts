/**
 * Calendar OAuth routes for Open Sunsama API
 * Handles OAuth flows for Google Calendar and Outlook
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { randomBytes } from 'crypto';
import { getDb, eq, and, calendarAccounts, calendars } from '@open-sunsama/database';
import { ValidationError } from '@open-sunsama/utils';
import { auth, type AuthVariables } from '../middleware/auth.js';
import { encrypt } from '../services/encryption.js';
import {
  GoogleCalendarProvider,
  OutlookCalendarProvider,
  type CalendarProvider,
} from '../services/calendar-providers/index.js';
import { oauthInitiateParamsSchema, oauthCallbackQuerySchema } from '../validation/calendar.js';

const calendarOAuthRouter = new Hono<{ Variables: AuthVariables }>();

// In-memory state store (TTL: 10 minutes)
// In production, use Redis with proper TTL
interface OAuthState {
  userId: string;
  provider: 'google' | 'outlook';
  createdAt: number;
}

const stateStore = new Map<string, OAuthState>();
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Cleanup expired states periodically
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of stateStore.entries()) {
    if (now - data.createdAt > STATE_TTL_MS) {
      stateStore.delete(state);
    }
  }
}, 60 * 1000); // Run every minute

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

    // Generate random state for CSRF protection
    const state = randomBytes(32).toString('hex');
    
    // Store state with user info
    stateStore.set(state, {
      userId,
      provider: providerName,
      createdAt: Date.now(),
    });

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

    // Handle OAuth error from provider
    if (error) {
      console.error(`[Calendar OAuth] Provider error: ${error} - ${error_description}`);
      return c.redirect(`${settingsUrl}?calendar=error&message=${encodeURIComponent(error_description || error)}`);
    }

    // Validate state
    const storedState = stateStore.get(state);
    if (!storedState) {
      console.error('[Calendar OAuth] Invalid or expired state');
      return c.redirect(`${settingsUrl}?calendar=error&message=${encodeURIComponent('Invalid or expired state. Please try again.')}`);
    }

    // Check if state matches provider
    if (storedState.provider !== providerName) {
      stateStore.delete(state);
      console.error('[Calendar OAuth] Provider mismatch in state');
      return c.redirect(`${settingsUrl}?calendar=error&message=${encodeURIComponent('Provider mismatch. Please try again.')}`);
    }

    // Clean up used state
    stateStore.delete(state);

    const { userId } = storedState;
    const provider = getProvider(providerName);
    const redirectUri = getRedirectUri(providerName);

    try {
      // Exchange code for tokens
      const tokens = await provider.exchangeCode(code, redirectUri);

      // Get user email from provider (fetch calendars first to validate tokens work)
      const externalCalendars = await provider.listCalendars(tokens.accessToken);
      
      // Try to get email from calendar list (for Google, primary calendar ID is email)
      // For Outlook, we'd need a separate call to get profile
      let email = '';
      let providerAccountId = '';
      
      if (providerName === 'google') {
        // For Google, the primary calendar ID is the user's email
        const primaryCalendar = externalCalendars.find(cal => 
          cal.externalId.includes('@') && !cal.externalId.includes('#')
        );
        email = primaryCalendar?.externalId || '';
        providerAccountId = email;
      } else {
        // For Outlook, fetch user profile
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

      // Check if account already exists for this user and provider
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
        // Update existing account with new tokens
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
        // Create new account
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

      // Fetch and store calendars
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
