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
 * Format a Date or string to HH:mm format for API
 */
function formatTimeForApi(time: Date | string): string {
  const date = time instanceof Date ? time : new Date(time);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Extract date in YYYY-MM-DD format from a Date or string
 */
function formatDateForApi(time: Date | string): string {
  const date = time instanceof Date ? time : new Date(time);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// API response wrapper type
interface ApiResponseWrapper<T> {
  success: boolean;
  data: T;
}

/**
 * Time Blocks API interface
 */
export interface TimeBlocksApi {
  list(filters?: TimeBlockFilterInput, options?: RequestOptions): Promise<TimeBlock[]>;
  listWithTasks(filters?: TimeBlockFilterInput, options?: RequestOptions): Promise<TimeBlockWithTask[]>;
  create(input: CreateTimeBlockInput, options?: RequestOptions): Promise<TimeBlock>;
  get(id: string, options?: RequestOptions): Promise<TimeBlock>;
  getWithTask(id: string, options?: RequestOptions): Promise<TimeBlockWithTask>;
  update(id: string, input: UpdateTimeBlockInput, options?: RequestOptions): Promise<TimeBlock>;
  delete(id: string, options?: RequestOptions): Promise<void>;
  quickSchedule(input: QuickScheduleInput, options?: RequestOptions): Promise<TimeBlock>;
  getSummary(startDate: string, endDate: string, options?: RequestOptions): Promise<TimeBlockSummary>;
  checkConflicts(startTime: Date | string, endTime: Date | string, excludeId?: string, options?: RequestOptions): Promise<TimeBlockConflict[]>;
  batchCreate(inputs: CreateTimeBlockInput[], options?: RequestOptions): Promise<TimeBlock[]>;
  batchUpdate(updates: Array<{ id: string; input: UpdateTimeBlockInput }>, options?: RequestOptions): Promise<TimeBlock[]>;
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
    startTimeFrom: filters.startTimeFrom instanceof Date ? filters.startTimeFrom.toISOString() : filters.startTimeFrom,
    startTimeTo: filters.startTimeTo instanceof Date ? filters.startTimeTo.toISOString() : filters.startTimeTo,
    taskId: filters.taskId,
    unassignedOnly: filters.unassignedOnly,
  };
}

/**
 * Create time blocks API methods bound to a client
 */
export function createTimeBlocksApi(client: ChronoflowClient): TimeBlocksApi {
  return {
    async list(filters?: TimeBlockFilterInput, options?: RequestOptions): Promise<TimeBlock[]> {
      const searchParams = filtersToSearchParams(filters);
      const response = await client.get<ApiResponseWrapper<TimeBlock[]>>("time-blocks", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams },
      });
      return response.data;
    },

    async listWithTasks(filters?: TimeBlockFilterInput, options?: RequestOptions): Promise<TimeBlockWithTask[]> {
      const searchParams = filtersToSearchParams(filters);
      const response = await client.get<ApiResponseWrapper<TimeBlockWithTask[]>>("time-blocks", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams, includeTasks: true },
      });
      return response.data;
    },

    async create(input: CreateTimeBlockInput, options?: RequestOptions): Promise<TimeBlock> {
      // Backend expects date in YYYY-MM-DD and times in HH:mm format
      const payload = {
        ...input,
        date: formatDateForApi(input.startTime),
        startTime: formatTimeForApi(input.startTime),
        endTime: formatTimeForApi(input.endTime),
      };
      const response = await client.post<ApiResponseWrapper<TimeBlock>>("time-blocks", payload, options);
      return response.data;
    },

    async get(id: string, options?: RequestOptions): Promise<TimeBlock> {
      const response = await client.get<ApiResponseWrapper<TimeBlock>>(`time-blocks/${id}`, options);
      return response.data;
    },

    async getWithTask(id: string, options?: RequestOptions): Promise<TimeBlockWithTask> {
      const response = await client.get<ApiResponseWrapper<TimeBlockWithTask>>(`time-blocks/${id}`, {
        ...options,
        searchParams: { ...options?.searchParams, includeTask: true },
      });
      return response.data;
    },

    async update(id: string, input: UpdateTimeBlockInput, options?: RequestOptions): Promise<TimeBlock> {
      // Backend expects date in YYYY-MM-DD and times in HH:mm format
      const payload: Record<string, unknown> = { ...input };
      
      // If startTime is provided, extract date and format time
      if (input.startTime) {
        payload.date = formatDateForApi(input.startTime);
        payload.startTime = formatTimeForApi(input.startTime);
      }
      
      // If endTime is provided, format it
      if (input.endTime) {
        payload.endTime = formatTimeForApi(input.endTime);
      }
      
      const response = await client.patch<ApiResponseWrapper<TimeBlock>>(`time-blocks/${id}`, payload, options);
      return response.data;
    },

    async delete(id: string, options?: RequestOptions): Promise<void> {
      await client.delete<ApiResponseWrapper<void>>(`time-blocks/${id}`, options);
    },

    async quickSchedule(input: QuickScheduleInput, options?: RequestOptions): Promise<TimeBlock> {
      // Backend expects date in YYYY-MM-DD and time in HH:mm format
      const payload = {
        ...input,
        date: formatDateForApi(input.startTime),
        startTime: formatTimeForApi(input.startTime),
      };
      const response = await client.post<ApiResponseWrapper<TimeBlock>>("time-blocks/quick-schedule", payload, options);
      return response.data;
    },

    async getSummary(startDate: string, endDate: string, options?: RequestOptions): Promise<TimeBlockSummary> {
      const response = await client.get<ApiResponseWrapper<TimeBlockSummary>>("time-blocks/summary", {
        ...options,
        searchParams: { ...options?.searchParams, startDate, endDate },
      });
      return response.data;
    },

    async checkConflicts(startTime: Date | string, endTime: Date | string, excludeId?: string, options?: RequestOptions): Promise<TimeBlockConflict[]> {
      // Backend expects date in YYYY-MM-DD and times in HH:mm format
      const response = await client.get<ApiResponseWrapper<TimeBlockConflict[]>>("time-blocks/conflicts", {
        ...options,
        searchParams: {
          ...options?.searchParams,
          date: formatDateForApi(startTime),
          startTime: formatTimeForApi(startTime),
          endTime: formatTimeForApi(endTime),
          excludeId,
        },
      });
      return response.data;
    },

    async batchCreate(inputs: CreateTimeBlockInput[], options?: RequestOptions): Promise<TimeBlock[]> {
      // Backend expects date in YYYY-MM-DD and times in HH:mm format
      const timeBlocks = inputs.map((input) => ({
        ...input,
        date: formatDateForApi(input.startTime),
        startTime: formatTimeForApi(input.startTime),
        endTime: formatTimeForApi(input.endTime),
      }));
      const response = await client.post<ApiResponseWrapper<TimeBlock[]>>("time-blocks/batch", { timeBlocks }, options);
      return response.data;
    },

    async batchUpdate(updates: Array<{ id: string; input: UpdateTimeBlockInput }>, options?: RequestOptions): Promise<TimeBlock[]> {
      // Backend expects date in YYYY-MM-DD and times in HH:mm format
      const serializedUpdates = updates.map(({ id, input }) => {
        const serializedInput: Record<string, unknown> = { ...input };
        
        if (input.startTime) {
          serializedInput.date = formatDateForApi(input.startTime);
          serializedInput.startTime = formatTimeForApi(input.startTime);
        }
        
        if (input.endTime) {
          serializedInput.endTime = formatTimeForApi(input.endTime);
        }
        
        return { id, input: serializedInput };
      });
      const response = await client.patch<ApiResponseWrapper<TimeBlock[]>>("time-blocks/batch", { updates: serializedUpdates }, options);
      return response.data;
    },

    async batchDelete(ids: string[], options?: RequestOptions): Promise<void> {
      await client.delete<ApiResponseWrapper<void>>("time-blocks/batch", {
        ...options,
        searchParams: { ...options?.searchParams, ids: ids.join(",") },
      });
    },
  };
}
