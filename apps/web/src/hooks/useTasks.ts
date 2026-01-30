import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterInput,
  ReorderTasksInput,
} from "@open-sunsama/types";
import { getApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

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
 * Uses a high limit (200) for single-day queries to prevent truncation
 */
export function useTasks(filters?: TaskFilterInput) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: taskKeys.list(filters ?? {}),
    queryFn: async () => {
      const api = getApi();
      // Use high limit for single-day queries to prevent truncation
      const effectiveFilters = filters?.scheduledDate 
        ? { ...filters, limit: filters.limit ?? 200 }
        : filters;
      const response = await api.tasks.list(effectiveFilters);
      return response.data ?? [];
    },
    enabled: isAuthenticated, // Only fetch when authenticated
  });
}

/**
 * Fetch a single task by ID
 */
export function useTask(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: taskKeys.detail(id),
    queryFn: async () => {
      const api = getApi();
      return await api.tasks.get(id);
    },
    enabled: !!id && isAuthenticated, // Only fetch when authenticated
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
 * Update an existing task with optimistic updates for instant UI feedback
 */
export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateTaskInput }): Promise<Task> => {
      const api = getApi();
      return await api.tasks.update(id, data);
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

      // Snapshot previous values for rollback
      const previousTask = queryClient.getQueryData<Task>(taskKeys.detail(id));
      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });

      // Optimistically update the task detail cache
      if (previousTask) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), {
          ...previousTask,
          ...data,
          updatedAt: new Date(),
        });
      }

      // Optimistically update all list caches
      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((task) => {
            if (task.id === id) {
              return { ...task, ...data, updatedAt: new Date() };
            }
            return task;
          });
        }
      );

      return { previousTask, previousQueries };
    },
    onError: (error, { id }, context) => {
      // Rollback on error
      if (context?.previousTask) {
        queryClient.setQueryData(taskKeys.detail(id), context.previousTask);
      }
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast({
        variant: "destructive",
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSuccess: (updatedTask) => {
      // Update with actual server data
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
    },
    onSettled: () => {
      // Always refetch to ensure server state
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
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
      
      // Invalidate all task lists
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      
      // Also invalidate infinite search queries (used by "All Tasks" page)
      queryClient.invalidateQueries({ queryKey: ["tasks", "search", "infinite"] });
      
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
 * Move a task to a different date with optimistic updates
 * for instant visual feedback during drag-and-drop
 */
export function useMoveTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      targetDate,
      position,
    }: {
      id: string;
      targetDate: string | null;
      position?: number;
    }): Promise<Task> => {
      const api = getApi();
      return await api.tasks.update(id, {
        scheduledDate: targetDate ?? undefined,
        position,
      });
    },
    onMutate: async ({ id, targetDate }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot all task list queries for rollback
      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });

      // Find the task being moved from any cache
      let movedTask: Task | undefined;
      previousQueries.forEach(([, data]) => {
        if (data) {
          const found = data.find((t) => t.id === id);
          if (found) movedTask = found;
        }
      });

      if (movedTask) {
        // Optimistically update all relevant caches
        queryClient.setQueriesData<Task[]>(
          { queryKey: taskKeys.lists() },
          (old) => {
            if (!old) return old;
            return old.map((task) => {
              if (task.id === id) {
                return { ...task, scheduledDate: targetDate };
              }
              return task;
            });
          }
        );
      }

      return { previousQueries };
    },
    onError: (_error, _variables, context) => {
      // Rollback all queries on error
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast({
        variant: "destructive",
        title: "Failed to move task",
        description: _error instanceof Error ? _error.message : "Unknown error",
      });
    },
    onSettled: () => {
      // Invalidate all task lists to ensure server state
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
    },
  });
}

/**
 * Reorder tasks within a date or backlog
 * Uses optimistic updates for smooth drag-and-drop experience
 */
export function useReorderTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      taskIds,
    }: {
      date: string; // "backlog" for backlog tasks, or "YYYY-MM-DD" for scheduled tasks
      taskIds: string[];
    }): Promise<void> => {
      const api = getApi();
      const input: ReorderTasksInput = { date, taskIds };
      await api.tasks.reorder(input);
    },
    onMutate: async ({ date, taskIds }) => {
      // Determine the correct query key based on whether it's backlog or a date
      const isBacklog = date === "backlog";
      const queryKey = isBacklog 
        ? taskKeys.list({ backlog: true })
        : taskKeys.list({ scheduledDate: date });

      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);

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

        queryClient.setQueryData(queryKey, finalTasks);
      }

      // Return context with previous value for rollback
      return { previousTasks, date, queryKey };
    },
    onError: (error, _variables, context) => {
      // Rollback to previous value on error
      if (context?.previousTasks && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousTasks);
      }
      toast({
        variant: "destructive",
        title: "Failed to reorder tasks",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSettled: (_data, _error, { date }) => {
      // Always refetch after error or success to ensure server state
      const isBacklog = date === "backlog";
      const queryKey = isBacklog 
        ? taskKeys.list({ backlog: true })
        : taskKeys.list({ scheduledDate: date });
      queryClient.invalidateQueries({ queryKey });
    },
  });
}
