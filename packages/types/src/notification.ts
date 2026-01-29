/**
 * Notification-related type definitions for Chronoflow
 * @module @chronoflow/types/notification
 */

/**
 * Represents a user's notification preferences
 */
export interface NotificationPreferences {
  /** Unique identifier for the preferences record (UUID format) */
  id: string;

  /** User ID this preferences record belongs to */
  userId: string;

  /** Whether task reminders are enabled */
  taskRemindersEnabled: boolean;

  /** Minutes before a task to send reminder (5, 15, 30, 60, 120) */
  reminderTiming: number;

  /** Whether email notifications are enabled */
  emailNotificationsEnabled: boolean;

  /** Whether daily summary emails are enabled */
  dailySummaryEnabled: boolean;

  /** Whether browser push notifications are enabled */
  pushNotificationsEnabled: boolean;

  /** Timestamp when the preferences were created */
  createdAt: Date;

  /** Timestamp when the preferences were last updated */
  updatedAt: Date;
}

/**
 * Input data for updating notification preferences.
 * All fields are optional; only provided fields will be updated.
 */
export interface UpdateNotificationPreferencesInput {
  /** Enable/disable task reminders */
  taskRemindersEnabled?: boolean;

  /** Minutes before a task to send reminder */
  reminderTiming?: number;

  /** Enable/disable email notifications */
  emailNotificationsEnabled?: boolean;

  /** Enable/disable daily summary emails */
  dailySummaryEnabled?: boolean;

  /** Enable/disable browser push notifications */
  pushNotificationsEnabled?: boolean;
}

/**
 * Response when getting notification preferences
 * Returns default values if user has no saved preferences
 */
export interface NotificationPreferencesResponse {
  /** The user's notification preferences */
  preferences: NotificationPreferences;
}

/**
 * Reminder timing option
 */
export interface ReminderTimingOption {
  /** Value in minutes */
  value: number;
  /** Human-readable label */
  label: string;
}

/**
 * Available reminder timing options
 */
export const REMINDER_TIMING_OPTIONS: readonly ReminderTimingOption[] = [
  { value: 5, label: '5 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
] as const;
