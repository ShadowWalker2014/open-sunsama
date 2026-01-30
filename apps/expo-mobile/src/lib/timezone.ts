/**
 * Timezone utilities for React Native/Expo
 * Uses expo-localization for reliable timezone detection
 * 
 * Note: expo-localization must be installed via:
 * npx expo install expo-localization
 */

// Define the shape of the Localization module we need
interface LocalizationModule {
  getCalendars(): Array<{ timeZone?: string | null }>;
}

// Dynamically import to handle cases where expo-localization may not be installed yet
let Localization: LocalizationModule | null = null;

try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  Localization = require('expo-localization') as LocalizationModule;
} catch {
  // expo-localization not available
}

/**
 * Get the device's current timezone
 * Falls back to UTC if detection fails
 */
export function getDeviceTimezone(): string {
  try {
    if (Localization) {
      // expo-localization provides the IANA timezone string
      const calendars = Localization.getCalendars();
      const timezone = calendars?.[0]?.timeZone;
      if (timezone) return timezone;
    }
    
    // Fallback: Try using Intl API (works on newer React Native versions)
    const intlTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (intlTimezone) return intlTimezone;
    
    return 'UTC';
  } catch {
    // Fallback to UTC if all methods fail
    return 'UTC';
  }
}

/**
 * Check if two timezone strings are equivalent
 * Handles cases like 'America/New_York' vs 'America/New_York'
 */
export function timezoneEquals(tz1: string | null | undefined, tz2: string | null | undefined): boolean {
  if (!tz1 || !tz2) return false;
  return tz1 === tz2;
}
