/**
 * OAuth state management service
 * Handles CSRF protection state for OAuth flows using database storage
 * This ensures state persists across server restarts and multiple instances
 */
import { randomBytes } from "crypto";
import { getDb, oauthStates, eq, lt } from "@open-sunsama/database";

export interface OAuthStateData {
  userId: string;
  provider: "google" | "outlook";
  createdAt: Date;
}

// State TTL: 10 minutes
const STATE_TTL_MS = 10 * 60 * 1000;

/**
 * Generate and store a new OAuth state in the database
 */
export async function createOAuthState(
  userId: string,
  provider: "google" | "outlook"
): Promise<string> {
  const state = randomBytes(32).toString("hex");
  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + STATE_TTL_MS);

  await db.insert(oauthStates).values({
    state,
    userId,
    provider,
    createdAt: now,
    expiresAt,
  });

  return state;
}

/**
 * Validate an OAuth state from the database
 * Returns the state data if valid, null if invalid or expired
 */
export async function validateOAuthState(
  state: string
): Promise<OAuthStateData | null> {
  const db = getDb();

  const [storedState] = await db
    .select()
    .from(oauthStates)
    .where(eq(oauthStates.state, state))
    .limit(1);

  if (!storedState) {
    return null;
  }

  // Check if expired
  if (new Date() > storedState.expiresAt) {
    // Clean up expired state
    await db.delete(oauthStates).where(eq(oauthStates.id, storedState.id));
    return null;
  }

  return {
    userId: storedState.userId,
    provider: storedState.provider as "google" | "outlook",
    createdAt: storedState.createdAt,
  };
}

/**
 * Delete a used OAuth state from the database
 */
export async function deleteOAuthState(state: string): Promise<void> {
  const db = getDb();
  await db.delete(oauthStates).where(eq(oauthStates.state, state));
}

/**
 * Check if state provider matches expected provider
 */
export function verifyStateProvider(
  storedState: OAuthStateData,
  expectedProvider: "google" | "outlook"
): boolean {
  return storedState.provider === expectedProvider;
}

/**
 * Clean up expired OAuth states from the database
 * Called periodically by a background job or on startup
 */
export async function cleanupExpiredStates(): Promise<number> {
  const db = getDb();
  const result = await db
    .delete(oauthStates)
    .where(lt(oauthStates.expiresAt, new Date()))
    .returning({ id: oauthStates.id });

  return result.length;
}

// Legacy exports for backwards compatibility (no-op for cleanup interval)
export function startStateCleanup(): void {
  // No-op - cleanup is now handled by the cleanupExpiredStates function
  // which should be called by a PG Boss job or similar
}

export function stopStateCleanup(): void {
  // No-op
}
