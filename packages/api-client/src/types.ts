/**
 * API Client types
 * @module @open-sunsama/api-client/types
 */

/**
 * Custom fetch function type for dependency injection
 */
export type FetchFn = typeof fetch;

/**
 * Request options for API calls
 */
export interface RequestOptions {
  headers?: Record<string, string>;
  signal?: AbortSignal;
  timeout?: number;
  searchParams?: Record<string, string | number | boolean | undefined>;
}

/**
 * API response with typed data
 */
export interface ApiResponse<T> {
  data: T;
  status: number;
  headers: Headers;
}

/**
 * Pagination params for list endpoints
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
 * API client configuration (re-exported from client for convenience)
 */
export type { ApiClientConfig, OpenSunsamaClient, ChronoflowClient } from "./client.js";
