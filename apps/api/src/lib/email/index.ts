/**
 * Email module - public API exports
 *
 * Unified email template system with Linear-style design:
 * - Clean, minimal, professional
 * - Consistent typography and spacing
 * - Theme color support for personalization
 */

// =============================================================================
// TYPES
// =============================================================================

export type { EmailTaskItem } from './builders';
export type { DailySummaryEmailOptions } from './daily-summary';
export type { TaskReminderEmailOptions } from './task-reminder';

// =============================================================================
// EMAIL SENDERS
// =============================================================================

export { sendPasswordResetEmail } from './password-reset';
export { sendDailySummaryEmail } from './daily-summary';
export { sendTaskReminderEmail } from './task-reminder';

// =============================================================================
// THEME UTILITIES
// =============================================================================

export { getThemeHexColor, THEME_COLOR_MAP } from './client';
