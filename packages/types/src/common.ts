// Common type definitions

/**
 * Branded type for type-safe IDs
 */
export type Brand<T, B extends string> = T & { readonly __brand: B };

/**
 * Common ID types
 */
export type UserId = Brand<string, "UserId">;
export type ProjectId = Brand<string, "ProjectId">;
export type TaskId = Brand<string, "TaskId">;
export type TimeEntryId = Brand<string, "TimeEntryId">;

/**
 * Timestamp type for consistent date handling
 */
export type Timestamp = string; // ISO 8601 format

/**
 * Base entity with common fields
 */
export interface BaseEntity {
  id: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    hasMore: boolean;
    nextCursor?: string;
  };
}

/**
 * Result type for operations that can fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Async result type
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;
