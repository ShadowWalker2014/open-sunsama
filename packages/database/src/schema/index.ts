// Schema exports
export { users, usersRelations, insertUserSchema, selectUserSchema } from './users';
export type { User, NewUser } from './users';

export {
  tasks,
  tasksRelations,
  insertTaskSchema,
  selectTaskSchema,
  updateTaskSchema,
} from './tasks';
export type { Task, NewTask, UpdateTask } from './tasks';

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
