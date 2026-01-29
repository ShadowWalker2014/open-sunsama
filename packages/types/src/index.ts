/**
 * Chronoflow Shared Types Package
 * 
 * This package contains all shared TypeScript type definitions used across
 * the Chronoflow application, including API types, domain models, and utility types.
 * 
 * @packageDocumentation
 * @module @chronoflow/types
 */

// Common/utility types
export type {
  Brand,
  UserId,
  ProjectId,
  TaskId,
  TimeEntryId,
  Timestamp,
  BaseEntity,
  PaginationParams,
  Result,
  AsyncResult,
} from './common.js';

// Note: PaginatedResponse is exported from api.js with more detailed fields
// The common.js version is kept for backwards compatibility

// User types
export type {
  User,
  CreateUserInput,
  LoginInput,
  AuthResponse,
  UpdateUserInput,
  ChangePasswordInput,
  PublicUserProfile,
} from './user.js';

// Task types
export type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTasksInput,
  MoveTaskInput,
  TaskFilterInput,
  TaskStats,
  TaskWithMeta,
} from './task.js';

// Time block types
export type {
  TimeBlock,
  CreateTimeBlockInput,
  UpdateTimeBlockInput,
  TimeBlockFilterInput,
  TimeBlockWithTask,
  QuickScheduleInput,
  TimeBlockSummary,
  TimeBlockConflict,
  TimeBlockValidation,
} from './time-block.js';

// API key types
export type {
  ApiKey,
  ApiKeyScope,
  CreateApiKeyInput,
  CreateApiKeyResponse,
  UpdateApiKeyInput,
  ApiKeyFilterInput,
  ApiKeyWithStats,
  ApiKeyUsageRecord,
  ApiKeyUsageSummary,
  ApiKeyConfig,
} from './api-key.js';

// API types
export type {
  ApiError,
  ApiErrorCode,
  PaginatedResponse,
  PaginationMeta,
  PaginationInput,
  SortDirection,
  SortInput,
  SuccessResponse,
  DataResponse,
  ListResponse,
  FilterOperator,
  FilterCondition,
  DateRangeFilter,
  QueryParams,
  RequestContext,
  BatchResult,
  HealthCheckResponse,
  RateLimitInfo,
  HttpMethod,
  ApiEndpoint,
  ApiResponse,
  ApiMeta,
} from './api.js';
