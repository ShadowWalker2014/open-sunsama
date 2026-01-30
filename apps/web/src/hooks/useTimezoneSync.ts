import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

/**
 * Automatically syncs user's device timezone with the server.
 * Runs once on app load and when the user changes.
 * 
 * This ensures task rollover happens at the correct local midnight
 * for each user, regardless of where they're accessing the app from.
 */
export function useTimezoneSync(): void {
  const { user, updateUser, isAuthenticated } = useAuth();
  const syncAttempted = useRef(false);

  useEffect(() => {
    // Only run if authenticated and we have a user
    if (!isAuthenticated || !user) {
      syncAttempted.current = false;
      return;
    }

    // Only attempt sync once per user session
    if (syncAttempted.current) {
      return;
    }

    // Get device timezone using the Intl API
    const deviceTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    // Only update if different from server
    if (deviceTimezone && deviceTimezone !== user.timezone) {
      syncAttempted.current = true;
      
      console.log(`[Timezone Sync] Updating timezone from ${user.timezone} to ${deviceTimezone}`);
      
      updateUser({ timezone: deviceTimezone }).catch((error) => {
        console.error('[Timezone Sync] Failed to update timezone:', error);
        // Reset flag so we can try again later
        syncAttempted.current = false;
      });
    } else {
      // Mark as attempted even if no update needed
      syncAttempted.current = true;
    }
  }, [user?.id, isAuthenticated]); // Only re-run when user changes
}

/**
 * Get the current device timezone
 * Useful for display purposes without triggering a sync
 */
export function getDeviceTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
