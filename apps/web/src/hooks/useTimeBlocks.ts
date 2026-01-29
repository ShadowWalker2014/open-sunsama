import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TimeBlock,
  CreateTimeBlockInput,
  UpdateTimeBlockInput,
  TimeBlockFilterInput,
  QuickScheduleInput,
} from "@chronoflow/types";
import { getApiClient } from "@/lib/api";
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
      const client = getApiClient();
      const params: Record<string, string> = {};

      if (filters?.date) {
        params.date = filters.date;
      }
      if (filters?.taskId) {
        params.taskId = filters.taskId;
      }
      if (filters?.startTimeFrom) {
        params.startTimeFrom =
          typeof filters.startTimeFrom === "string"
            ? filters.startTimeFrom
            : filters.startTimeFrom.toISOString();
      }
      if (filters?.startTimeTo) {
        params.startTimeTo =
          typeof filters.startTimeTo === "string"
            ? filters.startTimeTo
            : filters.startTimeTo.toISOString();
      }

      return (await client.timeBlocks.list(params)) as TimeBlock[];
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
      const client = getApiClient();
      return (await client.timeBlocks.get(id)) as TimeBlock;
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
    mutationFn: async (data: CreateTimeBlockInput) => {
      const client = getApiClient();
      return (await client.timeBlocks.create(data)) as TimeBlock;
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
    }) => {
      const client = getApiClient();
      return (await client.timeBlocks.update(id, data)) as TimeBlock;
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
    mutationFn: async (id: string) => {
      const client = getApiClient();
      await client.timeBlocks.delete(id);
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
    mutationFn: async (data: QuickScheduleInput) => {
      const client = getApiClient();
      return await client.request<TimeBlock>("POST", "/time-blocks/quick-schedule", {
        body: data,
      });
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
 */
export function useStartTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = getApiClient();
      return (await client.timeBlocks.start(id)) as TimeBlock;
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
 */
export function useStopTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const client = getApiClient();
      return (await client.timeBlocks.stop(id)) as TimeBlock;
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
