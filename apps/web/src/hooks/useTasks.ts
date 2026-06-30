import {
  useQuery,
  useMutation,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import type {
  Task,
  CreateTaskInput,
  UpdateTaskInput,
  TaskFilterInput,
  ReorderTasksInput,
} from "@open-sunsama/types";
import { format } from "date-fns";
import { getApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useUndoRedo } from "@/hooks/useUndoRedo";
import { taskKeys, timeBlockKeys } from "@/lib/query-keys";

/**
 * Write an authoritative task into every cache that can hold it: the detail
 * entry plus all list and infinite-search caches. Used after a mutation (or an
 * undo/redo) resolves so synchronous cache readers — e.g. the `c` shortcut's
 * `getFreshTask` — never observe a stale copy. Invalidation alone is not
 * enough: it leaves the old value in cache until a refetch lands, and the
 * detail cache isn't even refetched unless it's actively observed.
 */
function writeTaskToCaches(qc: QueryClient, task: Task) {
  qc.setQueryData<Task>(taskKeys.detail(task.id), task);
  qc.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (old) =>
    old ? old.map((t) => (t.id === task.id ? task : t)) : old
  );
  qc.setQueriesData(
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
          data: page.data.map((t) => (t.id === task.id ? task : t)),
        })),
      };
    }
  );
}

/** Refetch the task-related caches after an undo/redo applies a raw change. */
function invalidateTaskCaches(qc: QueryClient) {
  qc.invalidateQueries({ queryKey: taskKeys.lists() });
  qc.invalidateQueries({ queryKey: ["tasks", "search", "infinite"] });
  qc.invalidateQueries({ queryKey: timeBlockKeys.lists() });
}

// Canonical task keys live in lib/query-keys so the WebSocket listener
// (mounted at the app shell) can import only the keys without dragging
// every task mutation into the boot bundle. Re-exported here for callers
// that already import from this module.
export { taskKeys };

/**
 * Filter shape used as the third element of `taskKeys.list(...)`. Different
 * call-sites pass different `limit` / sort options, but the only fields we
 * care about for routing optimistic moves are `scheduledDate`,
 * `scheduledDateFrom/To`, and `backlog`.
 */
type ListFilter = {
  scheduledDate?: string | null;
  scheduledDateFrom?: string;
  scheduledDateTo?: string;
  backlog?: boolean;
  completed?: boolean;
  priority?: string;
};

/**
 * Decide whether a list query's filter would include a task scheduled to
 * `targetDate` (null = backlog). Returns:
 *   - "dest" when the filter scopes to that date / backlog / matching range
 *   - "skip" when the filter rules the task out (e.g. completed-only)
 *   - "neutral" when the filter is broad ("all") — the task may live there
 *     too but the cache might also be holding tasks for OTHER dates, so we
 *     should treat it as a source if it currently has the task and as a
 *     destination if it doesn't (we'll insert in either case so the
 *     consumer sees the new state).
 */
function classifyListForTarget(
  filter: ListFilter | undefined,
  targetDate: string | null
): "dest" | "skip" | "neutral" {
  if (!filter) return "neutral";
  if (filter.completed === true) return "skip";

  if (filter.backlog === true) {
    return targetDate === null ? "dest" : "skip";
  }

  // `scheduledDate: null` is the explicit-backlog form used by some mobile
  // call sites — semantically equivalent to `backlog: true`.
  if (filter.scheduledDate === null) {
    return targetDate === null ? "dest" : "skip";
  }

  if (filter.scheduledDate !== undefined) {
    return filter.scheduledDate === targetDate ? "dest" : "skip";
  }

  if (
    filter.scheduledDateFrom !== undefined &&
    filter.scheduledDateTo !== undefined
  ) {
    if (targetDate === null) return "skip";
    return targetDate >= filter.scheduledDateFrom &&
      targetDate <= filter.scheduledDateTo
      ? "dest"
      : "skip";
  }

  return "neutral";
}

/**
 * Apply an "insert this task into every matching destination cache, drop
 * it from every other cache that currently holds it" reconciliation across
 * all task-list caches. Used by `useMoveTask`, `useUpdateTask` (when
 * `scheduledDate` changes), and `useReorderTasks` for cross-column drags.
 */
function applyOptimisticMove(
  queryClient: ReturnType<typeof useQueryClient>,
  previousQueries: Array<[readonly unknown[], Task[] | undefined]>,
  taskId: string,
  nextTask: Task,
  targetDate: string | null
) {
  let insertedAnywhere = false;

  previousQueries.forEach(([key, list]) => {
    if (!list) return;
    const filter = key[2] as ListFilter | undefined;
    const classification = classifyListForTarget(filter, targetDate);
    const hadTask = list.some((t) => t.id === taskId);

    if (classification === "dest") {
      insertedAnywhere = true;
      if (hadTask) {
        queryClient.setQueryData<Task[]>(
          key,
          list.map((t) => (t.id === taskId ? nextTask : t))
        );
      } else {
        queryClient.setQueryData<Task[]>(key, [...list, nextTask]);
      }
    } else if (classification === "skip" && hadTask) {
      queryClient.setQueryData<Task[]>(
        key,
        list.filter((t) => t.id !== taskId)
      );
    } else if (classification === "neutral" && hadTask) {
      // The cache is broad — replace the task in place so its fields are
      // up to date.
      queryClient.setQueryData<Task[]>(
        key,
        list.map((t) => (t.id === taskId ? nextTask : t))
      );
    }
  });

  // If no existing cache classified as a destination, the destination
  // DayColumn / Sidebar will fetch on its own when it mounts. We don't
  // synthesize a phantom cache because we can't predict the consumer's
  // exact query key (limits etc.).
  return insertedAnywhere;
}

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
  const { record } = useUndoRedo();

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
    onSuccess: (newTask, input, context) => {
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

      // Undo a create by deleting it; redo re-creates. The id can change
      // across redo, so track it in a holder.
      try {
        const holder = { id: newTask.id };
        record({
          label: "Create task",
          undo: async () => {
            await getApi().tasks.delete(holder.id);
            invalidateTaskCaches(queryClient);
          },
          redo: async () => {
            const recreated = await getApi().tasks.create(input);
            holder.id = recreated.id;
            invalidateTaskCaches(queryClient);
          },
        });
      } catch {
        // never let history bookkeeping break task creation
      }

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
  const { record } = useUndoRedo();

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
      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      await queryClient.cancelQueries({ queryKey: taskKeys.detail(id) });

      const previousTask = queryClient.getQueryData<Task>(taskKeys.detail(id));
      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });

      // Build the optimistic next-task representation. We strip undefined
      // values from `data` so callers passing `{ priority: undefined }` to
      // mean "no change" don't accidentally clobber the existing field.
      const cleanedPatch: Partial<Task> = {};
      for (const [k, v] of Object.entries(data)) {
        if (v !== undefined) {
          (cleanedPatch as Record<string, unknown>)[k] = v;
        }
      }

      const baseTask: Task | undefined =
        previousTask ??
        (previousQueries
          .map(([, list]) => list?.find((t) => t.id === id))
          .find((t): t is Task => t !== undefined));

      const nextTask: Task | null = baseTask
        ? ({ ...baseTask, ...cleanedPatch, updatedAt: new Date() } as Task)
        : null;

      if (nextTask) {
        queryClient.setQueryData<Task>(taskKeys.detail(id), nextTask);
      }

      // If scheduledDate is part of the patch, the task moves between list
      // caches — drop it from its source list and inject it into the
      // destination list. Otherwise just update it in place wherever it
      // currently lives.
      const isMovingDate =
        Object.prototype.hasOwnProperty.call(data, "scheduledDate");

      if (isMovingDate && nextTask) {
        const targetDate = data.scheduledDate ?? null;
        applyOptimisticMove(
          queryClient,
          previousQueries,
          id,
          nextTask,
          targetDate
        );
      } else if (nextTask) {
        queryClient.setQueriesData<Task[]>(
          { queryKey: taskKeys.lists() },
          (old) => {
            if (!old) return old;
            return old.map((task) => (task.id === id ? nextTask : task));
          }
        );
      }

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
    onSuccess: (updatedTask, variables, context) => {
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

      // Record an undo that restores the previous values of the changed
      // fields. We read the pre-mutation task from the snapshot captured in
      // onMutate.
      try {
        const prev =
          context?.previousTask ??
          context?.previousQueries
            ?.map(([, list]) => list?.find((t) => t.id === variables.id))
            .find((t): t is Task => t !== undefined);
        const dataRec = variables.data as unknown as Record<string, unknown>;
        const changedKeys = Object.keys(dataRec).filter(
          (k) => dataRec[k] !== undefined
        );
        if (prev && changedKeys.length > 0) {
          const prevRec = prev as unknown as Record<string, unknown>;
          const prevPatch: Record<string, unknown> = {};
          const nextPatch: Record<string, unknown> = {};
          for (const k of changedKeys) {
            prevPatch[k] = prevRec[k] ?? null;
            nextPatch[k] = dataRec[k];
          }
          const id = variables.id;
          const label =
            changedKeys.length === 1 && changedKeys[0] === "scheduledDate"
              ? "Move task"
              : changedKeys.length === 1 && changedKeys[0] === "priority"
                ? "Change priority"
                : "Edit task";
          record({
            label,
            undo: async () => {
              await getApi().tasks.update(id, prevPatch as UpdateTaskInput);
              invalidateTaskCaches(queryClient);
            },
            redo: async () => {
              await getApi().tasks.update(id, nextPatch as UpdateTaskInput);
              invalidateTaskCaches(queryClient);
            },
          });
        }
      } catch {
        // history bookkeeping must never break the update
      }
    },
  });
}

/**
 * Delete a task with an optimistic removal so the card vanishes immediately.
 */
export function useDeleteTask() {
  const queryClient = useQueryClient();
  const { record } = useUndoRedo();

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
    onSuccess: (_deletedId, id, context) => {
      // Time blocks may reference this task (calendar shows the title);
      // a single targeted invalidation keeps the calendar honest. The WS
      // echo also covers cross-device.
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });

      // Undo a delete by recreating the task from the snapshot. The recreated
      // task gets a new id (subtasks/attachments are not restored), tracked in
      // a holder so redo deletes the right one.
      try {
        const task =
          context?.previousDetail ??
          context?.previousQueries
            ?.map(([, list]) => list?.find((t) => t.id === id))
            .find((t): t is Task => t !== undefined);
        if (task) {
          const holder = { id: task.id };
          record({
            label: "Delete task",
            undo: async () => {
              const recreated = await getApi().tasks.create({
                title: task.title,
                notes: task.notes ?? undefined,
                scheduledDate: task.scheduledDate ?? undefined,
                estimatedMins: task.estimatedMins ?? undefined,
                priority: task.priority,
              });
              holder.id = recreated.id;
              invalidateTaskCaches(queryClient);
            },
            redo: async () => {
              await getApi().tasks.delete(holder.id);
              invalidateTaskCaches(queryClient);
            },
          });
        }
      } catch {
        // history bookkeeping must never break delete
      }

      toast({
        title: "Task deleted",
        description: "The task has been deleted.",
      });
    },
  });
}

/**
 * Permanently delete many tasks at once (backlog cleanup).
 *
 * Optimistically removes every id from the list + infinite-search caches and
 * rolls them all back on error. Shows a single count toast. No undo for v1 —
 * the Clean up Backlog dialog gates this behind an explicit confirm.
 */
export function useBatchDeleteTasks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]): Promise<string[]> => {
      const api = getApi();
      await api.tasks.batchDelete(ids);
      return ids;
    },
    onMutate: async (ids) => {
      const idSet = new Set(ids);
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
      // Snapshot the per-task detail caches before removing them so a failed
      // batch can fully restore them (parity with useDeleteTask).
      const previousDetails = ids.map(
        (id) =>
          [id, queryClient.getQueryData<Task>(taskKeys.detail(id))] as const
      );

      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => (old ? old.filter((t) => !idSet.has(t.id)) : old)
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
              data: page.data.filter((t) => !idSet.has(t.id)),
            })),
          };
        }
      );
      ids.forEach((id) =>
        queryClient.removeQueries({ queryKey: taskKeys.detail(id) })
      );

      return { previousQueries, previousInfinite, previousDetails };
    },
    onError: (error, _ids, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      context?.previousInfinite?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      context?.previousDetails?.forEach(([id, detail]) => {
        if (detail) queryClient.setQueryData(taskKeys.detail(id), detail);
      });
      // The delete is chunked, so a mid-batch failure may have already
      // removed some tasks server-side. Refetch to converge on server truth
      // instead of trusting the rolled-back optimistic snapshot.
      queryClient.invalidateQueries({ queryKey: taskKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: ["tasks", "search", "infinite"],
      });
      toast({
        variant: "destructive",
        title: "Failed to delete tasks",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSuccess: (ids) => {
      // Calendar time blocks may reference deleted tasks.
      queryClient.invalidateQueries({ queryKey: timeBlockKeys.lists() });
      toast({
        title: `Deleted ${ids.length} task${ids.length === 1 ? "" : "s"}`,
        description: "They've been permanently removed.",
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
  const { record } = useUndoRedo();

  return useMutation({
    mutationFn: async ({
      id,
      completed,
    }: {
      id: string;
      completed: boolean;
    }): Promise<Task> => {
      const api = getApi();

      if (!completed) {
        return await api.tasks.uncomplete(id);
      }

      // Server's complete endpoint auto-stops any running timer and saves actualMins
      const completedTask = await api.tasks.complete(id);

      // Log the completion on the day it actually happened: if the task was
      // scheduled for a different day (e.g. tomorrow), move it to today so it
      // lands in today's Done list rather than staying on its planned day.
      const today = format(new Date(), "yyyy-MM-dd");
      if (completedTask.scheduledDate && completedTask.scheduledDate !== today) {
        return await api.tasks.update(id, { scheduledDate: today });
      }
      return completedTask;
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

      // Resolve the task's current scheduledDate so we can mirror the
      // "log completion on today" move (see mutationFn) in the optimistic
      // cache, and remember the original day so undo can restore it.
      let originalScheduledDate = previousTask?.scheduledDate ?? null;
      if (!previousTask) {
        for (const [, list] of previousQueries) {
          const found = list?.find((t) => t.id === id);
          if (found) {
            originalScheduledDate = found.scheduledDate;
            break;
          }
        }
      }

      const today = format(new Date(), "yyyy-MM-dd");
      const movedFromDate =
        completed && originalScheduledDate && originalScheduledDate !== today
          ? originalScheduledDate
          : null;

      // Apply completion (and the today-move when relevant) to a task in cache.
      const patchTask = (task: Task): Task => ({
        ...task,
        completedAt: optimisticCompletedAt,
        updatedAt: new Date(),
        ...(movedFromDate ? { scheduledDate: today } : {}),
      });

      if (previousTask) {
        queryClient.setQueryData<Task>(
          taskKeys.detail(id),
          patchTask(previousTask)
        );
      }

      queryClient.setQueriesData<Task[]>(
        { queryKey: taskKeys.lists() },
        (old) => {
          if (!old) return old;
          return old.map((task) => (task.id === id ? patchTask(task) : task));
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
                task.id === id ? patchTask(task) : task
              ),
            })),
          };
        }
      );

      return {
        previousTask,
        previousQueries,
        previousInfiniteQueries,
        id,
        movedFromDate,
      };
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
    onSuccess: (updatedTask, variables, context) => {
      writeTaskToCaches(queryClient, updatedTask);

      // Undo toggles completion back. When completing also moved the task to
      // today (movedFromDate set), undo restores its original planned day.
      try {
        const { id, completed } = variables;
        const movedFromDate = context?.movedFromDate ?? null;
        record({
          label: completed ? "Complete task" : "Uncomplete task",
          undo: async () => {
            const api = getApi();
            let task: Task;
            if (completed) {
              task = await api.tasks.uncomplete(id);
              if (movedFromDate)
                task = await api.tasks.update(id, {
                  scheduledDate: movedFromDate,
                });
            } else {
              task = await api.tasks.complete(id);
            }
            writeTaskToCaches(queryClient, task);
            invalidateTaskCaches(queryClient);
          },
          redo: async () => {
            const api = getApi();
            let task: Task;
            if (completed) {
              task = await api.tasks.complete(id);
              if (movedFromDate)
                task = await api.tasks.update(id, {
                  scheduledDate: format(new Date(), "yyyy-MM-dd"),
                });
            } else {
              task = await api.tasks.uncomplete(id);
            }
            writeTaskToCaches(queryClient, task);
            invalidateTaskCaches(queryClient);
          },
        });
      } catch {
        // history bookkeeping must never break completion
      }
    },
  });
}

/**
 * Move a task to a different date with optimistic updates
 * for instant visual feedback during drag-and-drop
 */
export function useMoveTask() {
  const queryClient = useQueryClient();
  const { record } = useUndoRedo();

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

      // Find the task wherever it currently lives.
      let movedTask: Task | undefined;
      for (const [, list] of previousQueries) {
        if (!list) continue;
        const found = list.find((t) => t.id === id);
        if (found) {
          movedTask = found;
          break;
        }
      }
      const detailTask = queryClient.getQueryData<Task>(taskKeys.detail(id));
      const sourceTask = movedTask ?? detailTask;

      const updatedTask = sourceTask
        ? {
            ...sourceTask,
            scheduledDate: targetDate,
            ...(position !== undefined ? { position } : {}),
          }
        : null;

      if (updatedTask) {
        applyOptimisticMove(
          queryClient,
          previousQueries,
          id,
          updatedTask,
          targetDate
        );
        queryClient.setQueryData(taskKeys.detail(id), updatedTask);
      }

      return {
        previousQueries,
        previousScheduledDate: sourceTask?.scheduledDate ?? null,
      };
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
    onSuccess: (movedTask, variables, context) => {
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

      // Undo a move by sending the task back to its previous day.
      try {
        const { id, targetDate } = variables;
        const prevDate = context?.previousScheduledDate ?? null;
        if (prevDate !== targetDate) {
          record({
            label: "Move task",
            undo: async () => {
              await getApi().tasks.update(id, { scheduledDate: prevDate });
              invalidateTaskCaches(queryClient);
            },
            redo: async () => {
              await getApi().tasks.update(id, { scheduledDate: targetDate });
              invalidateTaskCaches(queryClient);
            },
          });
        }
      } catch {
        // history bookkeeping must never break a move
      }
    },
  });
}

/**
 * Reorder tasks within a date or backlog.
 *
 * The server's reorder endpoint also handles moving tasks between dates —
 * any task in `taskIds` whose `scheduledDate` differs from `date` is moved
 * server-side. To make cross-column DnD feel instant we mirror that on the
 * client: tasks that aren't already in the destination cache are pulled
 * from whichever source cache currently holds them.
 */
export function useReorderTasks() {
  const queryClient = useQueryClient();
  const { record } = useUndoRedo();

  return useMutation({
    mutationFn: async ({
      date,
      taskIds,
    }: {
      date: string; // "backlog" for backlog tasks, or "YYYY-MM-DD" for scheduled tasks
      taskIds: string[];
    }): Promise<Task[]> => {
      const api = getApi();
      const input: ReorderTasksInput = { date, taskIds };
      return await api.tasks.reorder(input);
    },
    onMutate: async ({ date, taskIds }) => {
      const isBacklog = date === "backlog";
      const targetScheduledDate: string | null = isBacklog ? null : date;

      await queryClient.cancelQueries({ queryKey: taskKeys.lists() });
      await queryClient.cancelQueries({
        queryKey: ["tasks", "search", "infinite"],
      });

      const previousQueries = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });
      const previousInfiniteQueries = queryClient.getQueriesData({
        queryKey: ["tasks", "search", "infinite"],
      });

      // Capture the pending order of every bucket this reorder touches — the
      // destination plus any source bucket a task is moving *out of* — so undo
      // can restore them all. (A cross-day move otherwise wouldn't return the
      // task to its original day.)
      const orderForBucket = (bucketKey: string): string[] => {
        const entry = previousQueries.find(([key]) => {
          const f = key[2] as ListFilter | undefined;
          return bucketKey === "backlog"
            ? f?.backlog === true
            : f?.scheduledDate === bucketKey;
        });
        return (entry?.[1] ?? [])
          .filter((t) => !t.completedAt)
          .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
          .map((t) => t.id);
      };
      const prevBucketById = new Map<string, string>();
      for (const [, list] of previousQueries) {
        if (!list) continue;
        for (const t of list) {
          if (!prevBucketById.has(t.id)) {
            prevBucketById.set(t.id, t.scheduledDate ?? "backlog");
          }
        }
      }
      const affectedBuckets = new Set<string>([date]);
      for (const tid of taskIds) {
        const src = prevBucketById.get(tid);
        if (src && src !== date) affectedBuckets.add(src);
      }
      const prevBuckets: Record<string, string[]> = {};
      for (const bucketKey of affectedBuckets) {
        prevBuckets[bucketKey] = orderForBucket(bucketKey);
      }

      // Build a lookup of every task currently visible in any list cache so
      // we can resolve tasks that the destination cache may not yet know
      // about (i.e. ones being dragged in from another column).
      const taskById = new Map<string, Task>();
      for (const [, list] of previousQueries) {
        if (!list) continue;
        for (const t of list) {
          if (!taskById.has(t.id)) taskById.set(t.id, t);
        }
      }
      const taskIdSet = new Set(taskIds);

      // For each task being reordered: walk every list cache and route the
      // updated record into the matching destination caches, drop it from
      // any other cache that still has it. We also rebuild every
      // destination cache so the *order* matches `taskIds` exactly.
      const updatedById = new Map<string, Task>();
      for (let i = 0; i < taskIds.length; i++) {
        const id = taskIds[i];
        if (!id) continue;
        const existing = taskById.get(id);
        if (!existing) continue;
        const next: Task = {
          ...existing,
          position: i,
          scheduledDate: targetScheduledDate,
        };
        updatedById.set(id, next);
      }

      previousQueries.forEach(([key, list]) => {
        if (!list) return;
        const filter = key[2] as ListFilter | undefined;
        const classification = classifyListForTarget(
          filter,
          targetScheduledDate
        );

        if (classification === "dest") {
          // Rebuild this cache: ordered taskIds first, then any tasks the
          // cache already had that aren't part of the reorder (e.g.
          // completed tasks pinned at the end).
          const ordered: Task[] = [];
          for (const id of taskIds) {
            const t = updatedById.get(id);
            if (t) ordered.push(t);
          }
          const tail = list.filter((t) => !taskIdSet.has(t.id));
          queryClient.setQueryData<Task[]>(key, [...ordered, ...tail]);
        } else if (classification === "skip") {
          // This cache rules out the destination — make sure none of the
          // moved tasks linger here.
          const filtered = list.filter((t) => !taskIdSet.has(t.id));
          if (filtered.length !== list.length) {
            queryClient.setQueryData<Task[]>(key, filtered);
          }
        } else {
          // Neutral / broad cache — replace tasks in place so their fields
          // are accurate.
          let mutated = false;
          const next = list.map((t) => {
            const replacement = updatedById.get(t.id);
            if (replacement) {
              mutated = true;
              return replacement;
            }
            return t;
          });
          if (mutated) {
            queryClient.setQueryData<Task[]>(key, next);
          }
        }
      });

      // Update detail caches too.
      for (const [id, t] of updatedById) {
        queryClient.setQueryData(taskKeys.detail(id), t);
      }

      // Mirror the change in any infinite-search caches.
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
                  scheduledDate: targetScheduledDate,
                };
              }),
            })),
          };
        }
      );

      return {
        previousQueries,
        previousInfiniteQueries,
        targetScheduledDate,
        taskIds,
        prevBuckets,
      };
    },
    onError: (error, _variables, context) => {
      context?.previousQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      context?.previousInfiniteQueries?.forEach(([key, data]) => {
        queryClient.setQueryData(key, data);
      });
      toast({
        variant: "destructive",
        title: "Failed to reorder tasks",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
    onSuccess: (serverTasks, variables, context) => {
      // The server returns the canonical task list for the destination
      // bucket. Distribute it to every cache that classifies as a
      // destination for the target date / backlog, then update detail
      // caches.
      if (!Array.isArray(serverTasks)) return;
      const targetDate = context?.targetScheduledDate ?? null;
      const allListKeys = queryClient.getQueriesData<Task[]>({
        queryKey: taskKeys.lists(),
      });
      allListKeys.forEach(([key, list]) => {
        const filter = key[2] as ListFilter | undefined;
        if (classifyListForTarget(filter, targetDate) !== "dest") return;
        // Preserve any tasks that the cache had which aren't part of the
        // server response (e.g. completed tasks the reorder doesn't touch
        // when called with only pending taskIds).
        const movedIds = new Set(serverTasks.map((t) => t.id));
        const tail = (list ?? []).filter(
          (t) => !movedIds.has(t.id) && !context?.taskIds.includes(t.id)
        );
        queryClient.setQueryData<Task[]>(key, [...serverTasks, ...tail]);
      });
      for (const t of serverTasks) {
        queryClient.setQueryData(taskKeys.detail(t.id), t);
      }

      // Undo by restoring the previous order of *every* bucket the reorder
      // touched. For a within-day reorder that's just this day; for a
      // cross-day move it's the destination day (minus the task) and the
      // source day (with the task back in its old spot) — so the task
      // actually returns to where it came from.
      try {
        const { date, taskIds } = variables;
        const prevBuckets = context?.prevBuckets ?? {};
        const buckets = Object.entries(prevBuckets).filter(
          ([, order]) => order.length > 0
        );
        if (buckets.length > 0) {
          record({
            label: buckets.length > 1 ? "Move task" : "Reorder tasks",
            undo: async () => {
              for (const [bucket, order] of buckets) {
                await getApi().tasks.reorder({ date: bucket, taskIds: order });
              }
              invalidateTaskCaches(queryClient);
            },
            redo: async () => {
              await getApi().tasks.reorder({ date, taskIds });
              invalidateTaskCaches(queryClient);
            },
          });
        }
      } catch {
        // history bookkeeping must never break reorder
      }
    },
  });
}
