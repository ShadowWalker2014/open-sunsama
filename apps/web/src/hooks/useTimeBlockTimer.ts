import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TimeBlock } from "@open-sunsama/types";
import { toast } from "@/hooks/use-toast";
import { timeBlockKeys } from "./useTimeBlocks";
import { useUpdateTimeBlock } from "./useTimeBlockMutations";

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
