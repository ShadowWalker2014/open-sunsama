import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  TimeBlock,
  CreateTimeBlockInput,
  UpdateTimeBlockInput,
  QuickScheduleInput,
  AutoScheduleInput,
} from "@open-sunsama/types";
import { getApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { timeBlockKeys } from "./useTimeBlocks";

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
 * Auto schedule - create a time block from a task at the next available slot
 * The API automatically finds the best time within working hours (9 AM - 6 PM)
 */
export function useAutoSchedule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AutoScheduleInput): Promise<TimeBlock> => {
      const api = getApi();
      return await api.timeBlocks.autoSchedule(data);
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

// Re-export timer-related mutations
export {
  useStartTimeBlock,
  useStopTimeBlock,
  useResizeTimeBlock,
  useCascadeResizeTimeBlock,
  useMoveTimeBlock,
} from "./useTimeBlockTimer";
