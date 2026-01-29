/**
 * Time Blocks API methods
 * @module @chronoflow/api-client/time-blocks
 */

import type {
  TimeBlock,
  CreateTimeBlockInput,
  UpdateTimeBlockInput,
  TimeBlockFilterInput,
  TimeBlockWithTask,
  QuickScheduleInput,
  TimeBlockSummary,
  TimeBlockConflict,
} from "@chronoflow/types";
import type { ChronoflowClient, RequestOptions } from "./client.js";

/**
 * Time Blocks API interface
 */
export interface TimeBlocksApi {
  /**
   * List time blocks with optional filters
   * @param filters Optional filter criteria
   * @returns Array of time blocks matching the filters
   */
  list(
    filters?: TimeBlockFilterInput,
    options?: RequestOptions
  ): Promise<TimeBlock[]>;

  /**
   * List time blocks with their associated task data
   * @param filters Optional filter criteria
   * @returns Array of time blocks with task data
   */
  listWithTasks(
    filters?: TimeBlockFilterInput,
    options?: RequestOptions
  ): Promise<TimeBlockWithTask[]>;

  /**
   * Create a new time block
   * @param input Time block creation data
   * @returns The created time block
   */
  create(
    input: CreateTimeBlockInput,
    options?: RequestOptions
  ): Promise<TimeBlock>;

  /**
   * Get a time block by ID
   * @param id Time block ID
   * @returns The time block data
   */
  get(id: string, options?: RequestOptions): Promise<TimeBlock>;

  /**
   * Get a time block with its associated task
   * @param id Time block ID
   * @returns The time block with task data
   */
  getWithTask(id: string, options?: RequestOptions): Promise<TimeBlockWithTask>;

  /**
   * Update a time block
   * @param id Time block ID
   * @param input Fields to update
   * @returns The updated time block
   */
  update(
    id: string,
    input: UpdateTimeBlockInput,
    options?: RequestOptions
  ): Promise<TimeBlock>;

  /**
   * Delete a time block
   * @param id Time block ID
   */
  delete(id: string, options?: RequestOptions): Promise<void>;

  /**
   * Quick schedule a task as a time block
   * @param input Quick schedule data
   * @returns The created time block
   */
  quickSchedule(
    input: QuickScheduleInput,
    options?: RequestOptions
  ): Promise<TimeBlock>;

  /**
   * Get summary of time blocks for a period
   * @param startDate Start of the period (ISO date string)
   * @param endDate End of the period (ISO date string)
   * @returns Summary statistics
   */
  getSummary(
    startDate: string,
    endDate: string,
    options?: RequestOptions
  ): Promise<TimeBlockSummary>;

  /**
   * Check for conflicts with existing time blocks
   * @param startTime Start time to check
   * @param endTime End time to check
   * @param excludeId Optional ID to exclude (for updates)
   * @returns Array of conflicting time blocks
   */
  checkConflicts(
    startTime: Date | string,
    endTime: Date | string,
    excludeId?: string,
    options?: RequestOptions
  ): Promise<TimeBlockConflict[]>;

  /**
   * Batch create multiple time blocks
   * @param inputs Array of time block creation data
   * @returns Array of created time blocks
   */
  batchCreate(
    inputs: CreateTimeBlockInput[],
    options?: RequestOptions
  ): Promise<TimeBlock[]>;

  /**
   * Batch update multiple time blocks
   * @param updates Array of time block IDs and their update data
   * @returns Array of updated time blocks
   */
  batchUpdate(
    updates: Array<{ id: string; input: UpdateTimeBlockInput }>,
    options?: RequestOptions
  ): Promise<TimeBlock[]>;

  /**
   * Batch delete multiple time blocks
   * @param ids Array of time block IDs to delete
   */
  batchDelete(ids: string[], options?: RequestOptions): Promise<void>;
}

/**
 * Convert TimeBlockFilterInput to query parameters
 */
function filtersToSearchParams(
  filters?: TimeBlockFilterInput
): Record<string, string | number | boolean | undefined> {
  if (!filters) return {};

  return {
    date: filters.date,
    startTimeFrom:
      filters.startTimeFrom instanceof Date
        ? filters.startTimeFrom.toISOString()
        : filters.startTimeFrom,
    startTimeTo:
      filters.startTimeTo instanceof Date
        ? filters.startTimeTo.toISOString()
        : filters.startTimeTo,
    taskId: filters.taskId,
    unassignedOnly: filters.unassignedOnly,
  };
}

/**
 * Create time blocks API methods bound to a client
 * @param client The Chronoflow client instance
 * @returns Time blocks API methods
 */
export function createTimeBlocksApi(client: ChronoflowClient): TimeBlocksApi {
  return {
    async list(
      filters?: TimeBlockFilterInput,
      options?: RequestOptions
    ): Promise<TimeBlock[]> {
      const searchParams = filtersToSearchParams(filters);
      return client.get<TimeBlock[]>("time-blocks", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams },
      });
    },

    async listWithTasks(
      filters?: TimeBlockFilterInput,
      options?: RequestOptions
    ): Promise<TimeBlockWithTask[]> {
      const searchParams = filtersToSearchParams(filters);
      return client.get<TimeBlockWithTask[]>("time-blocks", {
        ...options,
        searchParams: {
          ...options?.searchParams,
          ...searchParams,
          includeTasks: true,
        },
      });
    },

    async create(
      input: CreateTimeBlockInput,
      options?: RequestOptions
    ): Promise<TimeBlock> {
      // Serialize dates to ISO strings
      const payload = {
        ...input,
        startTime:
          input.startTime instanceof Date
            ? input.startTime.toISOString()
            : input.startTime,
        endTime:
          input.endTime instanceof Date
            ? input.endTime.toISOString()
            : input.endTime,
      };
      return client.post<TimeBlock>("time-blocks", payload, options);
    },

    async get(id: string, options?: RequestOptions): Promise<TimeBlock> {
      return client.get<TimeBlock>(`time-blocks/${id}`, options);
    },

    async getWithTask(
      id: string,
      options?: RequestOptions
    ): Promise<TimeBlockWithTask> {
      return client.get<TimeBlockWithTask>(`time-blocks/${id}`, {
        ...options,
        searchParams: { ...options?.searchParams, includeTask: true },
      });
    },

    async update(
      id: string,
      input: UpdateTimeBlockInput,
      options?: RequestOptions
    ): Promise<TimeBlock> {
      // Serialize dates to ISO strings
      const payload = {
        ...input,
        startTime:
          input.startTime instanceof Date
            ? input.startTime.toISOString()
            : input.startTime,
        endTime:
          input.endTime instanceof Date
            ? input.endTime.toISOString()
            : input.endTime,
      };
      return client.patch<TimeBlock>(`time-blocks/${id}`, payload, options);
    },

    async delete(id: string, options?: RequestOptions): Promise<void> {
      return client.delete<void>(`time-blocks/${id}`, options);
    },

    async quickSchedule(
      input: QuickScheduleInput,
      options?: RequestOptions
    ): Promise<TimeBlock> {
      const payload = {
        ...input,
        startTime:
          input.startTime instanceof Date
            ? input.startTime.toISOString()
            : input.startTime,
      };
      return client.post<TimeBlock>(
        "time-blocks/quick-schedule",
        payload,
        options
      );
    },

    async getSummary(
      startDate: string,
      endDate: string,
      options?: RequestOptions
    ): Promise<TimeBlockSummary> {
      return client.get<TimeBlockSummary>("time-blocks/summary", {
        ...options,
        searchParams: {
          ...options?.searchParams,
          startDate,
          endDate,
        },
      });
    },

    async checkConflicts(
      startTime: Date | string,
      endTime: Date | string,
      excludeId?: string,
      options?: RequestOptions
    ): Promise<TimeBlockConflict[]> {
      return client.get<TimeBlockConflict[]>("time-blocks/conflicts", {
        ...options,
        searchParams: {
          ...options?.searchParams,
          startTime:
            startTime instanceof Date ? startTime.toISOString() : startTime,
          endTime: endTime instanceof Date ? endTime.toISOString() : endTime,
          excludeId,
        },
      });
    },

    async batchCreate(
      inputs: CreateTimeBlockInput[],
      options?: RequestOptions
    ): Promise<TimeBlock[]> {
      const timeBlocks = inputs.map((input) => ({
        ...input,
        startTime:
          input.startTime instanceof Date
            ? input.startTime.toISOString()
            : input.startTime,
        endTime:
          input.endTime instanceof Date
            ? input.endTime.toISOString()
            : input.endTime,
      }));
      return client.post<TimeBlock[]>(
        "time-blocks/batch",
        { timeBlocks },
        options
      );
    },

    async batchUpdate(
      updates: Array<{ id: string; input: UpdateTimeBlockInput }>,
      options?: RequestOptions
    ): Promise<TimeBlock[]> {
      const serializedUpdates = updates.map(({ id, input }) => ({
        id,
        input: {
          ...input,
          startTime:
            input.startTime instanceof Date
              ? input.startTime.toISOString()
              : input.startTime,
          endTime:
            input.endTime instanceof Date
              ? input.endTime.toISOString()
              : input.endTime,
        },
      }));
      return client.patch<TimeBlock[]>(
        "time-blocks/batch",
        { updates: serializedUpdates },
        options
      );
    },

    async batchDelete(ids: string[], options?: RequestOptions): Promise<void> {
      return client.delete<void>("time-blocks/batch", {
        ...options,
        searchParams: { ...options?.searchParams, ids: ids.join(",") },
      });
    },
  };
}
