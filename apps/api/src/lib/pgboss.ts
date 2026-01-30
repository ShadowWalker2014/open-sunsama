/**
 * PG Boss client singleton for job queue management
 * Uses PostgreSQL for reliable, persistent job scheduling
 */
import PgBoss from 'pg-boss';

let boss: PgBoss | null = null;

/**
 * Get or create the PG Boss instance
 * Lazily initializes and starts PG Boss on first call
 */
export async function getPgBoss(): Promise<PgBoss> {
  if (!boss) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      throw new Error('DATABASE_URL environment variable is required for PG Boss');
    }

    boss = new PgBoss({
      connectionString: databaseUrl,
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
    console.log('[PG Boss] Started successfully');
  }
  return boss;
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
