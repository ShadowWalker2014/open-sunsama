/**
 * Task Series (Recurring Tasks) API client module
 */
import type {
  TaskSeriesWithMeta,
  CreateTaskSeriesInput,
  UpdateTaskSeriesInput,
  TaskSeriesFilterInput,
  CreateTaskSeriesResponse,
  Task,
} from "@open-sunsama/types";
import type { OpenSunsamaClient, RequestOptions } from "./client.js";

/**
 * API response wrappers
 */
interface ApiResponse<T> {
  success: boolean;
  data: T;
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T;
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Task Series list response with metadata
 */
export interface TaskSeriesListResponse {
  data: TaskSeriesWithMeta[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Task instances list response
 */
export interface TaskInstancesResponse {
  data: Task[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Delete instances response
 */
export interface DeleteInstancesResponse {
  deletedCount: number;
}

/**
 * Sync instances response
 */
export interface SyncInstancesResponse {
  updatedCount: number;
}

/**
 * Convert filters to URL search params
 */
function filtersToSearchParams(
  filters?: TaskSeriesFilterInput
): Record<string, string> {
  if (!filters) return {};
  const params: Record<string, string> = {};

  if (filters.isActive !== undefined)
    params.isActive = String(filters.isActive);
  if (filters.recurrenceType) params.recurrenceType = filters.recurrenceType;
  if (filters.titleSearch) params.titleSearch = filters.titleSearch;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);

  return params;
}

/**
 * Task Series API interface
 */
export interface TaskSeriesApi {
  /**
   * List all task series (routines) for the current user
   */
  list(
    filters?: TaskSeriesFilterInput,
    options?: RequestOptions
  ): Promise<TaskSeriesListResponse>;

  /**
   * Get a single task series by ID
   */
  get(id: string, options?: RequestOptions): Promise<TaskSeriesWithMeta>;

  /**
   * Create a new task series (recurring task)
   * Creates both the series and the first task instance
   */
  create(
    input: CreateTaskSeriesInput,
    options?: RequestOptions
  ): Promise<CreateTaskSeriesResponse>;

  /**
   * Update a task series
   */
  update(
    id: string,
    input: UpdateTaskSeriesInput,
    options?: RequestOptions
  ): Promise<TaskSeriesWithMeta>;

  /**
   * Delete a task series (stop repeating)
   */
  delete(id: string, options?: RequestOptions): Promise<void>;

  /**
   * Stop a task series from generating new instances
   */
  stop(id: string, options?: RequestOptions): Promise<void>;

  /**
   * Delete all incomplete instances and stop the series
   */
  deleteInstances(
    id: string,
    options?: RequestOptions
  ): Promise<DeleteInstancesResponse>;

  /**
   * Update all incomplete instances to match the series template
   */
  syncInstances(
    id: string,
    options?: RequestOptions
  ): Promise<SyncInstancesResponse>;

  /**
   * Get all task instances for a series
   */
  getInstances(
    id: string,
    filters?: { page?: number; limit?: number; completed?: boolean },
    options?: RequestOptions
  ): Promise<TaskInstancesResponse>;
}

/**
 * Create the Task Series API client
 */
export function createTaskSeriesApi(client: OpenSunsamaClient): TaskSeriesApi {
  return {
    async list(filters, options) {
      const response = await client.get<
        PaginatedResponse<TaskSeriesWithMeta[]>
      >("task-series", {
        ...options,
        searchParams: {
          ...options?.searchParams,
          ...filtersToSearchParams(filters),
        },
      });
      return { data: response.data, meta: response.meta };
    },

    async get(id, options) {
      const response = await client.get<ApiResponse<TaskSeriesWithMeta>>(
        `task-series/${id}`,
        options
      );
      return response.data;
    },

    async create(input, options) {
      const response = await client.post<ApiResponse<CreateTaskSeriesResponse>>(
        "task-series",
        input,
        options
      );
      return response.data;
    },

    async update(id, input, options) {
      const response = await client.patch<ApiResponse<TaskSeriesWithMeta>>(
        `task-series/${id}`,
        input,
        options
      );
      return response.data;
    },

    async delete(id, options) {
      await client.delete(`task-series/${id}`, options);
    },

    async stop(id, options) {
      await client.post<ApiResponse<{ message: string }>>(
        `task-series/${id}/stop`,
        {},
        options
      );
    },

    async deleteInstances(id, options) {
      const response = await client.post<ApiResponse<DeleteInstancesResponse>>(
        `task-series/${id}/delete-instances`,
        {},
        options
      );
      return response.data;
    },

    async syncInstances(id, options) {
      const response = await client.post<ApiResponse<SyncInstancesResponse>>(
        `task-series/${id}/sync-instances`,
        {},
        options
      );
      return response.data;
    },

    async getInstances(id, filters, options) {
      const searchParams: Record<string, string> = {};
      if (filters?.page) searchParams.page = String(filters.page);
      if (filters?.limit) searchParams.limit = String(filters.limit);
      if (filters?.completed !== undefined)
        searchParams.completed = String(filters.completed);

      const response = await client.get<PaginatedResponse<Task[]>>(
        `task-series/${id}/instances`,
        {
          ...options,
          searchParams: { ...options?.searchParams, ...searchParams },
        }
      );
      return { data: response.data, meta: response.meta };
    },
  };
}
