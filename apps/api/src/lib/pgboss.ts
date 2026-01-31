/**
 * PG Boss client singleton for job queue management
 * Uses PostgreSQL for reliable, persistent job scheduling
 */
import * as PgBossModule from 'pg-boss';

// Handle ESM/CJS interop - pg-boss is CommonJS
const PgBoss = (PgBossModule as any).default || PgBossModule;
type PgBossInstance = InstanceType<typeof PgBoss>;

let bossPromise: Promise<PgBossInstance> | null = null;
let boss: PgBossInstance | null = null;

// Store initialization error for debugging
let initializationError: Error | null = null;

/**
 * Get the initialization error if PG Boss failed to start
 */
export function getPgBossInitError(): Error | null {
  return initializationError;
}

/**
 * Get or create the PG Boss instance
 * Lazily initializes and starts PG Boss on first call
 * Uses promise caching to prevent race conditions on concurrent calls
 */
export async function getPgBoss(): Promise<PgBossInstance> {
  // Return cached instance if already started
  if (boss) {
    return boss;
  }

  // Return pending initialization if in progress (prevents race condition)
  if (bossPromise) {
    return bossPromise;
  }

  // Start initialization
  bossPromise = (async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      const error = new Error('DATABASE_URL environment variable is required for PG Boss');
      initializationError = error;
      console.error('[PG Boss] DATABASE_URL not set:', error.message);
      throw error;
    }

    console.log('[PG Boss] Initializing with database URL (first 50 chars):', databaseUrl.substring(0, 50) + '...');

    const instance = new PgBoss({
      connectionString: databaseUrl,
      schema: 'pgboss', // Separate schema for PG Boss tables
      retryLimit: 3,
      retryDelay: 60, // 1 minute between retries
      retryBackoff: true,
      expireInSeconds: 3600, // 1 hour max job expiration
      archiveCompletedAfterSeconds: 43200, // Archive after 12 hours
      deleteAfterDays: 7, // Delete archived jobs after 7 days
    });

    instance.on('error', (error: Error) => {
      console.error('[PG Boss Error]', error);
      initializationError = error;
    });

    try {
      await instance.start();
      console.log('[PG Boss] Started successfully');
      
      boss = instance;
      initializationError = null;
      return instance;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      initializationError = err;
      console.error('[PG Boss] Failed to start:', err.message);
      throw err;
    }
  })();

  return bossPromise;
}

/**
 * Stop PG Boss gracefully
 * Call this during server shutdown
 */
export async function stopPgBoss(): Promise<void> {
  if (boss) {
    console.log('[PG Boss] Stopping...');
    await boss.stop({ graceful: true, timeout: 30000 });
    boss = null;
    bossPromise = null;
    console.log('[PG Boss] Stopped');
  }
}

/**
 * Check if PG Boss is initialized
 */
export function isPgBossRunning(): boolean {
  return boss !== null;
}

/**
 * Job names used throughout the application
 */
export const JOBS = {
  /** Runs every minute to check which timezones hit midnight */
  TIMEZONE_ROLLOVER_CHECK: 'timezone-rollover-check',
  /** Processes a batch of users for task rollover */
  USER_BATCH_ROLLOVER: 'user-batch-rollover',
  /** Runs every minute to check which timezones hit 6 AM for daily summary */
  DAILY_SUMMARY_CHECK: 'daily-summary-check',
  /** Sends daily summary email to individual user */
  SEND_DAILY_SUMMARY: 'send-daily-summary',
  /** Runs every minute to check for upcoming time blocks needing reminders */
  TASK_REMINDER_CHECK: 'task-reminder-check',
  /** Sends task reminder email for a specific time block */
  SEND_TASK_REMINDER: 'send-task-reminder',
} as const;

export type JobName = typeof JOBS[keyof typeof JOBS];
