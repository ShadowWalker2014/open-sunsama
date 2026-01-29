/**
 * Tasks API methods
 * @module @chronoflow/api-client/tasks
 */

import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  ReorderTasksInput,
  TaskFilterInput,
  TaskStats,
} from "@chronoflow/types";
import type { ChronoflowClient, RequestOptions } from "./client.js";

/**
 * Tasks API interface
 */
export interface TasksApi {
  /**
   * List tasks with optional filters
   * @param filters Optional filter criteria
   * @returns Array of tasks matching the filters
   */
  list(filters?: TaskFilterInput, options?: RequestOptions): Promise<Task[]>;

  /**
   * Create a new task
   * @param input Task creation data
   * @returns The created task
   */
  create(input: CreateTaskInput, options?: RequestOptions): Promise<Task>;

  /**
   * Get a task by ID
   * @param id Task ID
   * @returns The task data
   */
  get(id: string, options?: RequestOptions): Promise<Task>;

  /**
   * Update a task
   * @param id Task ID
   * @param input Fields to update
   * @returns The updated task
   */
  update(
    id: string,
    input: UpdateTaskInput,
    options?: RequestOptions
  ): Promise<Task>;

  /**
   * Delete a task
   * @param id Task ID
   */
  delete(id: string, options?: RequestOptions): Promise<void>;

  /**
   * Reorder tasks within a specific date
   * @param input Reorder data with date and task IDs in order
   */
  reorder(input: ReorderTasksInput, options?: RequestOptions): Promise<void>;

  /**
   * Mark a task as complete
   * @param id Task ID
   * @returns The updated task
   */
  complete(id: string, options?: RequestOptions): Promise<Task>;

  /**
   * Mark a task as incomplete
   * @param id Task ID
   * @returns The updated task
   */
  uncomplete(id: string, options?: RequestOptions): Promise<Task>;

  /**
   * Get task statistics
   * @param filters Optional filter criteria
   * @returns Task statistics
   */
  getStats(filters?: TaskFilterInput, options?: RequestOptions): Promise<TaskStats>;

  /**
   * Batch create multiple tasks
   * @param inputs Array of task creation data
   * @returns Array of created tasks
   */
  batchCreate(
    inputs: CreateTaskInput[],
    options?: RequestOptions
  ): Promise<Task[]>;

  /**
   * Batch update multiple tasks
   * @param updates Array of task IDs and their update data
   * @returns Array of updated tasks
   */
  batchUpdate(
    updates: Array<{ id: string; input: UpdateTaskInput }>,
    options?: RequestOptions
  ): Promise<Task[]>;

  /**
   * Batch delete multiple tasks
   * @param ids Array of task IDs to delete
   */
  batchDelete(ids: string[], options?: RequestOptions): Promise<void>;
}

/**
 * Convert TaskFilterInput to query parameters
 * Maps frontend filter names to API query parameter names
 */
function filtersToSearchParams(
  filters?: TaskFilterInput
): Record<string, string | number | boolean | undefined> {
  if (!filters) return {};

  return {
    // API uses 'date' for single date filter
    date: filters.scheduledDate ?? undefined,
    // API uses 'from' and 'to' for date range
    from: filters.scheduledDateFrom,
    to: filters.scheduledDateTo,
    // API uses string 'true'/'false' for completed filter
    completed: filters.completed !== undefined ? String(filters.completed) : undefined,
    // API uses 'backlog' for unscheduled tasks
    backlog: filters.backlog !== undefined ? String(filters.backlog) : undefined,
    // Sort by field
    sortBy: filters.sortBy,
  };
}

// API response wrapper type
interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
}

/**
 * Create tasks API methods bound to a client
 * @param client The Chronoflow client instance
 * @returns Tasks API methods
 */
export function createTasksApi(client: ChronoflowClient): TasksApi {
  return {
    async list(
      filters?: TaskFilterInput,
      options?: RequestOptions
    ): Promise<Task[]> {
      const searchParams = filtersToSearchParams(filters);
      const response = await client.get<ApiResponseWrapper<Task[]>>("tasks", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams },
      });
      return response.data;
    },

    async create(
      input: CreateTaskInput,
      options?: RequestOptions
    ): Promise<Task> {
      const response = await client.post<ApiResponseWrapper<Task>>("tasks", input, options);
      return response.data;
    },

    async get(id: string, options?: RequestOptions): Promise<Task> {
      const response = await client.get<ApiResponseWrapper<Task>>(`tasks/${id}`, options);
      return response.data;
    },

    async update(
      id: string,
      input: UpdateTaskInput,
      options?: RequestOptions
    ): Promise<Task> {
      const response = await client.patch<ApiResponseWrapper<Task>>(`tasks/${id}`, input, options);
      return response.data;
    },

    async delete(id: string, options?: RequestOptions): Promise<void> {
      await client.delete<ApiResponseWrapper<void>>(`tasks/${id}`, options);
    },

    async reorder(
      input: ReorderTasksInput,
      options?: RequestOptions
    ): Promise<void> {
      await client.post<ApiResponseWrapper<void>>("tasks/reorder", input, options);
    },

    async complete(id: string, options?: RequestOptions): Promise<Task> {
      const response = await client.post<ApiResponseWrapper<Task>>(`tasks/${id}/complete`, undefined, options);
      return response.data;
    },

    async uncomplete(id: string, options?: RequestOptions): Promise<Task> {
      const response = await client.post<ApiResponseWrapper<Task>>(`tasks/${id}/uncomplete`, undefined, options);
      return response.data;
    },

    async getStats(
      filters?: TaskFilterInput,
      options?: RequestOptions
    ): Promise<TaskStats> {
      const searchParams = filtersToSearchParams(filters);
      const response = await client.get<ApiResponseWrapper<TaskStats>>("tasks/stats", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams },
      });
      return response.data;
    },

    async batchCreate(
      inputs: CreateTaskInput[],
      options?: RequestOptions
    ): Promise<Task[]> {
      const response = await client.post<ApiResponseWrapper<Task[]>>("tasks/batch", { tasks: inputs }, options);
      return response.data;
    },

    async batchUpdate(
      updates: Array<{ id: string; input: UpdateTaskInput }>,
      options?: RequestOptions
    ): Promise<Task[]> {
      const response = await client.patch<ApiResponseWrapper<Task[]>>("tasks/batch", { updates }, options);
      return response.data;
    },

    async batchDelete(ids: string[], options?: RequestOptions): Promise<void> {
      await client.delete<ApiResponseWrapper<void>>("tasks/batch", {
        ...options,
        searchParams: { ...options?.searchParams, ids: ids.join(",") },
      });
    },
  };
}
