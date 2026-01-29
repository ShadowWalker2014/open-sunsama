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
 */
function filtersToSearchParams(
  filters?: TaskFilterInput
): Record<string, string | number | boolean | undefined> {
  if (!filters) return {};

  return {
    scheduledDate: filters.scheduledDate ?? undefined,
    scheduledDateFrom: filters.scheduledDateFrom,
    scheduledDateTo: filters.scheduledDateTo,
    completed: filters.completed,
    titleSearch: filters.titleSearch,
  };
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
      return client.get<Task[]>("tasks", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams },
      });
    },

    async create(
      input: CreateTaskInput,
      options?: RequestOptions
    ): Promise<Task> {
      return client.post<Task>("tasks", input, options);
    },

    async get(id: string, options?: RequestOptions): Promise<Task> {
      return client.get<Task>(`tasks/${id}`, options);
    },

    async update(
      id: string,
      input: UpdateTaskInput,
      options?: RequestOptions
    ): Promise<Task> {
      return client.patch<Task>(`tasks/${id}`, input, options);
    },

    async delete(id: string, options?: RequestOptions): Promise<void> {
      return client.delete<void>(`tasks/${id}`, options);
    },

    async reorder(
      input: ReorderTasksInput,
      options?: RequestOptions
    ): Promise<void> {
      return client.post<void>("tasks/reorder", input, options);
    },

    async complete(id: string, options?: RequestOptions): Promise<Task> {
      return client.post<Task>(`tasks/${id}/complete`, undefined, options);
    },

    async uncomplete(id: string, options?: RequestOptions): Promise<Task> {
      return client.post<Task>(`tasks/${id}/uncomplete`, undefined, options);
    },

    async getStats(
      filters?: TaskFilterInput,
      options?: RequestOptions
    ): Promise<TaskStats> {
      const searchParams = filtersToSearchParams(filters);
      return client.get<TaskStats>("tasks/stats", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams },
      });
    },

    async batchCreate(
      inputs: CreateTaskInput[],
      options?: RequestOptions
    ): Promise<Task[]> {
      return client.post<Task[]>("tasks/batch", { tasks: inputs }, options);
    },

    async batchUpdate(
      updates: Array<{ id: string; input: UpdateTaskInput }>,
      options?: RequestOptions
    ): Promise<Task[]> {
      return client.patch<Task[]>("tasks/batch", { updates }, options);
    },

    async batchDelete(ids: string[], options?: RequestOptions): Promise<void> {
      return client.delete<void>("tasks/batch", {
        ...options,
        searchParams: { ...options?.searchParams, ids: ids.join(",") },
      });
    },
  };
}
