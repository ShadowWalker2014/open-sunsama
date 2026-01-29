/**
 * Subtasks API methods
 * @module @chronoflow/api-client/subtasks
 */

import type {
  Subtask,
  CreateSubtaskInput,
  UpdateSubtaskInput,
} from "@chronoflow/types";
import type { ChronoflowClient, RequestOptions } from "./client.js";

/**
 * Subtasks API interface
 */
export interface SubtasksApi {
  /**
   * List all subtasks for a task
   * @param taskId Parent task ID
   * @returns Array of subtasks
   */
  list(taskId: string, options?: RequestOptions): Promise<Subtask[]>;

  /**
   * Create a new subtask
   * @param taskId Parent task ID
   * @param input Subtask creation data (title, optional position)
   * @returns The created subtask
   */
  create(
    taskId: string,
    input: Omit<CreateSubtaskInput, "taskId">,
    options?: RequestOptions
  ): Promise<Subtask>;

  /**
   * Update a subtask
   * @param taskId Parent task ID
   * @param subtaskId Subtask ID
   * @param input Fields to update
   * @returns The updated subtask
   */
  update(
    taskId: string,
    subtaskId: string,
    input: UpdateSubtaskInput,
    options?: RequestOptions
  ): Promise<Subtask>;

  /**
   * Delete a subtask
   * @param taskId Parent task ID
   * @param subtaskId Subtask ID
   */
  delete(taskId: string, subtaskId: string, options?: RequestOptions): Promise<void>;

  /**
   * Reorder subtasks within a task
   * @param taskId Parent task ID
   * @param subtaskIds Array of subtask IDs in desired order
   * @returns Updated subtasks array
   */
  reorder(taskId: string, subtaskIds: string[], options?: RequestOptions): Promise<Subtask[]>;

  /**
   * Toggle subtask completion status
   * @param taskId Parent task ID
   * @param subtaskId Subtask ID
   * @returns The updated subtask
   */
  toggle(taskId: string, subtaskId: string, options?: RequestOptions): Promise<Subtask>;
}

// API response wrapper type
interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
}

/**
 * Create subtasks API methods bound to a client
 * @param client The Chronoflow client instance
 * @returns Subtasks API methods
 */
export function createSubtasksApi(client: ChronoflowClient): SubtasksApi {
  return {
    async list(taskId: string, options?: RequestOptions): Promise<Subtask[]> {
      const response = await client.get<ApiResponseWrapper<Subtask[]>>(
        `tasks/${taskId}/subtasks`,
        options
      );
      return response.data;
    },

    async create(
      taskId: string,
      input: Omit<CreateSubtaskInput, "taskId">,
      options?: RequestOptions
    ): Promise<Subtask> {
      const response = await client.post<ApiResponseWrapper<Subtask>>(
        `tasks/${taskId}/subtasks`,
        input,
        options
      );
      return response.data;
    },

    async update(
      taskId: string,
      subtaskId: string,
      input: UpdateSubtaskInput,
      options?: RequestOptions
    ): Promise<Subtask> {
      const response = await client.patch<ApiResponseWrapper<Subtask>>(
        `tasks/${taskId}/subtasks/${subtaskId}`,
        input,
        options
      );
      return response.data;
    },

    async delete(
      taskId: string,
      subtaskId: string,
      options?: RequestOptions
    ): Promise<void> {
      await client.delete<ApiResponseWrapper<void>>(
        `tasks/${taskId}/subtasks/${subtaskId}`,
        options
      );
    },

    async reorder(
      taskId: string,
      subtaskIds: string[],
      options?: RequestOptions
    ): Promise<Subtask[]> {
      const response = await client.post<ApiResponseWrapper<Subtask[]>>(
        `tasks/${taskId}/subtasks/reorder`,
        { subtaskIds },
        options
      );
      return response.data;
    },

    async toggle(
      taskId: string,
      subtaskId: string,
      options?: RequestOptions
    ): Promise<Subtask> {
      // First get current state
      const subtasks = await this.list(taskId, options);
      const subtask = subtasks.find((s) => s.id === subtaskId);
      if (!subtask) {
        throw new Error(`Subtask ${subtaskId} not found`);
      }
      // Toggle completion status
      return this.update(taskId, subtaskId, { completed: !subtask.completed }, options);
    },
  };
}
