import { useQuery } from "@tanstack/react-query";
import type { TimeBlockFilterInput } from "@open-sunsama/types";
import { getApi } from "@/lib/api";
import { timeBlockKeys } from "@/lib/query-keys";

// Re-export so existing `import { timeBlockKeys } from "./useTimeBlocks"`
// callers keep working while the canonical source lives in lib/query-keys.
export { timeBlockKeys };

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

// Re-export mutations for backwards compatibility. We import each one
// from its actual source module rather than chaining through
// useTimeBlockMutations — useTimeBlockMutations itself re-exports the
// timer mutations from useTimeBlockTimer, while useTimeBlockTimer imports
// useUpdateTimeBlock from useTimeBlockMutations. Going through the chain
// produces a chunk-level cycle that Rollup warns about. Splitting the
// re-export so this file references each defining module directly cuts
// the cycle.
export {
  useCreateTimeBlock,
  useUpdateTimeBlock,
  useDeleteTimeBlock,
  useQuickSchedule,
  useAutoSchedule,
} from "./useTimeBlockMutations";
export {
  useStartTimeBlock,
  useStopTimeBlock,
  useResizeTimeBlock,
  useCascadeResizeTimeBlock,
  useMoveTimeBlock,
} from "./useTimeBlockTimer";
