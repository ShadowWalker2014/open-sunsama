import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TimeBlock,
  CreateTimeBlockInput,
  UpdateTimeBlockInput,
  TimeBlockFilterInput,
  QuickScheduleInput,
} from "@chronoflow/types";
import { getApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

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

/**
 * Create a new time block
 */
export function useCreateTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTimeBlockInput): Promise<TimeBlock> => {
      const api = getApi();
      return await api.timeBlocks.create(data);
    },
    onSuccess: (newTimeBlock) => {
      // Invalidate and refetch time block lists
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });

      // Add the new time block to the cache
      queryClient.setQueryData(
        timeBlockKeys.detail(newTimeBlock.id),
        newTimeBlock
      );

      toast({
        title: "Time block created",
        description: `"${newTimeBlock.title}" has been scheduled.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create time block",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Update an existing time block
 */
export function useUpdateTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTimeBlockInput;
    }): Promise<TimeBlock> => {
      const api = getApi();
      return await api.timeBlocks.update(id, data);
    },
    onSuccess: (updatedTimeBlock) => {
      // Update the time block in cache
      queryClient.setQueryData(
        timeBlockKeys.detail(updatedTimeBlock.id),
        updatedTimeBlock
      );

      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update time block",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Delete a time block
 */
export function useDeleteTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const api = getApi();
      await api.timeBlocks.delete(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: timeBlockKeys.detail(deletedId) });

      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });

      toast({
        title: "Time block deleted",
        description: "The time block has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete time block",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Quick schedule - create a time block from a task
 */
export function useQuickSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuickScheduleInput): Promise<TimeBlock> => {
      const api = getApi();
      return await api.timeBlocks.quickSchedule(data);
    },
    onSuccess: (newTimeBlock) => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });
      queryClient.setQueryData(
        timeBlockKeys.detail(newTimeBlock.id),
        newTimeBlock
      );

      toast({
        title: "Task scheduled",
        description: `"${newTimeBlock.title}" has been added to your calendar.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to schedule task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Start a time block (for time tracking)
 * Note: Updates the start time to the current time
 */
export function useStartTimeBlock() {
  const queryClient = useQueryClient();
  const updateTimeBlock = useUpdateTimeBlock();

  return useMutation({
    mutationFn: async (id: string): Promise<TimeBlock> => {
      // Update start time to now
      return updateTimeBlock.mutateAsync({
        id,
        data: {
          startTime: new Date(),
        },
      });
    },
    onSuccess: (updatedTimeBlock) => {
      queryClient.setQueryData(
        timeBlockKeys.detail(updatedTimeBlock.id),
        updatedTimeBlock
      );
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });

      toast({
        title: "Time block started",
        description: "Timer is now running.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to start time block",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Stop a time block (for time tracking)
 * Note: Updates the end time to the current time
 */
export function useStopTimeBlock() {
  const queryClient = useQueryClient();
  const updateTimeBlock = useUpdateTimeBlock();

  return useMutation({
    mutationFn: async (id: string): Promise<TimeBlock> => {
      // Update end time to now
      return updateTimeBlock.mutateAsync({
        id,
        data: {
          endTime: new Date(),
        },
      });
    },
    onSuccess: (updatedTimeBlock) => {
      queryClient.setQueryData(
        timeBlockKeys.detail(updatedTimeBlock.id),
        updatedTimeBlock
      );
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });

      toast({
        title: "Time block stopped",
        description: "Timer has been stopped.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to stop time block",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Resize a time block (update start/end time)
 */
export function useResizeTimeBlock() {
  const updateTimeBlock = useUpdateTimeBlock();

  return useMutation({
    mutationFn: async ({
      id,
      startTime,
      endTime,
    }: {
      id: string;
      startTime?: Date | string;
      endTime?: Date | string;
    }) => {
      return updateTimeBlock.mutateAsync({
        id,
        data: { startTime, endTime },
      });
    },
  });
}

/**
 * Move a time block to a different time
 */
export function useMoveTimeBlock() {
  const updateTimeBlock = useUpdateTimeBlock();

  return useMutation({
    mutationFn: async ({
      id,
      startTime,
      endTime,
    }: {
      id: string;
      startTime: Date | string;
      endTime: Date | string;
    }) => {
      return updateTimeBlock.mutateAsync({
        id,
        data: { startTime, endTime },
      });
    },
  });
}
