/**
 * PG Boss client singleton for job queue management
 * Uses PostgreSQL for reliable, persistent job scheduling
 * Includes automatic recovery and health monitoring
 */
import * as PgBossModule from "pg-boss";

// pg-boss v12+ exports PgBoss as named export
const PgBoss =
  (PgBossModule as any).PgBoss || (PgBossModule as any).default || PgBossModule;
type PgBossType = InstanceType<typeof PgBoss>;

let bossPromise: Promise<PgBossType> | null = null;
let boss: PgBossType | null = null;

// Store initialization error for debugging
let initializationError: Error | null = null;

// Track if workers have been registered (to re-register on recovery)
let workersRegistered = false;
let workerRegistrationFn: (() => Promise<void>) | null = null;

// Watchdog interval
let watchdogInterval: ReturnType<typeof setInterval> | null = null;
const WATCHDOG_INTERVAL_MS = 60000; // Check every minute
const MAX_RECOVERY_ATTEMPTS = 5;
let recoveryAttempts = 0;

/**
 * Get the initialization error if PG Boss failed to start
 */
export function getPgBossInitError(): Error | null {
  return initializationError;
}

/**
 * Set the worker registration function for automatic recovery
 */
export function setWorkerRegistrationFn(fn: () => Promise<void>): void {
  workerRegistrationFn = fn;
}

/**
 * Start the watchdog that monitors PG Boss health and attempts recovery
 */
function startWatchdog(): void {
  if (watchdogInterval) return;

  watchdogInterval = setInterval(async () => {
    // If boss is null but we had workers registered, try to recover
    if (
      !boss &&
      workersRegistered &&
      recoveryAttempts < MAX_RECOVERY_ATTEMPTS
    ) {
      console.log(
        `[PG Boss Watchdog] Detected dead instance, attempting recovery (attempt ${recoveryAttempts + 1}/${MAX_RECOVERY_ATTEMPTS})...`
      );
      recoveryAttempts++;

      // Reset state for fresh initialization
      bossPromise = null;

      if (workerRegistrationFn) {
        await workerRegistrationFn().catch((err) => {
          console.error("[PG Boss Watchdog] Recovery failed:", err);
        });

        if (boss) {
          console.log("[PG Boss Watchdog] Recovery successful!");
          recoveryAttempts = 0; // Reset on success
        }
      }
    } else if (boss) {
      // Reset recovery attempts when healthy
      recoveryAttempts = 0;
    }
  }, WATCHDOG_INTERVAL_MS);

  console.log("[PG Boss Watchdog] Started");
}

/**
 * Get or create the PG Boss instance
 * Lazily initializes and starts PG Boss on first call
 * Uses promise caching to prevent race conditions on concurrent calls
 */
export async function getPgBoss(): Promise<PgBossType> {
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
      const error = new Error(
        "DATABASE_URL environment variable is required for PG Boss"
      );
      initializationError = error;
      console.error("[PG Boss] DATABASE_URL not set:", error.message);
      throw error;
    }

    console.log(
      "[PG Boss] Initializing with database URL (first 50 chars):",
      databaseUrl.substring(0, 50) + "..."
    );

    const instance = new PgBoss({
      connectionString: databaseUrl,
      schema: "pgboss", // Separate schema for PG Boss tables
      retryLimit: 3,
      retryDelay: 60, // 1 minute between retries
      retryBackoff: true,
      expireInSeconds: 3600, // 1 hour max job expiration
      archiveCompletedAfterSeconds: 43200, // Archive after 12 hours
      deleteAfterDays: 7, // Delete archived jobs after 7 days
      monitorStateIntervalSeconds: 30, // Monitor state every 30 seconds
    });

    // Handle PG Boss stopping unexpectedly
    instance.on("stopped", () => {
      console.error("[PG Boss] Stopped unexpectedly!");
      boss = null;
      bossPromise = null;
      // Watchdog will attempt recovery
    });

    instance.on("error", (error: Error) => {
      console.error("[PG Boss Error]", error);
      initializationError = error;
    });

    await instance.start();
    console.log("[PG Boss] Started successfully");

    boss = instance;
    initializationError = null;
    workersRegistered = true;

    // Start watchdog after successful initialization
    startWatchdog();

    return instance;
  })();

  return bossPromise;
}

/**
 * Stop PG Boss gracefully
 * Call this during server shutdown
 */
export async function stopPgBoss(): Promise<void> {
  // Stop watchdog first
  if (watchdogInterval) {
    clearInterval(watchdogInterval);
    watchdogInterval = null;
    console.log("[PG Boss Watchdog] Stopped");
  }

  if (boss) {
    console.log("[PG Boss] Stopping...");
    await boss.stop({ graceful: true, timeout: 30000 });
    boss = null;
    bossPromise = null;
    workersRegistered = false;
    console.log("[PG Boss] Stopped");
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
  TIMEZONE_ROLLOVER_CHECK: "timezone-rollover-check",
  /** Processes a batch of users for task rollover */
  USER_BATCH_ROLLOVER: "user-batch-rollover",
  /** Runs every minute to check which timezones hit 6 AM for daily summary */
  DAILY_SUMMARY_CHECK: "daily-summary-check",
  /** Sends daily summary email to individual user */
  SEND_DAILY_SUMMARY: "send-daily-summary",
  /** Runs every minute to check for upcoming time blocks needing reminders */
  TASK_REMINDER_CHECK: "task-reminder-check",
  /** Sends task reminder email for a specific time block */
  SEND_TASK_REMINDER: "send-task-reminder",
  /** Runs every 5 minutes to check for calendar accounts needing sync */
  CALENDAR_SYNC_CHECK: "calendar-sync-check",
  /** Syncs events for a single calendar account */
  SYNC_CALENDAR_ACCOUNT: "sync-calendar-account",
  /** Runs every minute to check for recurring tasks needing generation */
  RECURRING_TASK_CHECK: "recurring-task-check",
  /** Generates a single recurring task instance */
  GENERATE_RECURRING_TASK: "generate-recurring-task",
} as const;

export type JobName = (typeof JOBS)[keyof typeof JOBS];
