# Railway Deployment Setup for Open Sunsama

This guide explains how to configure Railway for automatic GitHub deployments.

## Prerequisites

- Railway account linked to GitHub
- GitHub repository: `ShadowWalker2014/open-sunsama`
- Railway project: "Open Sunsama"

## Service Configuration

### 1. API Service Setup

Go to Railway Dashboard → Open Sunsama → api service → Settings:

**Source**
- Connect to GitHub repo: `ShadowWalker2014/open-sunsama`
- Branch: `main`

**Build**
- Builder: Dockerfile
- Dockerfile Path: `Dockerfile.api`
- Watch Paths: `apps/api/**`, `packages/**`, `Dockerfile.api`

**Deploy**
- Start Command: (leave empty, uses Dockerfile CMD)
- Health Check Path: `/`
- Health Check Timeout: 300

**Environment Variables** (Required)
```
NODE_ENV=production
PORT=3001
JWT_SECRET=<generate-secure-secret>
DATABASE_URL=<postgres-internal-url>
CORS_ORIGIN=https://<web-domain>.up.railway.app,http://localhost:3000

# S3 Storage (for file uploads)
AWS_ENDPOINT_URL=https://storage.railway.app
AWS_DEFAULT_REGION=auto
AWS_S3_BUCKET_NAME=<your-bucket-name>
AWS_ACCESS_KEY_ID=<from-railway-storage>
AWS_SECRET_ACCESS_KEY=<from-railway-storage>
```

### 2. Web Service Setup

Go to Railway Dashboard → Open Sunsama → web service → Settings:

**Source**
- Connect to GitHub repo: `ShadowWalker2014/open-sunsama`
- Branch: `main`

**Build**
- Builder: Dockerfile
- Dockerfile Path: `Dockerfile.web`
- Watch Paths: `apps/web/**`, `packages/**`, `Dockerfile.web`

**Deploy**
- Start Command: (leave empty, uses Dockerfile CMD)
- Health Check Path: `/`

**Environment Variables** (Required)
```
NODE_ENV=production
PORT=3000
VITE_API_URL=https://<api-domain>.up.railway.app
```

### 3. Database Setup (Postgres)

If not already created:
1. Click "+ New" in Railway project
2. Select "Database" → "PostgreSQL"
3. Copy the **internal** DATABASE_URL (ends with `.railway.internal`)
4. Add to API service environment variables

**Important:** Use the internal URL to avoid egress fees:
```
DATABASE_URL=postgresql://postgres:<password>@postgres.railway.internal:5432/railway
```

### 4. Storage Setup (S3 Bucket)

If not already created:
1. Click "+ New" in Railway project
2. Select "Storage"
3. Copy the credentials and add to API service

## How GitHub CI Works

Once configured, Railway will:

1. **Watch for pushes** to the `main` branch
2. **Check watch paths** - only rebuild if relevant files changed
3. **Build using Dockerfile** - `Dockerfile.api` or `Dockerfile.web`
4. **Deploy automatically** - zero-downtime deployment

### Watch Paths Explanation

| Service | Watch Paths | Triggers On |
|---------|-------------|-------------|
| api | `apps/api/**`, `packages/**` | API code or shared package changes |
| web | `apps/web/**`, `packages/**` | Web code or shared package changes |

## Manual Deployment

If needed, you can manually trigger a deployment:

```bash
# Link to project
railway link -p "Open Sunsama"

# Deploy API
railway service api
railway up

# Deploy Web
railway service web
railway up
```

## Domains

Generate Railway domains for each service:

```bash
railway service api && railway domain
railway service web && railway domain
```

Or add custom domains in Railway Dashboard → Service → Settings → Domains.

## Troubleshooting

### Build Fails
1. Check build logs in Railway Dashboard
2. Verify Dockerfile paths are correct
3. Ensure all workspace packages are copied in Dockerfile

### Service Won't Start
1. Check deploy logs for errors
2. Verify environment variables are set
3. Check health check endpoint returns 200

### Database Connection Fails
1. Use internal URL (`.railway.internal`)
2. Verify DATABASE_URL is set in API service
3. Check Postgres service is running

## Internal URLs (Avoid Egress Fees)

Always use Railway internal URLs for service-to-service communication:

| Service | Internal URL |
|---------|--------------|
| Postgres | `postgres.railway.internal:5432` |
| API | `api.railway.internal:3001` |
| Storage | Use Railway's injected `AWS_*` variables |
