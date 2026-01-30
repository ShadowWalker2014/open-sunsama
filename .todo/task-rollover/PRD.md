# Task Rollover Feature

## Problem

Users have incomplete tasks scheduled for previous days that remain stuck on those past dates. These tasks need to be automatically moved to "today" so users see their overdue work when they open the app. Currently:

1. Tasks scheduled for past dates stay on those dates forever unless manually moved
2. Users must manually identify and reschedule overdue tasks each day
3. Different users are in different timezones, so "midnight" (when rollover should occur) happens at different UTC times
4. The system has no background job infrastructure to handle this without user login

## Solution

Implement automatic task rollover using **PG Boss** (PostgreSQL-based job queue) that:

1. Runs a scheduler job every minute to check which timezones have reached midnight
2. Batch-updates all incomplete tasks from past dates to today for users in those timezones
3. Auto-detects and syncs user timezone from their device on app load
4. Operates entirely in the background without requiring user sessions

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        API Server (apps/api)                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐ │
│  │   Hono      │    │  PG Boss    │    │   Rollover Worker       │ │
│  │   Routes    │    │   Client    │────│   - processRollover()   │ │
│  └─────────────┘    └──────┬──────┘    │   - batchUpdateTasks()  │ │
│                            │           └─────────────────────────┘ │
└────────────────────────────┼────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │  ┌───────────┐  │
                    │  │ pgboss    │  │  (PG Boss tables)
                    │  │ schema    │  │
                    │  └───────────┘  │
                    │  ┌───────────┐  │
                    │  │  tasks    │  │  (Application tables)
                    │  │  users    │  │
                    │  └───────────┘  │
                    └─────────────────┘
```

## Technical Implementation

### 1. Database Changes

#### New Index for Performance (`packages/database/src/schema/tasks.ts`)

```typescript
// Add index for rollover queries - finding incomplete tasks by user
export const tasksUserScheduledIdx = index('tasks_user_scheduled_idx')
  .on(tasks.userId, tasks.scheduledDate)
  .where(isNull(tasks.completedAt));
```

#### New Table for Rollover Tracking (`packages/database/src/schema/rollover-log.ts`)

```typescript
export const rolloverLogs = pgTable('rollover_logs', {
  id: uuid('id').primaryKey().defaultRandom(),
  timezone: varchar('timezone', { length: 50 }).notNull(),
  rolloverDate: date('rollover_date').notNull(), // The date that was rolled over FROM
  usersProcessed: integer('users_processed').notNull().default(0),
  tasksRolledOver: integer('tasks_rolled_over').notNull().default(0),
  executedAt: timestamp('executed_at').defaultNow().notNull(),
  durationMs: integer('duration_ms'),
  status: varchar('status', { length: 20 }).notNull().default('completed'), // completed, failed, partial
  errorMessage: text('error_message'),
});

// Unique constraint to prevent duplicate rollover for same timezone+date
export const rolloverLogsUniqueIdx = uniqueIndex('rollover_logs_tz_date_idx')
  .on(rolloverLogs.timezone, rolloverLogs.rolloverDate);
```

### 2. PG Boss Setup

#### Install Dependencies (`apps/api/package.json`)

```json
{
  "dependencies": {
    "pg-boss": "^10.1.5",
    "date-fns-tz": "^3.2.0"
  }
}
```

#### PG Boss Client (`apps/api/src/lib/pgboss.ts`)

```typescript
import PgBoss from 'pg-boss';

let boss: PgBoss | null = null;

export async function getPgBoss(): Promise<PgBoss> {
  if (!boss) {
    boss = new PgBoss({
      connectionString: process.env.DATABASE_URL!,
      schema: 'pgboss', // Separate schema for PG Boss tables
      retryLimit: 3,
      retryDelay: 60, // 1 minute between retries
      retryBackoff: true,
      expireInHours: 24,
      archiveCompletedAfterSeconds: 86400, // Archive after 24 hours
      deleteAfterDays: 7, // Delete archived jobs after 7 days
    });

    boss.on('error', (error) => {
      console.error('[PG Boss Error]', error);
    });

    await boss.start();
  }
  return boss;
}

export async function stopPgBoss(): Promise<void> {
  if (boss) {
    await boss.stop({ graceful: true, timeout: 30000 });
    boss = null;
  }
}

// Job names
export const JOBS = {
  TIMEZONE_ROLLOVER_CHECK: 'timezone-rollover-check',
  USER_BATCH_ROLLOVER: 'user-batch-rollover',
} as const;
```

### 3. Rollover Worker (`apps/api/src/workers/rollover.ts`)

```typescript
import PgBoss from 'pg-boss';
import { getDb, eq, and, lt, isNull, sql, users, tasks } from '@open-sunsama/database';
import { formatInTimeZone, toZonedTime } from 'date-fns-tz';
import { format, subDays } from 'date-fns';
import { getPgBoss, JOBS } from '../lib/pgboss.js';
import { rolloverLogs } from '@open-sunsama/database/schema';

// All IANA timezones grouped by UTC offset
// We only need to check timezones at their midnight
const TIMEZONE_GROUPS = getTimezoneGroups(); // Helper to group timezones by current UTC offset

interface RolloverCheckPayload {
  // Empty - runs on schedule
}

interface UserBatchRolloverPayload {
  timezone: string;
  targetDate: string; // YYYY-MM-DD - the "today" date in this timezone
  userIds: string[];
  batchNumber: number;
}

const BATCH_SIZE = 100; // Users per batch

export async function registerRolloverWorkers(): Promise<void> {
  const boss = await getPgBoss();

  // Schedule the timezone check to run every minute
  await boss.schedule(JOBS.TIMEZONE_ROLLOVER_CHECK, '* * * * *', {}, {
    tz: 'UTC',
  });

  // Register the timezone check handler
  boss.work<RolloverCheckPayload>(
    JOBS.TIMEZONE_ROLLOVER_CHECK,
    { newJobCheckInterval: 60000 }, // Check for new jobs every minute
    processTimezoneRolloverCheck
  );

  // Register the batch rollover handler with concurrency
  boss.work<UserBatchRolloverPayload>(
    JOBS.USER_BATCH_ROLLOVER,
    { 
      teamSize: 5, // Process 5 batches concurrently
      teamConcurrency: 2,
    },
    processUserBatchRollover
  );

  console.log('[Rollover Worker] Registered and scheduled');
}

async function processTimezoneRolloverCheck(
  job: PgBoss.Job<RolloverCheckPayload>
): Promise<void> {
  const db = getDb();
  const boss = await getPgBoss();
  const now = new Date();
  
  // Find all unique timezones from users
  const userTimezones = await db
    .selectDistinct({ timezone: users.timezone })
    .from(users)
    .where(isNotNull(users.timezone));

  for (const { timezone } of userTimezones) {
    if (!timezone) continue;

    // Get the current time in this timezone
    const zonedNow = toZonedTime(now, timezone);
    const currentHour = zonedNow.getHours();
    const currentMinute = zonedNow.getMinutes();

    // Only trigger at midnight (00:00 - 00:01)
    if (currentHour !== 0 || currentMinute > 1) continue;

    // Check if we already ran rollover for this timezone today
    const todayInTz = formatInTimeZone(now, timezone, 'yyyy-MM-dd');
    const yesterdayInTz = formatInTimeZone(subDays(now, 1), timezone, 'yyyy-MM-dd');

    const existingLog = await db.query.rolloverLogs.findFirst({
      where: and(
        eq(rolloverLogs.timezone, timezone),
        eq(rolloverLogs.rolloverDate, yesterdayInTz)
      ),
    });

    if (existingLog) {
      // Already processed this timezone for this date
      continue;
    }

    // Get all users in this timezone
    const tzUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.timezone, timezone));

    if (tzUsers.length === 0) continue;

    // Create batches
    const batches = chunkArray(tzUsers.map(u => u.id), BATCH_SIZE);
    
    // Queue batch jobs
    for (let i = 0; i < batches.length; i++) {
      await boss.send(JOBS.USER_BATCH_ROLLOVER, {
        timezone,
        targetDate: todayInTz,
        userIds: batches[i],
        batchNumber: i + 1,
      } as UserBatchRolloverPayload);
    }

    console.log(`[Rollover] Queued ${batches.length} batches for timezone ${timezone}`);
  }
}

async function processUserBatchRollover(
  job: PgBoss.Job<UserBatchRolloverPayload>
): Promise<void> {
  const { timezone, targetDate, userIds, batchNumber } = job.data;
  const db = getDb();
  const startTime = Date.now();

  try {
    // Update all incomplete tasks scheduled before targetDate for these users
    // Move them to targetDate (today in their timezone)
    const result = await db
      .update(tasks)
      .set({
        scheduledDate: targetDate,
        updatedAt: new Date(),
      })
      .where(
        and(
          inArray(tasks.userId, userIds),
          lt(tasks.scheduledDate, targetDate),
          isNull(tasks.completedAt),
          isNotNull(tasks.scheduledDate) // Don't touch backlog tasks
        )
      )
      .returning({ id: tasks.id });

    const tasksRolledOver = result.length;
    const durationMs = Date.now() - startTime;

    // Log the rollover for the last batch
    if (batchNumber === Math.ceil(userIds.length / BATCH_SIZE)) {
      await db.insert(rolloverLogs).values({
        timezone,
        rolloverDate: format(subDays(new Date(targetDate), 1), 'yyyy-MM-dd'),
        usersProcessed: userIds.length,
        tasksRolledOver,
        durationMs,
        status: 'completed',
      }).onConflictDoUpdate({
        target: [rolloverLogs.timezone, rolloverLogs.rolloverDate],
        set: {
          usersProcessed: sql`${rolloverLogs.usersProcessed} + ${userIds.length}`,
          tasksRolledOver: sql`${rolloverLogs.tasksRolledOver} + ${tasksRolledOver}`,
        },
      });
    }

    console.log(
      `[Rollover] Batch ${batchNumber}: Rolled ${tasksRolledOver} tasks for ${userIds.length} users in ${timezone}`
    );
  } catch (error) {
    console.error(`[Rollover] Batch ${batchNumber} failed:`, error);
    throw error; // PG Boss will retry
  }
}

function chunkArray<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
```

### 4. API Server Integration (`apps/api/src/index.ts`)

```typescript
// Add at the top
import { registerRolloverWorkers } from './workers/rollover.js';
import { stopPgBoss } from './lib/pgboss.js';

// After app setup, before serve()
async function startServer() {
  // Initialize PG Boss and register workers
  await registerRolloverWorkers();
  
  // Start HTTP server
  serve({
    fetch: app.fetch,
    port,
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Shutting down...');
  await stopPgBoss();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Shutting down...');
  await stopPgBoss();
  process.exit(0);
});

startServer().catch(console.error);
```

### 5. Frontend Timezone Auto-Detection

#### New Hook (`apps/web/src/hooks/useTimezoneSync.ts`)

```typescript
import { useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

/**
 * Automatically syncs user's device timezone with the server.
 * Runs once on app load and when timezone changes.
 */
export function useTimezoneSync() {
  const { user, updateProfile } = useAuth();

  useEffect(() => {
    if (!user) return;

    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    
    // Only update if different from server
    if (deviceTimezone && deviceTimezone !== user.timezone) {
      updateProfile({ timezone: deviceTimezone });
    }
  }, [user?.id]); // Only run when user changes (login/logout)
}
```

#### Integration in App Root (`apps/web/src/routes/__root.tsx`)

```typescript
import { useTimezoneSync } from '@/hooks/useTimezoneSync';

function RootComponent() {
  useTimezoneSync(); // Add this near the top of the component
  // ... rest of component
}
```

#### Mobile App (`apps/mobile/src/lib/timezone.ts`)

```typescript
import * as Localization from 'expo-localization';

export function getDeviceTimezone(): string {
  return Localization.timezone || 'UTC';
}
```

### 6. Docker Configuration

#### Updated Dockerfile.api

```dockerfile
# Build stage
FROM oven/bun:1 as builder

WORKDIR /app

# Copy root package files, lockfile, and base tsconfig
COPY package.json bun.lock turbo.json tsconfig.base.json ./

# Copy ALL package.json files first (needed for workspace resolution)
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY apps/desktop/package.json ./apps/desktop/
COPY apps/mobile/package.json ./apps/mobile/
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/utils/package.json ./packages/utils/
COPY packages/api-client/package.json ./packages/api-client/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code for packages we need to build
COPY packages/database/ ./packages/database/
COPY packages/types/ ./packages/types/
COPY packages/utils/ ./packages/utils/
COPY apps/api/ ./apps/api/

# Build the packages and API
RUN bun run build --filter=@open-sunsama/database --filter=@open-sunsama/types --filter=@open-sunsama/utils --filter=@open-sunsama/api

# Production stage
FROM node:20-slim

WORKDIR /app

# Install pg-boss native dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy built bundle and dependencies
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/package.json ./
COPY --from=builder /app/node_modules ./node_modules

# Expose port
ENV PORT=3001
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://localhost:3001/health').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Start the server
CMD ["node", "dist/index.js"]
```

#### New docker-compose.yml (for local development)

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: opensunsama
      POSTGRES_PASSWORD: opensunsama
      POSTGRES_DB: opensunsama
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U opensunsama"]
      interval: 5s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    environment:
      DATABASE_URL: postgresql://opensunsama:opensunsama@postgres:5432/opensunsama
      JWT_SECRET: ${JWT_SECRET:-your-super-secret-jwt-key-min-32-chars}
      CORS_ORIGIN: http://localhost:3000
      PORT: 3001
    ports:
      - "3001:3001"
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

### 7. Job Scheduling Strategy

#### How Timezone-Based Scheduling Works

1. **Every minute**, the `timezone-rollover-check` job runs
2. For each unique timezone in the users table:
   - Calculate current time in that timezone
   - If it's between 00:00 and 00:01 (midnight window)
   - And we haven't already processed this timezone today
   - Queue batch jobs for all users in that timezone
3. **Batch jobs** process users in groups of 100
   - Single SQL UPDATE moves all overdue tasks to today
   - Concurrent processing (5 batches at a time)
   - Automatic retry on failure

#### Why This Approach?

| Approach | Pros | Cons |
|----------|------|------|
| **Per-user scheduled jobs** | Precise timing | Millions of jobs to manage |
| **Single nightly job** | Simple | Can't handle timezones |
| **Minute-by-minute check (chosen)** | Timezone-aware, scalable | Slight delay (up to 1 min) |

### 8. Edge Cases & Handling

#### DST Transitions

```typescript
// In rollover.ts, handle DST by checking if timezone is in DST transition
import { getTimezoneOffset } from 'date-fns-tz';

function isDSTTransitionDay(timezone: string): boolean {
  const now = new Date();
  const yesterday = subDays(now, 1);
  const tomorrow = addDays(now, 1);
  
  const offsetNow = getTimezoneOffset(timezone, now);
  const offsetYesterday = getTimezoneOffset(timezone, yesterday);
  const offsetTomorrow = getTimezoneOffset(timezone, tomorrow);
  
  return offsetNow !== offsetYesterday || offsetNow !== offsetTomorrow;
}
```

On DST transition days, we use a 2-hour window (23:00-01:00) instead of 1-minute to ensure we catch midnight even if the clock jumps.

#### User Changes Timezone

When a user's timezone changes (via auto-detect or manual), their overdue tasks are NOT immediately rolled over. They will be rolled over at the next midnight in their NEW timezone. This prevents:
- Double-rollover if moving to an earlier timezone
- Missed rollover if moving to a later timezone

#### Concurrent Rollover Attempts

The `rollover_logs` table with a unique constraint on `(timezone, rollover_date)` prevents duplicate processing. If a job tries to process an already-processed timezone+date combination, it gracefully skips.

#### Job Failure & Retry

PG Boss handles retry automatically with exponential backoff:
- 3 retry attempts
- 1-minute initial delay, increasing with each retry
- Failed jobs are logged and can be monitored

#### Server Restart During Rollover

PG Boss stores job state in PostgreSQL. If the server restarts:
- In-progress jobs will timeout and be retried
- Scheduled jobs will be picked up by the new instance
- No jobs are lost

### 9. Testing Strategy

#### Unit Tests (`apps/api/src/workers/__tests__/rollover.test.ts`)

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { processTimezoneRolloverCheck, processUserBatchRollover } from '../rollover';

describe('Task Rollover', () => {
  describe('processTimezoneRolloverCheck', () => {
    it('should queue batches for timezones at midnight', async () => {
      // Mock current time to be midnight in America/New_York
      vi.setSystemTime(new Date('2024-01-15T05:00:00Z')); // 00:00 EST
      // ... test implementation
    });

    it('should skip timezones not at midnight', async () => {
      vi.setSystemTime(new Date('2024-01-15T12:00:00Z')); // 07:00 EST
      // ... test implementation
    });

    it('should not process same timezone twice in a day', async () => {
      // Insert existing rollover log
      // Run check
      // Verify no new jobs queued
    });
  });

  describe('processUserBatchRollover', () => {
    it('should move incomplete tasks from past dates to today', async () => {
      // Create user with overdue tasks
      // Run batch rollover
      // Verify tasks moved to today
    });

    it('should not move completed tasks', async () => {
      // Create user with completed overdue tasks
      // Run batch rollover
      // Verify tasks unchanged
    });

    it('should not move backlog tasks (null scheduledDate)', async () => {
      // Create user with backlog tasks
      // Run batch rollover
      // Verify backlog tasks unchanged
    });

    it('should handle DST transition correctly', async () => {
      // Test with America/New_York on DST change date
    });
  });
});
```

#### Integration Tests

```typescript
describe('Rollover Integration', () => {
  it('should complete full rollover cycle', async () => {
    // Setup: Create users in multiple timezones with overdue tasks
    // Action: Trigger rollover check at appropriate time
    // Assert: All overdue tasks moved to today, logs created
  });

  it('should handle large user bases efficiently', async () => {
    // Setup: Create 10,000 users with tasks
    // Action: Run rollover
    // Assert: Completes within acceptable time, no memory issues
  });
});
```

#### Manual Testing Checklist

- [ ] Create tasks scheduled for yesterday, verify rollover at midnight
- [ ] Change timezone, verify tasks don't double-rollover
- [ ] Verify completed tasks are not rolled over
- [ ] Verify backlog tasks are not touched
- [ ] Test with users in multiple timezones
- [ ] Simulate server restart during rollover
- [ ] Test DST transition dates

### 10. Rollback Plan

#### Phase 1: Feature Flag Disable

```typescript
// In rollover.ts
const ROLLOVER_ENABLED = process.env.ROLLOVER_ENABLED !== 'false';

export async function registerRolloverWorkers(): Promise<void> {
  if (!ROLLOVER_ENABLED) {
    console.log('[Rollover Worker] Disabled via feature flag');
    return;
  }
  // ... rest of setup
}
```

To disable: Set `ROLLOVER_ENABLED=false` and restart servers.

#### Phase 2: Stop Scheduled Jobs

```bash
# Connect to database and clear scheduled jobs
psql $DATABASE_URL -c "DELETE FROM pgboss.schedule WHERE name = 'timezone-rollover-check';"
```

#### Phase 3: Full Rollback

1. Deploy previous version without rollover code
2. Drop new tables (if needed):
   ```sql
   DROP TABLE IF EXISTS rollover_logs;
   DROP INDEX IF EXISTS tasks_user_scheduled_idx;
   ```
3. PG Boss tables can be left in place (they're isolated in `pgboss` schema)

### 11. Monitoring & Success Metrics

#### Health Endpoint Enhancement

```typescript
// In apps/api/src/index.ts
app.get('/health', async (c) => {
  const boss = await getPgBoss();
  const queueStats = await boss.getQueueSize(JOBS.USER_BATCH_ROLLOVER);
  
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '0.0.0',
    jobs: {
      pendingRolloverBatches: queueStats,
    },
  });
});
```

#### Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Rollover job success rate | >99% | <95% |
| Avg tasks rolled per day | N/A (baseline) | 2x baseline (potential bug) |
| Rollover duration (per timezone) | <5 sec | >30 sec |
| Pending job queue size | <100 | >1000 |
| Failed jobs in 24h | 0 | >10 |

#### Logging

All rollover activity is logged:
- Timezone check triggers
- Batch starts/completions
- Tasks rolled over count
- Duration metrics
- Errors with full stack traces

Query rollover history:
```sql
SELECT timezone, rollover_date, users_processed, tasks_rolled_over, duration_ms, status
FROM rollover_logs
ORDER BY executed_at DESC
LIMIT 100;
```

### 12. Files to Create/Modify

#### New Files
| Path | Purpose |
|------|---------|
| `apps/api/src/lib/pgboss.ts` | PG Boss client singleton |
| `apps/api/src/workers/rollover.ts` | Rollover job handlers |
| `apps/api/src/workers/index.ts` | Worker registration entry point |
| `packages/database/src/schema/rollover-log.ts` | Rollover audit log table |
| `apps/web/src/hooks/useTimezoneSync.ts` | Auto-sync timezone hook |
| `docker-compose.yml` | Local development with PostgreSQL |

#### Modified Files
| Path | Change |
|------|--------|
| `apps/api/package.json` | Add pg-boss, date-fns-tz |
| `apps/api/src/index.ts` | Initialize PG Boss, register workers |
| `packages/database/src/schema/tasks.ts` | Add performance index |
| `packages/database/src/schema/index.ts` | Export rollover-log schema |
| `apps/web/src/routes/__root.tsx` | Add useTimezoneSync hook |
| `Dockerfile.api` | Add health check, native deps |

### 13. Migration Plan

#### Database Migration

```sql
-- Migration: Add rollover support
-- 1. Add index for faster rollover queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS tasks_user_scheduled_incomplete_idx 
ON tasks (user_id, scheduled_date) 
WHERE completed_at IS NULL;

-- 2. Create rollover logs table
CREATE TABLE IF NOT EXISTS rollover_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timezone VARCHAR(50) NOT NULL,
  rollover_date DATE NOT NULL,
  users_processed INTEGER NOT NULL DEFAULT 0,
  tasks_rolled_over INTEGER NOT NULL DEFAULT 0,
  executed_at TIMESTAMP NOT NULL DEFAULT NOW(),
  duration_ms INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'completed',
  error_message TEXT,
  CONSTRAINT rollover_logs_tz_date_unique UNIQUE (timezone, rollover_date)
);

-- 3. PG Boss will create its own tables in the 'pgboss' schema automatically
```

### 14. Performance Considerations

#### Scaling to Millions of Users

1. **Batch Processing**: Users processed in batches of 100
2. **Concurrent Workers**: 5 batches processed simultaneously
3. **Indexed Queries**: New index ensures fast task lookups
4. **Single UPDATE**: Each batch uses one SQL statement, not individual updates
5. **Timezone Grouping**: Only query users in timezones reaching midnight

#### Estimated Performance

| Users | Est. Rollover Time | Notes |
|-------|-------------------|-------|
| 1,000 | <1 second | Single batch |
| 10,000 | <10 seconds | 100 batches, 5 concurrent |
| 100,000 | <2 minutes | 1000 batches, 5 concurrent |
| 1,000,000 | <20 minutes | 10000 batches, spread across timezones |

Note: Rollover naturally spreads across 24 hours as different timezones reach midnight, so the load is distributed.
