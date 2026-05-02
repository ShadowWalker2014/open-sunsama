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
import { timeBlockKeys } from "./useTimeBlocks";

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
    onMutate: async (data) => {
      // Optimistically inject a placeholder task so the UI updates instantly.
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });

      const tempId = `optimistic-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const now = new Date();
      const optimisticTask: Task = {
        id: tempId,
        userId: "",
        title: data.title,
        notes: data.notes ?? null,
        scheduledDate: data.scheduledDate ?? null,
        estimatedMins: data.estimatedMins ?? null,
        actualMins: 0,
        priority: data.priority ?? "P2",
        position: Number.MAX_SAFE_INTEGER,
        completedAt: null,
        subtasksHidden: false,
        seriesId: null,
        seriesInstanceNumber: null,
        timerStartedAt: null,
        timerAccumulatedSeconds: 0,
        createdAt: now,
        updatedAt: now,
      };

      // Walk each cached list and inject only into the ones whose filter
      // matches this task's date / backlog status. An empty filter ({}) is
      // treated as "all tasks" — those get the insert too. Any list filtered
      // to completed-only or to a non-matching priority is skipped.
      previousQueries.forEach(([key, data2]) => {
        if (!data2) return;
        const filter = key[2] as
          | {
              scheduledDate?: string;
              scheduledDateFrom?: string;
              scheduledDateTo?: string;
              backlog?: boolean;
              completed?: boolean;
              priority?: string;
            }
          | undefined;
        if (!filter) return;
        if (filter.completed === true) return;
        // If a priority filter is set and this task doesn't match, skip.
        if (filter.priority && filter.priority !== (data.priority ?? "P2")) {
          return;
        }

        const filterIsEmpty =
          filter.scheduledDate === undefined &&
          filter.scheduledDateFrom === undefined &&
          filter.scheduledDateTo === undefined &&
          filter.backlog === undefined;

        const matchesDate =
          filter.scheduledDate !== undefined &&
          filter.scheduledDate === data.scheduledDate;
        const matchesRange =
          filter.scheduledDateFrom !== undefined &&
          filter.scheduledDateTo !== undefined &&
          data.scheduledDate !== undefined &&
          data.scheduledDate !== null &&
          data.scheduledDate >= filter.scheduledDateFrom &&
          data.scheduledDate <= filter.scheduledDateTo;
        const matchesBacklog = filter.backlog === true && !data.scheduledDate;

        if (filterIsEmpty || matchesDate || matchesRange || matchesBacklog) {
          queryClient.setQueryData<Task[]>(key, [...data2, optimisticTask]);
        }
      });

      queryClient.setQueryData(taskKeys.detail(tempId), optimisticTask);

      return { previousQueries, tempId };
    },
    onError: (error, _data, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.tempId) {
        queryClient.removeQueries({
          queryKey: taskKeys.detail(context.tempId),
        });
      }
      toast({
        variant: "destructive",
        title: "Failed to create task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSuccess: (newTask, _data, context) => {
      // Replace optimistic placeholder with real server task.
      if (context?.tempId) {
        queryClient.removeQueries({
          queryKey: taskKeys.detail(context.tempId),
        });
        queryClient.setQueriesData<Task[]>(
          { queryKey: taskKeys.lists() },
          (old) => {
            if (!old) return old;
            const idx = old.findIndex((t) => t.id === context.tempId);
            if (idx === -1) return old;
            const next = old.slice();
            next[idx] = newTask;
            return next;
          }
        );
      }
      queryClient.setQueryData(taskKeys.detail(newTask.id), newTask);

      // Refresh "All Tasks" infinite search once — that view does its own
      // pagination so a targeted setQueryData isn't worth it here.
      queryClient.invalidateQueries({
        queryKey: ["tasks", "search", "infinite"],
      });

      toast({
        title: "Task created",
        description: `"${newTask.title}" has been created.`,
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
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateTaskInput;
    }): Promise<Task> => {
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
      // Update with actual server data. We deliberately do not invalidate
      // lists here — the optimistic update + this setQueryData already
      // produces the canonical state, and the WebSocket echo will reconcile
      // any server-side derived fields via the batched invalidator.
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((t) => (t.id === updatedTask.id ? updatedTask : t));
        }
      );
    },
  });
}

/**
 * Delete a task with an optimistic removal so the card vanishes immediately.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string): Promise<string> => {
      const api = getApi();
      await api.tasks.delete(id);
      return id;
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      await queryClient.cancelQueries({
        queryKey: ["tasks", "search", "infinite"],
      });

      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });
      const previousInfinite = queryClient.getQueriesData({
        queryKey: ["tasks", "search", "infinite"],
      });
      const previousDetail = queryClient.getQueryData<Task>(
        taskKeys.detail(id)
      );

      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => (old ? old.filter((t) => t.id !== id) : old)
      );
      queryClient.setQueriesData(
        { queryKey: ["tasks", "search", "infinite"] },
        (old: unknown) => {
          if (!old || typeof old !== "object" || !("pages" in old)) return old;
          const current = old as {
            pages: Array<{ data: Task[]; meta?: unknown }>;
            pageParams: unknown[];
          };
          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              data: page.data.filter((t) => t.id !== id),
            })),
          };
        }
      );
      queryClient.removeQueries({ queryKey: taskKeys.detail(id) });

      return { previousQueries, previousInfinite, previousDetail, id };
    },
    onError: (error, _id, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      context?.previousInfinite?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      if (context?.previousDetail && context.id) {
        queryClient.setQueryData(
          taskKeys.detail(context.id),
          context.previousDetail
        );
      }
      toast({
        variant: "destructive",
        title: "Failed to delete task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSuccess: () => {
      // Time blocks may reference this task (calendar shows the title);
      // a single targeted invalidation keeps the calendar honest. The WS
      // echo also covers cross-device.
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });
      toast({
        title: "Task deleted",
        description: "The task has been deleted.",
      });
    },
  });
}

/**
 * Complete a task
 * When completing, automatically stops any running timer and saves actualMins
 */
export function useCompleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      completed,
    }: {
      id: string;
      completed: boolean;
    }): Promise<Task> => {
      const api = getApi();

      if (completed) {
        // Server's complete endpoint auto-stops any running timer and saves actualMins
        return await api.tasks.complete(id);
      } else {
        return await api.tasks.uncomplete(id);
      }
    },
    onMutate: async ({ id, completed }) => {
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });
      await queryClient.cancelQueries({
        queryKey: ["tasks", "search", "infinite"],
      });

      const previousTask = queryClient.getQueryData<Task>(taskKeys.detail(id));
      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });
      const previousInfiniteQueries = queryClient.getQueriesData({
        queryKey: ["tasks", "search", "infinite"],
      });

      const optimisticCompletedAt = completed ? new Date() : null;

      if (previousTask) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), {
          ...previousTask,
          completedAt: optimisticCompletedAt,
          updatedAt: new Date(),
        });
      }

      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((task) =>
            task.id === id
              ? {
                  ...task,
                  completedAt: optimisticCompletedAt,
                  updatedAt: new Date(),
                }
              : task
          );
        }
      );

      queryClient.setQueriesData(
        { queryKey: ["tasks", "search", "infinite"] },
        (old: unknown) => {
          if (!old || typeof old !== "object" || !("pages" in old)) return old;
          const current = old as {
            pages: Array<{ data: Task[]; meta?: unknown }>;
            pageParams: unknown[];
          };

          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              data: page.data.map((task) =>
                task.id === id
                  ? {
                      ...task,
                      completedAt: optimisticCompletedAt,
                      updatedAt: new Date(),
                    }
                  : task
              ),
            })),
          };
        }
      );

      return { previousTask, previousQueries, previousInfiniteQueries, id };
    },
    onError: (error, _variables, context) => {
      if (context?.previousTask) {
        queryClient.setQueryData(
          taskKeys.detail(context.id),
          context.previousTask
        );
      }
      context?.previousQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      context?.previousInfiniteQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast({
        variant: "destructive",
        title: "Failed to update task",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSuccess: (updatedTask) => {
      queryClient.setQueryData(taskKeys.detail(updatedTask.id), updatedTask);
      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((task) =>
            task.id === updatedTask.id ? updatedTask : task
          );
        }
      );
      queryClient.setQueriesData(
        { queryKey: ["tasks", "search", "infinite"] },
        (old: unknown) => {
          if (!old || typeof old !== "object" || !("pages" in old)) return old;
          const current = old as {
            pages: Array<{ data: Task[]; meta?: unknown }>;
            pageParams: unknown[];
          };

          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              data: page.data.map((task) =>
                task.id === updatedTask.id ? updatedTask : task
              ),
            })),
          };
        }
      );
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
        scheduledDate: targetDate, // Pass null directly to clear scheduledDate (move to backlog)
        position,
      });
    },
    onMutate: async ({ id, targetDate, position }) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });

      // Snapshot all task list queries for rollback
      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });

      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((task) => {
            if (task.id !== id) return task;
            return {
              ...task,
              scheduledDate: targetDate,
              ...(position !== undefined ? { position } : {}),
            };
          });
        }
      );

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
    onSuccess: (movedTask) => {
      // Reconcile with the server-authoritative task. Importantly, this
      // populates the source/target lists with the canonical position the
      // server picked when only `targetDate` was provided.
      queryClient.setQueryData(taskKeys.detail(movedTask.id), movedTask);
      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((t) => (t.id === movedTask.id ? movedTask : t));
        }
      );
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
      await queryClient.cancelQueries({
        queryKey: ["tasks", "search", "infinite"],
      });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData<Task[]>(queryKey);
      const previousInfiniteQueries = queryClient.getQueriesData({
        queryKey: ["tasks", "search", "infinite"],
      });

      // Optimistically update the cache with new positions
      if (previousTasks) {
        const reorderedTasks = taskIds
          .map((id, index) => {
            const task = previousTasks.find((t) => t.id === id);
            return task ? { ...task, position: index } : null;
          })
          .filter((t): t is Task => t !== null);

        // Include any tasks not in taskIds (e.g., completed tasks) at the end
        const tasksNotInOrder = previousTasks.filter(
          (t) => !taskIds.includes(t.id)
        );
        const finalTasks = [...reorderedTasks, ...tasksNotInOrder];

        queryClient.setQueryData(queryKey, finalTasks);
      }

      const positionByTaskId = new Map(
        taskIds.map((taskId, index) => [taskId, index])
      );
      queryClient.setQueriesData(
        { queryKey: ["tasks", "search", "infinite"] },
        (old: unknown) => {
          if (!old || typeof old !== "object" || !("pages" in old)) return old;
          const current = old as {
            pages: Array<{ data: Task[]; meta?: unknown }>;
            pageParams: unknown[];
          };

          return {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              data: page.data.map((task) => {
                const position = positionByTaskId.get(task.id);
                if (position === undefined) return task;
                return {
                  ...task,
                  position,
                  scheduledDate: date === "backlog" ? null : date,
                };
              }),
            })),
          };
        }
      );

      // Return context with previous value for rollback
      return { previousTasks, date, queryKey, previousInfiniteQueries };
    },
    onError: (error, _variables, context) => {
      // Rollback to previous value on error
      if (context?.previousTasks && context?.queryKey) {
        queryClient.setQueryData(context.queryKey, context.previousTasks);
      }
      context?.previousInfiniteQueries?.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast({
        variant: "destructive",
        title: "Failed to reorder tasks",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSuccess: (_data, _variables, context) => {
      // The server may renumber positions across all tasks in this bucket
      // (including completed ones), and our optimistic math only renumbers
      // the ones the user dragged. Refetch the affected list so the cache
      // reflects the server's authoritative position values.
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey });
      }
    },
  });
}
