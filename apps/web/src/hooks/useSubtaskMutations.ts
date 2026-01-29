import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { subtaskKeys, type Subtask, type CreateSubtaskInput, type UpdateSubtaskInput } from "./useSubtasks";

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
      taskId: _taskId,
      subtaskId,
    }: {
      taskId: string;
      subtaskId: string;
    }): Promise<string> => {
      // TODO: Implement when API is ready
      void _taskId;
      return subtaskId;
    },
    onSuccess: (deletedId, { taskId }) => {
      queryClient.setQueryData(
        subtaskKeys.list(taskId),
        (old: Subtask[] | undefined) => old?.filter((st) => st.id !== deletedId) ?? []
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
      void _taskId;
      void _subtaskIds;
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
