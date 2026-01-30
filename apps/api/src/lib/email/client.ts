/**
 * Resend email client singleton and theme utilities
 */
import { Resend } from 'resend';

// =============================================================================
// RESEND CLIENT SINGLETON
// =============================================================================

let resendClient: Resend | null = null;

/**
 * Get or create the Resend client singleton
 */
export function getResend(): Resend {
  if (!resendClient) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

// =============================================================================
// THEME COLORS
// =============================================================================

/**
 * Theme color mapping (colorTheme string -> hex color)
 */
export const THEME_COLOR_MAP: Record<string, string> = {
  ocean: '#3b82f6',
  forest: '#16a34a',
  sunset: '#f97316',
  lavender: '#8b5cf6',
  rose: '#ec4899',
  amber: '#eab308',
  slate: '#64748b',
  default: '#1f2937',
};

/**
 * Get hex color from theme name
 */
export function getThemeHexColor(colorTheme?: string): string {
  const defaultColor = '#3b82f6'; // ocean blue
  if (!colorTheme) return defaultColor;
  return THEME_COLOR_MAP[colorTheme] ?? defaultColor;
}

// =============================================================================
// EMAIL CONFIGURATION HELPERS
// =============================================================================

/**
 * Get the from email address
 */
export function getFromEmail(): string {
  return process.env.FROM_EMAIL || 'Open Sunsama <noreply@opensunsama.com>';
}

/**
 * Get the frontend URL
 */
export function getFrontendUrl(): string {
  return process.env.FRONTEND_URL || 'http://localhost:3000';
}
