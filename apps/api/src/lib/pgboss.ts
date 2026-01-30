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
      throw new Error('DATABASE_URL environment variable is required for PG Boss');
    }

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
    });

    await instance.start();
    console.log('[PG Boss] Started successfully');
    
    boss = instance;
    return instance;
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
} as const;

export type JobName = typeof JOBS[keyof typeof JOBS];
