/**
 * Time Blocks API methods
 * @module @open-sunsama/api-client/time-blocks
 */

import type {
  TimeBlock,
  CreateTimeBlockInput,
  UpdateTimeBlockInput,
  TimeBlockFilterInput,
  TimeBlockWithTask,
  QuickScheduleInput,
  AutoScheduleInput,
  TimeBlockSummary,
  TimeBlockConflict,
} from "@open-sunsama/types";
import type { OpenSunsamaClient, RequestOptions } from "./client.js";

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

/**
 * Raw time block from API (with date and time as separate strings)
 */
interface RawTimeBlock {
  id: string;
  userId: string;
  taskId: string | null;
  title: string;
  description?: string | null;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMins: number;
  color: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  task?: unknown;
}

/**
 * Transform raw API response to TimeBlock with proper Date fields
 * Combines date + startTime/endTime into full ISO datetime strings
 */
function transformTimeBlock(raw: RawTimeBlock): TimeBlock {
  // Combine date (YYYY-MM-DD) with time (HH:mm) to create full datetime
  // Use local time interpretation (not UTC)
  const startDateTime = `${raw.date}T${raw.startTime}:00`;
  const endDateTime = `${raw.date}T${raw.endTime}:00`;
  
  return {
    id: raw.id,
    userId: raw.userId,
    taskId: raw.taskId,
    title: raw.title,
    startTime: new Date(startDateTime),
    endTime: new Date(endDateTime),
    color: raw.color,
    notes: raw.description ?? null,
    createdAt: new Date(raw.createdAt),
    updatedAt: new Date(raw.updatedAt),
  };
}

/**
 * Transform raw API response to TimeBlockWithTask
 */
function transformTimeBlockWithTask(raw: RawTimeBlock & { task?: unknown }): TimeBlockWithTask {
  const timeBlock = transformTimeBlock(raw);
  return {
    ...timeBlock,
    task: (raw.task as TimeBlockWithTask['task']) ?? null,
  };
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
  autoSchedule(input: AutoScheduleInput, options?: RequestOptions): Promise<TimeBlock>;
  getSummary(startDate: string, endDate: string, options?: RequestOptions): Promise<TimeBlockSummary>;
  checkConflicts(startTime: Date | string, endTime: Date | string, excludeId?: string, options?: RequestOptions): Promise<TimeBlockConflict[]>;
  batchCreate(inputs: CreateTimeBlockInput[], options?: RequestOptions): Promise<TimeBlock[]>;
  batchUpdate(updates: Array<{ id: string; input: UpdateTimeBlockInput }>, options?: RequestOptions): Promise<TimeBlock[]>;
  batchDelete(ids: string[], options?: RequestOptions): Promise<void>;
  cascadeResize(id: string, data: { startTime: Date | string; endTime: Date | string }, options?: RequestOptions): Promise<TimeBlock[]>;
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
export function createTimeBlocksApi(client: OpenSunsamaClient): TimeBlocksApi {
  return {
    async list(filters?: TimeBlockFilterInput, options?: RequestOptions): Promise<TimeBlock[]> {
      const searchParams = filtersToSearchParams(filters);
      const response = await client.get<ApiResponseWrapper<RawTimeBlock[]>>("time-blocks", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams },
      });
      return response.data.map(transformTimeBlock);
    },

    async listWithTasks(filters?: TimeBlockFilterInput, options?: RequestOptions): Promise<TimeBlockWithTask[]> {
      const searchParams = filtersToSearchParams(filters);
      const response = await client.get<ApiResponseWrapper<RawTimeBlock[]>>("time-blocks", {
        ...options,
        searchParams: { ...options?.searchParams, ...searchParams, includeTasks: true },
      });
      return response.data.map(transformTimeBlockWithTask);
    },

    async create(input: CreateTimeBlockInput, options?: RequestOptions): Promise<TimeBlock> {
      // Backend expects date in YYYY-MM-DD and times in HH:mm format
      const payload = {
        ...input,
        date: formatDateForApi(input.startTime),
        startTime: formatTimeForApi(input.startTime),
        endTime: formatTimeForApi(input.endTime),
      };
      const response = await client.post<ApiResponseWrapper<RawTimeBlock>>("time-blocks", payload, options);
      return transformTimeBlock(response.data);
    },

    async get(id: string, options?: RequestOptions): Promise<TimeBlock> {
      const response = await client.get<ApiResponseWrapper<RawTimeBlock>>(`time-blocks/${id}`, options);
      return transformTimeBlock(response.data);
    },

    async getWithTask(id: string, options?: RequestOptions): Promise<TimeBlockWithTask> {
      const response = await client.get<ApiResponseWrapper<RawTimeBlock>>(`time-blocks/${id}`, {
        ...options,
        searchParams: { ...options?.searchParams, includeTask: true },
      });
      return transformTimeBlockWithTask(response.data);
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
      
      const response = await client.patch<ApiResponseWrapper<RawTimeBlock>>(`time-blocks/${id}`, payload, options);
      return transformTimeBlock(response.data);
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
      const response = await client.post<ApiResponseWrapper<RawTimeBlock>>("time-blocks/quick-schedule", payload, options);
      return transformTimeBlock(response.data);
    },

    async autoSchedule(input: AutoScheduleInput, options?: RequestOptions): Promise<TimeBlock> {
      // Backend automatically determines the best time slot
      const response = await client.post<ApiResponseWrapper<RawTimeBlock>>("time-blocks/auto-schedule", input, options);
      return transformTimeBlock(response.data);
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
      const timeBlocksPayload = inputs.map((input) => ({
        ...input,
        date: formatDateForApi(input.startTime),
        startTime: formatTimeForApi(input.startTime),
        endTime: formatTimeForApi(input.endTime),
      }));
      const response = await client.post<ApiResponseWrapper<RawTimeBlock[]>>("time-blocks/batch", { timeBlocks: timeBlocksPayload }, options);
      return response.data.map(transformTimeBlock);
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
      const response = await client.patch<ApiResponseWrapper<RawTimeBlock[]>>("time-blocks/batch", { updates: serializedUpdates }, options);
      return response.data.map(transformTimeBlock);
    },

    async batchDelete(ids: string[], options?: RequestOptions): Promise<void> {
      await client.delete<ApiResponseWrapper<void>>("time-blocks/batch", {
        ...options,
        searchParams: { ...options?.searchParams, ids: ids.join(",") },
      });
    },

    async cascadeResize(id: string, data: { startTime: Date | string; endTime: Date | string }, options?: RequestOptions): Promise<TimeBlock[]> {
      // Backend expects times in HH:mm format
      const payload = {
        startTime: formatTimeForApi(data.startTime),
        endTime: formatTimeForApi(data.endTime),
      };
      const response = await client.patch<ApiResponseWrapper<RawTimeBlock[]>>(`time-blocks/${id}/cascade-resize`, payload, options);
      return response.data.map(transformTimeBlock);
    },
  };
}
