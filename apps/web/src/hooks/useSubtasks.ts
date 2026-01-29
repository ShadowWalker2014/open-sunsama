import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

/**
 * Subtask type (to be moved to @chronoflow/types when API is ready)
 */
export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  completed: boolean;
  position: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSubtaskInput {
  title: string;
  completed?: boolean;
}

export interface UpdateSubtaskInput {
  title?: string;
  completed?: boolean;
  position?: number;
}

/**
 * Query key factory for subtasks
 */
export const subtaskKeys = {
  all: ["subtasks"] as const,
  lists: () => [...subtaskKeys.all, "list"] as const,
  list: (taskId: string) => [...subtaskKeys.lists(), taskId] as const,
  details: () => [...subtaskKeys.all, "detail"] as const,
  detail: (id: string) => [...subtaskKeys.details(), id] as const,
};

/**
 * Fetch subtasks for a task
 * NOTE: This hook is prepared for when the subtasks API is implemented.
 * Currently returns empty array as the API doesn't exist yet.
 */
export function useSubtasks(taskId: string) {
  return useQuery({
    queryKey: subtaskKeys.list(taskId),
    queryFn: async (): Promise<Subtask[]> => {
      // TODO: Implement when API is ready
      // const api = getApi();
      // return await api.subtasks.list(taskId);
      return [];
    },
    enabled: !!taskId,
  });
}

/**
 * Create a new subtask
 */
export function useCreateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      data,
    }: {
      taskId: string;
      data: CreateSubtaskInput;
    }): Promise<Subtask> => {
      // TODO: Implement when API is ready
      // const api = getApi();
      // return await api.subtasks.create(taskId, data);
      
      // Temporary: Create a local subtask
      const newSubtask: Subtask = {
        id: `temp-${Date.now()}`,
        taskId,
        title: data.title,
        completed: data.completed ?? false,
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      return newSubtask;
    },
    onSuccess: (newSubtask, { taskId }) => {
      // Update cache
      queryClient.setQueryData(
        subtaskKeys.list(taskId),
        (old: Subtask[] | undefined) => [...(old ?? []), newSubtask]
      );
      
      toast({
        title: "Subtask added",
        description: `"${newSubtask.title}" has been added.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create subtask",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Update a subtask
 */
export function useUpdateSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId,
      subtaskId,
      data,
    }: {
      taskId: string;
      subtaskId: string;
      data: UpdateSubtaskInput;
    }): Promise<Subtask> => {
      // TODO: Implement when API is ready
      // const api = getApi();
      // return await api.subtasks.update(subtaskId, data);
      
      // Temporary: Return updated subtask shape
      return {
        id: subtaskId,
        taskId,
        title: data.title ?? "",
        completed: data.completed ?? false,
        position: data.position ?? 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    },
    onSuccess: (updatedSubtask, { taskId }) => {
      // Update cache
      queryClient.setQueryData(
        subtaskKeys.list(taskId),
        (old: Subtask[] | undefined) =>
          old?.map((st) =>
            st.id === updatedSubtask.id ? updatedSubtask : st
          ) ?? []
      );
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update subtask",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Delete a subtask
 */
export function useDeleteSubtask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId: _taskId,
      subtaskId,
    }: {
      taskId: string;
      subtaskId: string;
    }): Promise<string> => {
      // TODO: Implement when API is ready
      // const api = getApi();
      // await api.subtasks.delete(subtaskId);
      void _taskId; // Will be used when API is implemented
      return subtaskId;
    },
    onSuccess: (deletedId, { taskId }) => {
      // Update cache
      queryClient.setQueryData(
        subtaskKeys.list(taskId),
        (old: Subtask[] | undefined) =>
          old?.filter((st) => st.id !== deletedId) ?? []
      );
      
      toast({
        title: "Subtask deleted",
        description: "The subtask has been removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete subtask",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Reorder subtasks within a task
 */
export function useReorderSubtasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      taskId: _taskId,
      subtaskIds: _subtaskIds,
    }: {
      taskId: string;
      subtaskIds: string[];
    }): Promise<void> => {
      // TODO: Implement when API is ready
      // const api = getApi();
      // await api.subtasks.reorder(taskId, subtaskIds);
      void _taskId; // Will be used when API is implemented
      void _subtaskIds; // Will be used when API is implemented
    },
    onMutate: async ({ taskId, subtaskIds }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: subtaskKeys.list(taskId) });

      // Snapshot the previous value
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(
        subtaskKeys.list(taskId)
      );

      // Optimistically update
      if (previousSubtasks) {
        const reorderedSubtasks = subtaskIds
          .map((id, index) => {
            const subtask = previousSubtasks.find((st) => st.id === id);
            return subtask ? { ...subtask, position: index } : null;
          })
          .filter((st): st is Subtask => st !== null);

        queryClient.setQueryData(subtaskKeys.list(taskId), reorderedSubtasks);
      }

      return { previousSubtasks };
    },
    onError: (error, { taskId }, context) => {
      // Rollback on error
      if (context?.previousSubtasks) {
        queryClient.setQueryData(
          subtaskKeys.list(taskId),
          context.previousSubtasks
        );
      }
      toast({
        variant: "destructive",
        title: "Failed to reorder subtasks",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSettled: (_, __, { taskId }) => {
      // Refetch after mutation
      queryClient.invalidateQueries({ queryKey: subtaskKeys.list(taskId) });
    },
  });
}
