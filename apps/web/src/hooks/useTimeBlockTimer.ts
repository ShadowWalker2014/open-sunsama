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
 * Resize a time block with cascade effect - shifts all overlapping blocks below
 */
export function useCascadeResizeTimeBlock() {
  const updateTimeBlock = useUpdateTimeBlock();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      startTime,
      endTime,
      allBlocks,
    }: {
      id: string;
      startTime: Date;
      endTime: Date;
      allBlocks: TimeBlock[];
    }) => {
      // Calculate which blocks need to shift (only blocks starting after the resized block)
      const blocksToUpdate = calculateCascadeShifts(id, startTime, endTime, allBlocks);
      
      // Update the resized block first
      await updateTimeBlock.mutateAsync({
        id,
        data: { startTime, endTime },
      });
      
      // Update all shifted blocks
      for (const update of blocksToUpdate) {
        await updateTimeBlock.mutateAsync({
          id: update.id,
          data: { startTime: update.startTime, endTime: update.endTime },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });
    },
  });
}

/**
 * Calculate which blocks need to shift due to cascade effect
 * Only affects blocks that start at or after the resized block's original start time
 */
function calculateCascadeShifts(
  resizedBlockId: string,
  resizedBlockStartTime: Date,
  newEndTime: Date,
  allBlocks: TimeBlock[]
): Array<{ id: string; startTime: Date; endTime: Date }> {
  const updates: Array<{ id: string; startTime: Date; endTime: Date }> = [];
  
  // Only consider blocks that:
  // 1. Are not the resized block itself
  // 2. Start at or after the resized block's start time (blocks below it)
  const sortedBlocks = [...allBlocks]
    .filter(b => b.id !== resizedBlockId)
    .filter(b => new Date(b.startTime) >= resizedBlockStartTime)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  
  // Track the current "push" boundary - blocks starting before this time need to shift
  let pushBoundary = newEndTime;
  
  for (const block of sortedBlocks) {
    const blockStart = new Date(block.startTime);
    const blockEnd = new Date(block.endTime);
    
    // If this block starts before the push boundary, it overlaps and needs to shift
    if (blockStart < pushBoundary) {
      const duration = blockEnd.getTime() - blockStart.getTime();
      const newStart = new Date(pushBoundary);
      const newEnd = new Date(newStart.getTime() + duration);
      
      updates.push({
        id: block.id,
        startTime: newStart,
        endTime: newEnd,
      });
      
      // Update push boundary for next blocks (cascade effect)
      pushBoundary = newEnd;
    }
  }
  
  return updates;
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
