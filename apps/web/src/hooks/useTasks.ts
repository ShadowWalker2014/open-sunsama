import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterInput,
} from "@chronoflow/types";
import { getApiClient } from "@/lib/api";
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
      const client = getApiClient();
      const params: Record<string, string> = {};
      
      if (filters?.scheduledDate !== undefined) {
        params.scheduledDate = filters.scheduledDate ?? "null";
      }
      if (filters?.completed !== undefined) {
        params.completed = String(filters.completed);
      }
      if (filters?.scheduledDateFrom) {
        params.scheduledDateFrom = filters.scheduledDateFrom;
      }
      if (filters?.scheduledDateTo) {
        params.scheduledDateTo = filters.scheduledDateTo;
      }
      
      return await client.tasks.list(params) as Task[];
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
      const client = getApiClient();
      return await client.tasks.get(id) as Task;
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
    mutationFn: async (data: CreateTaskInput) => {
      const client = getApiClient();
      return await client.tasks.create(data) as Task;
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
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }) => {
      const client = getApiClient();
      return await client.tasks.update(id, data) as Task;
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
    mutationFn: async (id: string) => {
      const client = getApiClient();
      await client.tasks.delete(id);
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
  const updateTask = useUpdateTask();

  return useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      return updateTask.mutateAsync({
        id,
        data: {
          completedAt: completed ? new Date() : null,
        },
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
          scheduledDate: targetDate,
          position,
        },
      });
    },
  });
}

/**
 * Reorder tasks within a date
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
    }) => {
      const client = getApiClient();
      return await client.request("POST", "/tasks/reorder", {
        body: { date, taskIds },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to reorder tasks",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}
