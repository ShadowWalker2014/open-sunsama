/**
 * API-related type definitions for Chronoflow
 * @module @chronoflow/types/api
 */

/**
 * Standard API error response.
 * All API errors follow this consistent structure.
 */
export interface ApiError {
  /** Machine-readable error code (e.g., "VALIDATION_ERROR", "NOT_FOUND") */
  code: string;

  /** Human-readable error message */
  message: string;

  /** 
   * Additional error details.
   * May contain field-specific validation errors or other context.
   */
  details?: Record<string, unknown>;

  /** 
   * HTTP status code associated with this error.
   * Included for convenience when the error is embedded in a response body.
   */
  statusCode?: number;

  /** 
   * Unique identifier for this error instance.
   * Useful for debugging and support requests.
   */
  errorId?: string;

  /** 
   * Timestamp when the error occurred.
   * ISO 8601 format.
   */
  timestamp?: string;
}

/**
 * Standard error codes used throughout the API.
 */
export type ApiErrorCode =
  /** Request validation failed */
  | 'VALIDATION_ERROR'
  /** Authentication required but not provided */
  | 'UNAUTHORIZED'
  /** Authentication provided but insufficient permissions */
  | 'FORBIDDEN'
  /** Requested resource not found */
  | 'NOT_FOUND'
  /** Request conflicts with current state (e.g., duplicate entry) */
  | 'CONFLICT'
  /** Rate limit exceeded */
  | 'RATE_LIMITED'
  /** Internal server error */
  | 'INTERNAL_ERROR'
  /** Service temporarily unavailable */
  | 'SERVICE_UNAVAILABLE'
  /** Request timeout */
  | 'TIMEOUT'
  /** Invalid or expired token */
  | 'INVALID_TOKEN'
  /** Resource has been deleted */
  | 'GONE';

/**
 * Paginated response wrapper.
 * Used for list endpoints that support pagination.
 * @template T The type of items in the data array
 */
export interface PaginatedResponse<T> {
  /** Array of items for the current page */
  data: T[];

  /** Pagination metadata */
  pagination: PaginationMeta;
}

/**
 * Pagination metadata included in paginated responses.
 */
export interface PaginationMeta {
  /** Current page number (1-indexed) */
  page: number;

  /** Number of items per page */
  pageSize: number;

  /** Total number of items across all pages */
  totalItems: number;

  /** Total number of pages */
  totalPages: number;

  /** Whether there is a next page */
  hasNextPage: boolean;

  /** Whether there is a previous page */
  hasPreviousPage: boolean;
}

/**
 * Pagination input parameters for list endpoints.
 */
export interface PaginationInput {
  /** Page number to retrieve (1-indexed, default: 1) */
  page?: number;

  /** Number of items per page (default: 20, max: 100) */
  pageSize?: number;
}

/**
 * Sort direction for ordered queries.
 */
export type SortDirection = 'asc' | 'desc';

/**
 * Generic sort input for list endpoints.
 * @template T The type containing sortable fields
 */
export interface SortInput<T extends string = string> {
  /** Field to sort by */
  field: T;

  /** Sort direction */
  direction: SortDirection;
}

/**
 * Standard success response for operations that don't return data.
 */
export interface SuccessResponse {
  /** Whether the operation was successful */
  success: true;

  /** Optional message providing additional context */
  message?: string;
}

/**
 * Standard wrapper for single-item responses.
 * @template T The type of the data
 */
export interface DataResponse<T> {
  /** The response data */
  data: T;
}

/**
 * Standard wrapper for list responses without pagination.
 * @template T The type of items in the data array
 */
export interface ListResponse<T> {
  /** Array of items */
  data: T[];

  /** Total count of items */
  count: number;
}

/**
 * Query filter operators for advanced filtering.
 */
export type FilterOperator =
  /** Equal to */
  | 'eq'
  /** Not equal to */
  | 'neq'
  /** Greater than */
  | 'gt'
  /** Greater than or equal to */
  | 'gte'
  /** Less than */
  | 'lt'
  /** Less than or equal to */
  | 'lte'
  /** Value is in the provided array */
  | 'in'
  /** Value is not in the provided array */
  | 'notIn'
  /** String contains (case-insensitive) */
  | 'contains'
  /** String starts with */
  | 'startsWith'
  /** String ends with */
  | 'endsWith'
  /** Value is null */
  | 'isNull'
  /** Value is not null */
  | 'isNotNull';

/**
 * Generic filter condition for advanced queries.
 * @template T The value type
 */
export interface FilterCondition<T = unknown> {
  /** The filter operator */
  operator: FilterOperator;

  /** The value to compare against (not required for isNull/isNotNull) */
  value?: T;
}

/**
 * Date range filter for time-based queries.
 */
export interface DateRangeFilter {
  /** Start of the date range (inclusive) */
  from?: Date | string;

  /** End of the date range (inclusive) */
  to?: Date | string;
}

/**
 * Generic query parameters combining pagination, sorting, and filtering.
 * @template TFilter The filter type
 * @template TSort The sortable fields type
 */
export interface QueryParams<TFilter = unknown, TSort extends string = string> {
  /** Pagination parameters */
  pagination?: PaginationInput;

  /** Sort parameters */
  sort?: SortInput<TSort>;

  /** Filter parameters */
  filter?: TFilter;
}

/**
 * API request context available in handlers.
 * Contains information about the current request.
 */
export interface RequestContext {
  /** ID of the authenticated user (null if not authenticated) */
  userId: string | null;

  /** Unique identifier for this request (for tracing) */
  requestId: string;

  /** IP address of the request origin */
  ipAddress: string | null;

  /** User agent string from the request */
  userAgent: string | null;

  /** Timestamp when the request was received */
  timestamp: Date;

  /** 
   * API key ID if request was authenticated via API key.
   * null if authenticated via session/JWT or not authenticated.
   */
  apiKeyId: string | null;
}

/**
 * Batch operation result for bulk updates/deletes.
 * @template T The type of successfully processed items
 */
export interface BatchResult<T = unknown> {
  /** Number of items successfully processed */
  successCount: number;

  /** Number of items that failed to process */
  failureCount: number;

  /** Successfully processed items (if requested) */
  succeeded?: T[];

  /** Failed items with their error messages */
  failed?: { item: unknown; error: string }[];
}

/**
 * Health check response for monitoring endpoints.
 */
export interface HealthCheckResponse {
  /** Overall health status */
  status: 'healthy' | 'degraded' | 'unhealthy';

  /** Timestamp of the health check */
  timestamp: string;

  /** Version of the API */
  version: string;

  /** Individual service health checks */
  services: {
    /** Service name */
    name: string;

    /** Service health status */
    status: 'healthy' | 'unhealthy';

    /** Response time in milliseconds */
    responseTimeMs?: number;

    /** Optional error message if unhealthy */
    error?: string;
  }[];
}

/**
 * Rate limit information returned in response headers.
 */
export interface RateLimitInfo {
  /** Maximum requests allowed in the window */
  limit: number;

  /** Remaining requests in the current window */
  remaining: number;

  /** Timestamp when the window resets (Unix timestamp) */
  resetAt: number;

  /** Duration of the rate limit window in seconds */
  windowSeconds: number;
}

/**
 * HTTP methods
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * API endpoint definition
 * @template TRequest The request body type
 * @template TResponse The response body type
 * @template TParams The URL parameters type
 */
export interface ApiEndpoint<
  TRequest = unknown,
  TResponse = unknown,
  TParams = Record<string, string>,
> {
  /** HTTP method for this endpoint */
  method: HttpMethod;

  /** Path pattern (may include parameters like :id) */
  path: string;

  /** Request body type */
  request?: TRequest;

  /** Response body type */
  response?: TResponse;

  /** URL parameters type */
  params?: TParams;
}

/**
 * Standard API response wrapper (legacy support)
 * @template T The data type
 */
export interface ApiResponse<T> {
  /** Whether the operation was successful */
  success: boolean;

  /** The response data (on success) */
  data?: T;

  /** Error information (on failure) */
  error?: ApiError;

  /** Request metadata */
  meta?: ApiMeta;
}

/**
 * API metadata included in responses
 */
export interface ApiMeta {
  /** Unique identifier for this request */
  requestId: string;

  /** Timestamp of the response */
  timestamp: string;

  /** API version */
  version: string;
}
