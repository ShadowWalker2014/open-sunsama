/**
 * OAuth state management service
 * Handles CSRF protection state for OAuth flows
 */
import { randomBytes } from 'crypto';

export interface OAuthState {
  userId: string;
  provider: 'google' | 'outlook';
  createdAt: number;
}

// In-memory state store (TTL: 10 minutes)
// In production, use Redis with proper TTL
const stateStore = new Map<string, OAuthState>();
const STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

// Cleanup expired states periodically
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Start the cleanup interval for expired states
 */
export function startStateCleanup(): void {
  if (cleanupInterval) return;
  
  cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [state, data] of stateStore.entries()) {
      if (now - data.createdAt > STATE_TTL_MS) {
        stateStore.delete(state);
      }
    }
  }, 60 * 1000); // Run every minute
}

/**
 * Stop the cleanup interval
 */
export function stopStateCleanup(): void {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

/**
 * Generate and store a new OAuth state
 */
export function createOAuthState(userId: string, provider: 'google' | 'outlook'): string {
  const state = randomBytes(32).toString('hex');
  
  stateStore.set(state, {
    userId,
    provider,
    createdAt: Date.now(),
  });

  return state;
}

/**
 * Validate and consume an OAuth state
 * Returns the state data if valid, null if invalid or expired
 */
export function validateOAuthState(state: string): OAuthState | null {
  const storedState = stateStore.get(state);
  
  if (!storedState) {
    return null;
  }

  // Check if expired
  if (Date.now() - storedState.createdAt > STATE_TTL_MS) {
    stateStore.delete(state);
    return null;
  }

  return storedState;
}

/**
 * Delete a used OAuth state
 */
export function deleteOAuthState(state: string): void {
  stateStore.delete(state);
}

/**
 * Check if state provider matches expected provider
 */
export function verifyStateProvider(
  storedState: OAuthState,
  expectedProvider: 'google' | 'outlook'
): boolean {
  return storedState.provider === expectedProvider;
}

// Auto-start cleanup on module load
startStateCleanup();
