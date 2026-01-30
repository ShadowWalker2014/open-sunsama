/**
 * @open-sunsama/utils
 * Shared utilities for the Open Sunsama application
 */

// Constants
export {
  API_KEY_PREFIX,
  LEGACY_API_KEY_PREFIX,
  DEFAULT_TIMEZONE,
  ESTIMATED_MINS_OPTIONS,
  DATE_FORMAT,
  TIME_FORMAT,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
  API_KEY_LENGTH,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TIME_BLOCK_STATUSES,
  type TaskPriority,
  type TaskStatus,
  type TimeBlockStatus,
} from './constants.js';

// Date utilities
export {
  formatDate,
  parseDate,
  getDateRange,
  isToday,
  isSameDay,
  getDaysBetween,
  formatTime,
  parseTime,
  addMinutes,
  getStartOfDay,
  createDateTime,
} from './date.js';

// Validation schemas
export {
  emailSchema,
  passwordSchema,
  uuidSchema,
  dateSchema,
  timeSchema,
  taskPrioritySchema,
  taskStatusSchema,
  timeBlockStatusSchema,
  estimatedMinsSchema,
  taskSchema,
  createTaskSchema,
  updateTaskSchema,
  timeBlockSchema,
  createTimeBlockSchema,
  updateTimeBlockSchema,
  paginationSchema,
  type Email,
  type Password,
  type UUID,
  type DateString,
  type TimeString,
  type Task,
  type CreateTask,
  type UpdateTask,
  type TimeBlock,
  type CreateTimeBlock,
  type UpdateTimeBlock,
  type Pagination,
} from './validation.js';

// Error classes
export {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  InternalError,
  isAppError,
  isOperationalError,
} from './errors.js';

// API key utilities
export {
  generateApiKey,
  hashApiKey,
  validateApiKeyFormat,
  getApiKeyPrefix,
  extractApiKeyPrefix,
  maskApiKey,
  verifyApiKey,
  type GeneratedApiKey,
} from './api-key.js';
