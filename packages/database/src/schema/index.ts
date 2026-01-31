// Schema exports
export { users, usersRelations, insertUserSchema, selectUserSchema } from './users';
export type { User, NewUser, UserPreferences } from './users';

export {
  tasks,
  tasksRelations,
  insertTaskSchema,
  selectTaskSchema,
  updateTaskSchema,
  TASK_PRIORITIES,
} from './tasks';
export type { Task, NewTask, UpdateTask, TaskPriority } from './tasks';

export {
  subtasks,
  subtasksRelations,
  insertSubtaskSchema,
  selectSubtaskSchema,
  updateSubtaskSchema,
} from './subtasks';
export type { Subtask, NewSubtask, UpdateSubtask } from './subtasks';

export {
  timeBlocks,
  timeBlocksRelations,
  insertTimeBlockSchema,
  selectTimeBlockSchema,
  updateTimeBlockSchema,
} from './time-blocks';
export type { TimeBlock, NewTimeBlock, UpdateTimeBlock } from './time-blocks';

export {
  apiKeys,
  apiKeysRelations,
  insertApiKeySchema,
  selectApiKeySchema,
  createApiKeySchema,
  API_KEY_SCOPES,
} from './api-keys';
export type { ApiKey, NewApiKey, CreateApiKeyInput, ApiKeyScope } from './api-keys';

export {
  notificationPreferences,
  notificationPreferencesRelations,
  insertNotificationPreferencesSchema,
  selectNotificationPreferencesSchema,
  updateNotificationPreferencesSchema,
  REMINDER_TIMING_OPTIONS,
  ROLLOVER_DESTINATION_OPTIONS,
  ROLLOVER_POSITION_OPTIONS,
} from './notification-preferences';
export type {
  NotificationPreferences,
  NewNotificationPreferences,
  UpdateNotificationPreferences,
  RolloverDestination,
  RolloverPosition,
} from './notification-preferences';

export {
  attachments,
  attachmentsRelations,
  insertAttachmentSchema,
  selectAttachmentSchema,
} from './attachments';
export type { Attachment, NewAttachment } from './attachments';

export {
  rolloverLogs,
  insertRolloverLogSchema,
  selectRolloverLogSchema,
} from './rollover-log';
export type { RolloverLog, NewRolloverLog } from './rollover-log';

export {
  pushSubscriptions,
  pushSubscriptionsRelations,
  insertPushSubscriptionSchema,
  selectPushSubscriptionSchema,
} from './push-subscriptions';
export type { PushSubscription, NewPushSubscription } from './push-subscriptions';

export {
  calendarAccounts,
  calendarAccountsRelations,
  insertCalendarAccountSchema,
  selectCalendarAccountSchema,
  updateCalendarAccountSchema,
  CALENDAR_PROVIDERS,
  SYNC_STATUS_OPTIONS,
} from './calendar-accounts';
export type {
  CalendarAccount,
  NewCalendarAccount,
  UpdateCalendarAccount,
  CalendarProvider,
  SyncStatus,
} from './calendar-accounts';

export {
  calendars,
  calendarsRelations,
  insertCalendarSchema,
  selectCalendarSchema,
  updateCalendarSchema,
} from './calendars';
export type { Calendar, NewCalendar, UpdateCalendar } from './calendars';

export {
  calendarEvents,
  calendarEventsRelations,
  insertCalendarEventSchema,
  selectCalendarEventSchema,
  updateCalendarEventSchema,
  EVENT_STATUS_OPTIONS,
  RESPONSE_STATUS_OPTIONS,
} from './calendar-events';
export type {
  CalendarEvent,
  NewCalendarEvent,
  UpdateCalendarEvent,
  EventStatus,
  ResponseStatus,
} from './calendar-events';

export {
  releases,
  insertReleaseSchema,
  selectReleaseSchema,
  updateReleaseSchema,
  RELEASE_PLATFORMS,
} from './releases';
export type { Release, NewRelease, UpdateRelease, ReleasePlatform } from './releases';

// Re-export relation helpers for query building
export { relations } from 'drizzle-orm';
