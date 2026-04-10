# Google Calendar Setup Guide

## Overview
Open Sunsama uses Google OAuth 2.0 to connect to your Google Calendar.
This guide walks you through setting up Google Calendar integration for local development.

## Prerequisites
- A Google account (recommended: create a separate test account)
- Access to [Google Cloud Console](https://console.cloud.google.com)

## Step 1 — Create a Google Cloud Project

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Click **Select Project** → **New Project**
3. Name: `open-sunsama-dev`
4. Click **Create**

## Step 2 — Enable Required APIs

1. Go to **APIs & Services** → **Enable APIs & Services**
2. Search and enable:
   - **Google Calendar API**
   - **People API**

## Step 3 — Configure OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth Consent Screen**
2. Select **External** → **Create**
3. Fill in:
   - App name: `Open Sunsama Dev`
   - User support email: your email
   - Developer contact email: your email
4. Click **Save & Continue**
5. On **Scopes** page → click **Save & Continue** (skip for now)
6. On **Test Users** page:
   - Click **Add Users**
   - Add your Google account email
   - Click **Save**

## Step 4 — Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **OAuth Client ID**
3. Application type: **Web application**
4. Name: `open-sunsama-local`
5. Under **Authorized redirect URIs** add exactly:
http://localhost:3001/calendar/oauth/google/callback
6. Click **Create**
7. Copy your **Client ID** and **Client Secret**

## Step 5 — Configure Environment Variables

Add to your `apps/api/.env`:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
CALENDAR_ENCRYPTION_KEY=your_64_char_hex_key
JWT_SECRET=your_jwt_secret
```

Generate required keys:
```bash
# JWT Secret
openssl rand -base64 32

# Calendar Encryption Key
openssl rand -hex 32
```

## Step 6 — Restart the App

```bash
# Stop the dev server
Ctrl + C

# Copy env to api app
cp .env apps/api/.env

# Start again
bun run dev
```

## Common Errors & Fixes

### Error 400: redirect_uri_mismatch
**Cause:** Redirect URI in Google Console doesn't match exactly.

**Fix:** Make sure you added exactly this URI with no trailing slash:
http://localhost:3001/calendar/oauth/google/callback

### Error 403: access_denied
**Cause:** Your Google account is not added as a test user.

**Fix:** 
1. Go to Google Cloud Console
2. APIs & Services → OAuth Consent Screen
3. Test Users → Add Users
4. Add your Google account email
5. Save and try again

### Error: Invalid key length
**Cause:** `CALENDAR_ENCRYPTION_KEY` or `JWT_SECRET` is missing or too short.

**Fix:** Generate proper keys:
```bash
# JWT Secret (min 32 chars)
openssl rand -base64 32

# Calendar Encryption Key (exactly 64 hex chars)
openssl rand -hex 32
```

### Error: Database URL not found
**Cause:** `.env` file not copied to `apps/api/`

**Fix:**
```bash
cp .env apps/api/.env
```

### Error: Connection to localhost:5432 refused
**Cause:** PostgreSQL is not running.

**Fix:**
```bash
brew services start postgresql@15
```

## Security Notes

- Use a separate Google account for testing
- `CALENDAR_ENCRYPTION_KEY` encrypts OAuth tokens stored in database
- `JWT_SECRET` signs authentication tokens