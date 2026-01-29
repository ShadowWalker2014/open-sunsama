/**
 * @open-sunsama/api-client
 * Typed API client for Open Sunsama
 *
 * @example
 * ```typescript
 * import { createOpenSunsamaClient } from '@open-sunsama/api-client';
 *
 * const client = createOpenSunsamaClient({
 *   baseUrl: 'https://api.opensunsama.app/v1',
 *   token: 'your-jwt-token',
 * });
 *
 * // Use the client directly
 * const tasks = await client.get<Task[]>('tasks');
 *
 * // Or use the typed API modules
 * import { createTasksApi } from '@open-sunsama/api-client';
 * const tasksApi = createTasksApi(client);
 * const tasks = await tasksApi.list({ completed: false });
 * ```
 *
 * @packageDocumentation
 * @module @open-sunsama/api-client
 */

// Client
import {
  createApiClient,
  createOpenSunsamaClient,
  OpenSunsamaClient,
  createChronoflowClient,
  ChronoflowClient,
  type ApiClientConfig,
  type RequestOptions,
  type KyInstance,
} from "./client.js";

export {
  createApiClient,
  createOpenSunsamaClient,
  OpenSunsamaClient,
  // Legacy aliases for backwards compatibility
  createChronoflowClient,
  ChronoflowClient,
  type ApiClientConfig,
  type RequestOptions,
  type KyInstance,
};

// Errors
export { ApiError, isApiError } from "./errors.js";

// Auth API
import { createAuthApi, type AuthApi } from "./auth.js";
export { createAuthApi, type AuthApi };

// Tasks API
import { createTasksApi, type TasksApi } from "./tasks.js";
export { createTasksApi, type TasksApi };

// Subtasks API
import { createSubtasksApi, type SubtasksApi } from "./subtasks.js";
export { createSubtasksApi, type SubtasksApi };

// Time Blocks API
import { createTimeBlocksApi, type TimeBlocksApi } from "./time-blocks.js";
export { createTimeBlocksApi, type TimeBlocksApi };

// API Keys API
import { createApiKeysApi, type ApiKeysApi } from "./api-keys.js";
export { createApiKeysApi, type ApiKeysApi };

// Notifications API
import { createNotificationsApi, type NotificationsApi } from "./notifications.js";
export { createNotificationsApi, type NotificationsApi };

// Types
export type {
  FetchFn,
  ApiResponse,
  PaginationParams,
  PaginatedResponse,
} from "./types.js";

// Re-export commonly used types from @open-sunsama/types for convenience
export type {
  // User types
  User,
  CreateUserInput,
  LoginInput,
  AuthResponse,
  UpdateUserInput,
  ChangePasswordInput,
  // Task types
  Task,
  TaskPriority,
  TaskSortBy,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTasksInput,
  TaskFilterInput,
  TaskStats,
  // Subtask types
  Subtask,
  CreateSubtaskInput,
  UpdateSubtaskInput,
  ReorderSubtasksInput,
  // Time block types
  TimeBlock,
  CreateTimeBlockInput,
  UpdateTimeBlockInput,
  TimeBlockFilterInput,
  TimeBlockWithTask,
  QuickScheduleInput,
  TimeBlockSummary,
  // API key types
  ApiKey,
  ApiKeyScope,
  CreateApiKeyInput,
  CreateApiKeyResponse,
  UpdateApiKeyInput,
  ApiKeyFilterInput,
  ApiKeyWithStats,
  // Notification types
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
} from "@open-sunsama/types";
export { REMINDER_TIMING_OPTIONS } from "@open-sunsama/types";

/**
 * Create a fully configured API client with all API modules
 *
 * @example
 * ```typescript
 * const api = createApi({
 *   baseUrl: 'https://api.opensunsama.app/v1',
 *   token: 'your-jwt-token',
 * });
 *
 * // Use the API
 * const user = await api.auth.getMe();
 * const tasks = await api.tasks.list();
 * const timeBlocks = await api.timeBlocks.list({ date: '2024-01-15' });
 * ```
 */
export function createApi(config: ApiClientConfig) {
  const client = createOpenSunsamaClient(config);

  return {
    /** The underlying HTTP client */
    client,
    /** Authentication API methods */
    auth: createAuthApi(client),
    /** Tasks API methods */
    tasks: createTasksApi(client),
    /** Subtasks API methods */
    subtasks: createSubtasksApi(client),
    /** Time blocks API methods */
    timeBlocks: createTimeBlocksApi(client),
    /** API keys API methods */
    apiKeys: createApiKeysApi(client),
    /** Notifications API methods */
    notifications: createNotificationsApi(client),
    /**
     * Update the authentication token
     */
    setToken: (token: string | undefined) => client.setToken(token),
    /**
     * Update the API key
     */
    setApiKey: (apiKey: string | undefined) => client.setApiKey(apiKey),
  };
}

/** Type of the API object returned by createApi */
export type OpenSunsamaApi = ReturnType<typeof createApi>;
// Legacy alias
export type ChronoflowApi = OpenSunsamaApi;
