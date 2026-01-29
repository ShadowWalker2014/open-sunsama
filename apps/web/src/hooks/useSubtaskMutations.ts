import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Subtask, CreateSubtaskInput, UpdateSubtaskInput } from "@open-sunsama/types";
import { getApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { subtaskKeys } from "./useSubtasks";

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
      data: Omit<CreateSubtaskInput, "taskId">;
    }): Promise<Subtask> => {
      const api = getApi();
      return await api.subtasks.create(taskId, data);
    },
    onSuccess: (newSubtask, { taskId }) => {
      queryClient.setQueryData(
        subtaskKeys.list(taskId),
        (old: Subtask[] | undefined) => [...(old ?? []), newSubtask]
      );
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
      const api = getApi();
      return await api.subtasks.update(taskId, subtaskId, data);
    },
    onSuccess: (updatedSubtask, { taskId }) => {
      queryClient.setQueryData(
        subtaskKeys.list(taskId),
        (old: Subtask[] | undefined) =>
          old?.map((st) => (st.id === updatedSubtask.id ? updatedSubtask : st)) ?? []
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
      taskId,
      subtaskId,
    }: {
      taskId: string;
      subtaskId: string;
    }): Promise<string> => {
      const api = getApi();
      await api.subtasks.delete(taskId, subtaskId);
      return subtaskId;
    },
    onSuccess: (deletedId, { taskId }) => {
      queryClient.setQueryData(
        subtaskKeys.list(taskId),
        (old: Subtask[] | undefined) => old?.filter((st) => st.id !== deletedId) ?? []
      );
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
      taskId,
      subtaskIds,
    }: {
      taskId: string;
      subtaskIds: string[];
    }): Promise<Subtask[]> => {
      const api = getApi();
      return await api.subtasks.reorder(taskId, subtaskIds);
    },
    onMutate: async ({ taskId, subtaskIds }) => {
      await queryClient.cancelQueries({ queryKey: subtaskKeys.list(taskId) });
      const previousSubtasks = queryClient.getQueryData<Subtask[]>(subtaskKeys.list(taskId));

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
      if (context?.previousSubtasks) {
        queryClient.setQueryData(subtaskKeys.list(taskId), context.previousSubtasks);
      }
      toast({
        variant: "destructive",
        title: "Failed to reorder subtasks",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSettled: (_, __, { taskId }) => {
      queryClient.invalidateQueries({ queryKey: subtaskKeys.list(taskId) });
    },
  });
}
