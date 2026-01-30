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
} from './notification-preferences';
export type {
  NotificationPreferences,
  NewNotificationPreferences,
  UpdateNotificationPreferences,
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

// Re-export relation helpers for query building
export { relations } from 'drizzle-orm';
