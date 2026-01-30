# Calendar Integration

## Problem

Users need to see their existing calendar events (Google Calendar, Outlook, iCloud) alongside their Open Sunsama tasks and time blocks to avoid double-booking and plan their day holistically.

## Solution

Add OAuth-based calendar connections (Google, Microsoft) and CalDAV-based connections (iCloud) that sync events bidirectionally. Display external events on the timeline view with visual distinction from native time blocks.

## Technical Implementation

### Database Schema

**1. `calendar_accounts` (`packages/database/src/schema/calendar-accounts.ts`)**

Stores connected calendar provider accounts with encrypted OAuth tokens.

```typescript
export const calendarAccounts = pgTable('calendar_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 20 }).notNull(), // 'google' | 'outlook' | 'icloud'
  providerAccountId: varchar('provider_account_id', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  
  // Encrypted OAuth tokens (AES-256-GCM)
  accessTokenEncrypted: text('access_token_encrypted'),
  refreshTokenEncrypted: text('refresh_token_encrypted'),
  tokenExpiresAt: timestamp('token_expires_at'),
  
  // CalDAV credentials (iCloud) - encrypted
  caldavPasswordEncrypted: text('caldav_password_encrypted'),
  caldavUrl: varchar('caldav_url', { length: 500 }),
  
  // Sync state
  syncToken: varchar('sync_token', { length: 500 }), // For incremental sync
  lastSyncedAt: timestamp('last_synced_at'),
  syncStatus: varchar('sync_status', { length: 20 }).default('idle'), // 'idle' | 'syncing' | 'error'
  syncError: text('sync_error'),
  
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**2. `calendars` (`packages/database/src/schema/calendars.ts`)**

Individual calendars from each account that users can enable/disable.

```typescript
export const calendars = pgTable('calendars', {
  id: uuid('id').primaryKey().defaultRandom(),
  accountId: uuid('account_id').notNull().references(() => calendarAccounts.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  externalId: varchar('external_id', { length: 500 }).notNull(), // Provider's calendar ID
  name: varchar('name', { length: 255 }).notNull(),
  color: varchar('color', { length: 7 }), // Hex color from provider
  
  isEnabled: boolean('is_enabled').notNull().default(true), // Show on timeline
  isDefaultForEvents: boolean('is_default_for_events').notNull().default(false),
  isDefaultForTasks: boolean('is_default_for_tasks').notNull().default(false),
  isReadOnly: boolean('is_read_only').notNull().default(false), // Provider-level permission
  
  syncToken: varchar('sync_token', { length: 500 }), // Calendar-level sync token
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
```

**3. `calendar_events` (`packages/database/src/schema/calendar-events.ts`)**

Cached external calendar events for display on timeline.

```typescript
export const calendarEvents = pgTable('calendar_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  calendarId: uuid('calendar_id').notNull().references(() => calendars.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  
  externalId: varchar('external_id', { length: 500 }).notNull(), // Provider's event ID
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  location: varchar('location', { length: 500 }),
  
  startTime: timestamp('start_time').notNull(),
  endTime: timestamp('end_time').notNull(),
  isAllDay: boolean('is_all_day').notNull().default(false),
  timezone: varchar('timezone', { length: 50 }),
  
  // Recurrence
  recurrenceRule: varchar('recurrence_rule', { length: 500 }), // RRULE string
  recurringEventId: varchar('recurring_event_id', { length: 500 }), // Parent event ID
  
  // Status
  status: varchar('status', { length: 20 }).default('confirmed'), // 'confirmed' | 'tentative' | 'cancelled'
  responseStatus: varchar('response_status', { length: 20 }), // 'accepted' | 'declined' | 'tentative' | 'needsAction'
  
  // Metadata
  htmlLink: varchar('html_link', { length: 1000 }), // Link to event in provider's UI
  etag: varchar('etag', { length: 255 }), // For change detection
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => [
  index('calendar_events_user_time_idx').on(table.userId, table.startTime, table.endTime),
  index('calendar_events_calendar_external_idx').on(table.calendarId, table.externalId),
]);
```

### API Routes

**1. OAuth Routes (`apps/api/src/routes/calendar-oauth.ts`)**

```typescript
// GET /calendar/oauth/:provider/initiate
// Generates OAuth URL and returns it for redirect
// Stores state in Redis with 10-minute TTL

// GET /calendar/oauth/:provider/callback
// Exchanges code for tokens, creates calendar_account
// Triggers initial calendar list fetch
// Redirects to web app settings with success/error status

// Providers: google, outlook
```

**2. CalDAV Routes (`apps/api/src/routes/calendar-caldav.ts`)**

```typescript
// POST /calendar/caldav/connect
// Body: { email, appPassword, caldavUrl? }
// Validates credentials by fetching calendar list
// Creates calendar_account with encrypted credentials
```

**3. Calendar Account Routes (`apps/api/src/routes/calendar-accounts.ts`)**

```typescript
// GET /calendar/accounts - List connected accounts
// DELETE /calendar/accounts/:id - Disconnect account (cascades to calendars/events)
// POST /calendar/accounts/:id/sync - Trigger manual sync
```

**4. Calendar Routes (`apps/api/src/routes/calendars.ts`)**

```typescript
// GET /calendars - List all calendars (grouped by account)
// PATCH /calendars/:id - Update calendar settings (isEnabled, isDefault*)
// GET /calendars/:id/events - List events for a specific calendar
```

**5. Calendar Events Routes (`apps/api/src/routes/calendar-events.ts`)**

```typescript
// GET /calendar-events - List events for date range
// Query: { from: string, to: string, calendarIds?: string[] }
// Returns events from all enabled calendars
```

### Services

**1. Encryption Service (`apps/api/src/services/encryption.ts`)**

AES-256-GCM encryption for OAuth tokens using `CALENDAR_ENCRYPTION_KEY` env var.

```typescript
export function encrypt(plaintext: string): string;
export function decrypt(ciphertext: string): string;
```

**2. Provider Adapters (`apps/api/src/services/calendar-providers/`)**

Abstract interface with provider-specific implementations:

```typescript
interface CalendarProvider {
  getAuthUrl(state: string): string;
  exchangeCode(code: string): Promise<OAuthTokens>;
  refreshTokens(refreshToken: string): Promise<OAuthTokens>;
  listCalendars(accessToken: string): Promise<ExternalCalendar[]>;
  listEvents(accessToken: string, calendarId: string, options: SyncOptions): Promise<SyncResult>;
  // Future: createEvent, updateEvent, deleteEvent
}
```

- `google.ts` - Google Calendar API v3
- `outlook.ts` - Microsoft Graph API
- `icloud.ts` - CalDAV protocol via `tsdav` package

**3. Sync Service (`apps/api/src/services/calendar-sync.ts`)**

- Initial full sync on account connection
- Incremental sync using sync tokens (Google/Outlook) or ETags (CalDAV)
- Background job scheduling via pg-boss for periodic syncs
- Handles token refresh before expiry

### Webhook Infrastructure

**1. Google Push Notifications (`apps/api/src/routes/webhooks/google-calendar.ts`)**

```typescript
// POST /webhooks/google-calendar
// Receives push notifications from Google Calendar API
// Header: X-Goog-Resource-State, X-Goog-Channel-ID
// Triggers incremental sync for affected calendar
```

**2. Microsoft Subscription (`apps/api/src/routes/webhooks/outlook-calendar.ts`)**

```typescript
// POST /webhooks/outlook-calendar
// Receives Graph API change notifications
// Body: { value: [{ changeType, resource, clientState }] }
// Validates clientState, triggers sync
```

**3. Webhook Management Service (`apps/api/src/services/webhook-subscriptions.ts`)**

- Creates/renews webhook subscriptions per calendar account
- Stores subscription IDs in calendar_accounts
- Background job to renew before expiry (Google: 7 days, Outlook: 3 days)

### UI Components

**1. Calendar Connections Settings (`apps/web/src/components/settings/calendar-settings.tsx`)**

Main settings tab with:
- Connected accounts list with provider icons
- Connect buttons for each provider (Google, Outlook, iCloud)
- Disconnect confirmation dialog
- Sync status indicator and manual sync button

**2. iCloud Connect Dialog (`apps/web/src/components/settings/icloud-connect-dialog.tsx`)**

Form for CalDAV credentials:
- Apple ID email input
- App-specific password input (with link to Apple instructions)
- CalDAV URL (optional, auto-detected)

**3. Calendar Picker (`apps/web/src/components/settings/calendar-picker.tsx`)**

List of calendars grouped by account:
- Toggle for enable/disable each calendar
- Radio buttons for "Default for events" / "Default for tasks"
- Color swatch showing calendar color

**4. External Event Block (`apps/web/src/components/calendar/external-event.tsx`)**

Timeline block for external events:
- Semi-transparent background (visual distinction from native blocks)
- Calendar color as accent
- "External" badge or icon
- Click opens event in provider's web UI
- Cannot be resized/moved (read-only display)

**5. Timeline Extension (`apps/web/src/components/calendar/timeline.tsx`)**

Extend existing Timeline to:
- Fetch and display calendar events alongside time blocks
- Layer external events behind native blocks
- Filter by enabled calendars

### Background Jobs (pg-boss)

**1. `calendar-sync` - Periodic full sync**
- Runs every 15 minutes per account
- Uses sync tokens for efficiency
- Updates lastSyncedAt on completion

**2. `calendar-webhook-renew` - Webhook subscription renewal**
- Runs daily
- Renews subscriptions expiring within 2 days

**3. `calendar-token-refresh` - OAuth token refresh**
- Runs every 30 minutes
- Refreshes tokens expiring within 1 hour

### Types

**Add to `packages/types/src/calendar.ts`:**

```typescript
export type CalendarProvider = 'google' | 'outlook' | 'icloud';

export interface CalendarAccount {
  id: string;
  userId: string;
  provider: CalendarProvider;
  email: string;
  syncStatus: 'idle' | 'syncing' | 'error';
  syncError: string | null;
  lastSyncedAt: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Calendar {
  id: string;
  accountId: string;
  name: string;
  color: string | null;
  isEnabled: boolean;
  isDefaultForEvents: boolean;
  isDefaultForTasks: boolean;
  isReadOnly: boolean;
}

export interface CalendarEvent {
  id: string;
  calendarId: string;
  externalId: string;
  title: string;
  description: string | null;
  location: string | null;
  startTime: Date;
  endTime: Date;
  isAllDay: boolean;
  status: 'confirmed' | 'tentative' | 'cancelled';
  responseStatus: 'accepted' | 'declined' | 'tentative' | 'needsAction' | null;
  htmlLink: string | null;
  calendar?: Calendar;
}
```

### Environment Variables

**Add to `apps/api/.env`:**

```bash
# Calendar Integration
CALENDAR_ENCRYPTION_KEY=<32-byte-hex-key>  # For token encryption

# Google Calendar OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://api.opensunsama.com/calendar/oauth/google/callback

# Microsoft OAuth (Outlook)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_REDIRECT_URI=https://api.opensunsama.com/calendar/oauth/outlook/callback

# Webhook URLs (for subscription setup)
GOOGLE_WEBHOOK_URL=https://api.opensunsama.com/webhooks/google-calendar
OUTLOOK_WEBHOOK_URL=https://api.opensunsama.com/webhooks/outlook-calendar
```

### Flow

**OAuth Connection:**
1. User clicks "Connect Google Calendar" in Settings
2. Frontend redirects to `/calendar/oauth/google/initiate`
3. API generates state, stores in Redis, returns Google OAuth URL
4. User authorizes in Google
5. Google redirects to callback with code
6. API exchanges code for tokens, encrypts and stores
7. API fetches calendar list, creates calendar records
8. API creates webhook subscription for push notifications
9. API triggers initial event sync
10. API redirects to web app settings with `?calendar=connected`

**Event Sync:**
1. Webhook receives push notification OR cron job triggers
2. Service fetches account, decrypts tokens
3. If token expired, refresh it first
4. Call provider API with sync token for delta changes
5. Upsert calendar_events based on external_id
6. Update sync token and lastSyncedAt
7. Publish WebSocket event `calendar:synced` for realtime UI update

**Timeline Display:**
1. CalendarView fetches time blocks for date range (existing)
2. CalendarView also fetches calendar events for same range
3. Timeline renders external events behind native blocks
4. External events show with semi-transparent style and calendar color

## Edge Cases

- Token expiry during sync → Refresh token, retry once, then mark account as error state
- Deleted calendar from provider → Mark calendar as inactive, keep historical events
- Rate limiting → Exponential backoff, track retry count in sync job
- iCloud 2FA requirement → Clear error message directing user to app-specific password
- Recurring events → Expand occurrences within sync window, store recurringEventId for updates
- All-day events → Display at top of timeline as banner, not in time slots
- Timezone differences → Store in UTC, convert to user's timezone on display
- Webhook delivery failure → Cron job catches up on next sync cycle
- Calendar color null → Fall back to provider's default color or app accent color
- Event without end time → Default to 1-hour duration
- Concurrent syncs → Use database locks or sync queue per account
