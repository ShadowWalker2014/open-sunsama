import { useQuery } from "@tanstack/react-query";
import type { TimeBlockFilterInput } from "@chronoflow/types";
import { getApi } from "@/lib/api";

/**
 * Query key factory for time blocks
 */
export const timeBlockKeys = {
  all: ["timeBlocks"] as const,
  lists: () => [...timeBlockKeys.all, "list"] as const,
  list: (filters: TimeBlockFilterInput) =>
    [...timeBlockKeys.lists(), filters] as const,
  details: () => [...timeBlockKeys.all, "detail"] as const,
  detail: (id: string) => [...timeBlockKeys.details(), id] as const,
};

/**
 * Fetch all time blocks with optional filters
 */
export function useTimeBlocks(filters?: TimeBlockFilterInput) {
  return useQuery({
    queryKey: timeBlockKeys.list(filters ?? {}),
    queryFn: async () => {
      const api = getApi();
      return await api.timeBlocks.list(filters);
    },
  });
}

/**
 * Fetch time blocks for a specific date range
 */
export function useTimeBlocksForDateRange(startDate: Date, endDate: Date) {
  return useTimeBlocks({
    startTimeFrom: startDate,
    startTimeTo: endDate,
  });
}

/**
 * Fetch time blocks for a specific date
 */
export function useTimeBlocksForDate(date: string) {
  return useTimeBlocks({ date });
}

/**
 * Fetch a single time block by ID
 */
export function useTimeBlock(id: string) {
  return useQuery({
    queryKey: timeBlockKeys.detail(id),
    queryFn: async () => {
      const api = getApi();
      return await api.timeBlocks.get(id);
    },
    enabled: !!id,
  });
}

// Re-export all mutations for backwards compatibility
export {
  useCreateTimeBlock,
  useUpdateTimeBlock,
  useDeleteTimeBlock,
  useQuickSchedule,
  useStartTimeBlock,
  useStopTimeBlock,
  useResizeTimeBlock,
  useMoveTimeBlock,
} from "./useTimeBlockMutations";
