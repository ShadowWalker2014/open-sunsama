import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  TimeBlock,
  CreateTimeBlockInput,
  UpdateTimeBlockInput,
  TimeBlockFilterInput,
} from '@open-sunsama/types';
import { getApi } from '@/lib/api';
import * as Haptics from 'expo-haptics';

/**
 * Query key factory for time blocks
 */
export const timeBlockKeys = {
  all: ['timeBlocks'] as const,
  lists: () => [...timeBlockKeys.all, 'list'] as const,
  list: (filters: TimeBlockFilterInput) => [...timeBlockKeys.lists(), filters] as const,
  details: () => [...timeBlockKeys.all, 'detail'] as const,
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
      queryClient.setQueryData(timeBlockKeys.detail(newTimeBlock.id), newTimeBlock);
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });
}

/**
 * Update an existing time block
 */
export function useUpdateTimeBlock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTimeBlockInput }): Promise<TimeBlock> => {
      const api = getApi();
      return await api.timeBlocks.update(id, data);
    },
    onSuccess: (updatedTimeBlock) => {
      // Update the time block in cache
      queryClient.setQueryData(timeBlockKeys.detail(updatedTimeBlock.id), updatedTimeBlock);
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      
      // Haptic feedback
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });
}
