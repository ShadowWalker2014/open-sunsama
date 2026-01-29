import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterInput,
  ReorderTasksInput,
} from "@chronoflow/types";
import { getApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

/**
 * Query key factory for tasks
 */
export const taskKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskKeys.all, "list"] as const,
  list: (filters: TaskFilterInput) => [...taskKeys.lists(), filters] as const,
  details: () => [...taskKeys.all, "detail"] as const,
  detail: (id: string) => [...taskKeys.details(), id] as const,
};

/**
 * Fetch all tasks with optional filters
 */
export function useTasks(filters?: TaskFilterInput) {
  return useQuery({
    queryKey: taskKeys.list(filters ?? {}),
    queryFn: async () => {
      const api = getApi();
      return await api.tasks.list(filters);
    },
  });
}

/**
 * Fetch a single task by ID
 */
export function useTask(id: string) {
  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const api = getApi();
      return await api.tasks.get(id);
    },
    enabled: !!id,
  });
}

/**
 * Create a new task
 */
export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateTaskInput): Promise<Task> => {
      const api = getApi();
      return await api.tasks.create(data);
    },
    onSuccess: (newTask) => {
      // Invalidate and refetch task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      
      // Optionally add the new task to the cache
      queryClient.setQueryData(taskKeys.detail(newTask.id), newTask);
      
      toast({
        title: "Task created",
        description: `"${newTask.title}" has been created.`,
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to create task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Update an existing task
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }): Promise<Task> => {
      const api = getApi();
      return await api.tasks.update(id, data);
    },
    onSuccess: (updatedTask) => {
      // Update the task in cache
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      
      // Invalidate lists to ensure consistency
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Delete a task
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const api = getApi();
      await api.tasks.delete(id);
      return id;
    },
    onSuccess: (deletedId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: taskKeys.detail(deletedId) });
      
      // Invalidate lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      
      toast({
        title: "Task deleted",
        description: "The task has been deleted.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to delete task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Complete a task
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }): Promise<Task> => {
      const api = getApi();
      if (completed) {
        return await api.tasks.complete(id);
      } else {
        return await api.tasks.uncomplete(id);
      }
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Move a task to a different date
 */
export function useMoveTask() {
  const updateTask = useUpdateTask();

  return useMutation({
    mutationFn: async ({
      id,
      targetDate,
      position,
    }: {
      id: string;
      targetDate: string | null;
      position?: number;
    }) => {
      return updateTask.mutateAsync({
        id,
        data: {
          scheduledDate: targetDate ?? undefined,
          position,
        },
      });
    },
  });
}

/**
 * Reorder tasks within a date
 * Uses optimistic updates for smooth drag-and-drop experience
 */
export function useReorderTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      taskIds,
    }: {
      date: string;
      taskIds: string[];
    }): Promise<void> => {
      const api = getApi();
      const input: ReorderTasksInput = { date, taskIds };
      await api.tasks.reorder(input);
    },
    onMutate: async ({ date, taskIds }) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: taskKeys.list({ scheduledDate: date }) });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(taskKeys.list({ scheduledDate: date }));

      // Optimistically update the cache with new positions
      if (previousTasks) {
        const reorderedTasks = taskIds
          .map((id, index) => {
            const task = previousTasks.find((t) => t.id === id);
            return task ? { ...task, position: index } : null;
          })
          .filter((t): t is Task => t !== null);

        // Include any tasks not in taskIds (e.g., completed tasks) at the end
        const tasksNotInOrder = previousTasks.filter((t) => !taskIds.includes(t.id));
        const finalTasks = [...reorderedTasks, ...tasksNotInOrder];

        queryClient.setQueryData(taskKeys.list({ scheduledDate: date }), finalTasks);
      }

      // Return context with previous value for rollback
      return { previousTasks, date };
    },
    onError: (error, _variables, context) => {
      // Rollback to previous value on error
      if (context?.previousTasks) {
        queryClient.setQueryData(
          taskKeys.list({ scheduledDate: context.date }),
          context.previousTasks
        );
      }
      toast({
        variant: "destructive",
        title: "Failed to reorder tasks",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSettled: (_data, _error, { date }) => {
      // Always refetch after error or success to ensure server state
      queryClient.invalidateQueries({ queryKey: taskKeys.list({ scheduledDate: date }) });
    },
  });
}
