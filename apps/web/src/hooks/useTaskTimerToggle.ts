import * as React from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { Subtask, Task } from "@open-sunsama/types";
import { getApi } from "@/lib/api";
import { subtaskKeys, taskKeys, timerKeys } from "@/lib/query-keys";
import { toast } from "@/hooks/use-toast";

// Starts and stops run one after another across the app, so a stop clicked
// while its start is still saving waits for it instead of racing it.
let queue: Promise<void> = Promise.resolve();

function enqueue(run: () => Promise<void>): Promise<void> {
  queue = queue.then(run, run);
  return queue;
}

/**
 * Whether a click on a timer button should count: the second click of a
 * double click (event.detail 2) would stop what the first one started.
 */
export function isSingleClick(e: { detail: number }): boolean {
  return e.detail <= 1;
}

function toMs(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number")
    return new Date(value).getTime();
  return 0;
}

interface Timed {
  timerStartedAt: Date | string | null;
  timerAccumulatedSeconds: number;
  actualMins?: number | null;
}

/** Seconds a task or subtask has logged right now; mirrors the API. */
export function loggedSeconds(task: Timed, now = Date.now()): number {
  if (task.timerStartedAt) {
    const elapsed = Math.round((now - toMs(task.timerStartedAt)) / 1000);
    return task.timerAccumulatedSeconds + Math.max(0, elapsed);
  }
  const mins = task.actualMins ?? 0;
  const seconds = task.timerAccumulatedSeconds ?? 0;
  return seconds > 0 && Math.ceil(seconds / 60) === mins ? seconds : mins * 60;
}

function findTask(qc: QueryClient, id: string): Task | undefined {
  const detail = qc.getQueryData<Task>(taskKeys.detail(id));
  if (detail) return detail;
  for (const [, list] of qc.getQueriesData<Task[]>({ queryKey: taskKeys.lists() })) {
    const found = list?.find((t) => t.id === id);
    if (found) return found;
  }
  return undefined;
}

function writeTask(qc: QueryClient, task: Task) {
  qc.setQueryData<Task>(taskKeys.detail(task.id), (old) =>
    old ? { ...old, ...task } : task
  );
  qc.setQueriesData<Task[]>({ queryKey: taskKeys.lists() }, (old) =>
    old?.map((t) => (t.id === task.id ? { ...t, ...task } : t))
  );
}

function stopped<T extends Timed>(task: T): T {
  const seconds = loggedSeconds(task);
  return {
    ...task,
    timerStartedAt: null,
    timerAccumulatedSeconds: seconds,
    actualMins: Math.ceil(seconds / 60),
  } as T;
}

/**
 * Starts or stops a task's timer. The change shows at once (and any other
 * running timer stops, as the server does); a failed request puts the
 * previous state back and says so. Buttons pass clicks through
 * isSingleClick so a double click counts once.
 */
export function useTaskTimerToggle() {
  const qc = useQueryClient();

  return React.useCallback(
    (taskId: string) => enqueue(async () => {
      const task = findTask(qc, taskId);
      if (!task) return;

      const wasRunning = !!task.timerStartedAt;
      // Task lists, details and the active timer all live under "tasks".
      const snapshots = qc.getQueriesData({ queryKey: taskKeys.all });

      if (wasRunning) {
        writeTask(qc, stopped(task));
        stopCachedSubtasks(qc);
        qc.setQueryData(timerKeys.active(), null);
      } else {
        stopCachedSubtasks(qc);
        const others = qc
          .getQueriesData<Task[]>({ queryKey: taskKeys.lists() })
          .flatMap(([, list]) => list ?? [])
          .filter((t) => t.id !== taskId && t.timerStartedAt);
        for (const other of others) writeTask(qc, stopped(other));
        const started: Task = {
          ...task,
          timerStartedAt: new Date(),
          timerAccumulatedSeconds: loggedSeconds(task),
        };
        writeTask(qc, started);
        qc.setQueryData(timerKeys.active(), started);
      }

      try {
        const api = getApi();
        if (wasRunning) {
          writeTask(qc, await api.tasks.timerStop(taskId));
        } else {
          const result = await api.tasks.timerStart(taskId);
          writeTask(qc, result.task);
          if (result.stoppedTask) writeTask(qc, result.stoppedTask);
        }
      } catch (error) {
        for (const [key, data] of snapshots) qc.setQueryData(key, data);
        toast({
          variant: "destructive",
          title: wasRunning ? "Couldn't stop the timer" : "Couldn't start the timer",
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        void qc.invalidateQueries({ queryKey: timerKeys.active() });
      }
    }),
    [qc]
  );
}

/** 9 → "0:00:09", 3725 → "1:02:05": a running timer, as Sunsama shows it. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h}:${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

function writeSubtask(qc: QueryClient, subtask: Subtask) {
  qc.setQueryData<Subtask[]>(subtaskKeys.list(subtask.taskId), (old) =>
    old?.map((s) => (s.id === subtask.id ? { ...s, ...subtask } : s))
  );
}

/** Every running subtask timer in the cache, optionally sparing one. */
function stopCachedSubtasks(qc: QueryClient, exceptId?: string) {
  for (const [, list] of qc.getQueriesData<Subtask[]>({
    queryKey: subtaskKeys.lists(),
  })) {
    for (const s of list ?? []) {
      if (s.timerStartedAt && s.id !== exceptId) writeSubtask(qc, stopped(s));
    }
  }
}

/**
 * Starts or stops one subtask's timer. Starting it starts its task's timer
 * too (stopping any other), so the task's actual time includes it; stopping
 * it stops the task's. Optimistic and rolled back on failure.
 */
export function useSubtaskTimerToggle() {
  const qc = useQueryClient();

  return React.useCallback(
    (taskId: string, subtaskId: string) => enqueue(async () => {
      const subtask = qc
        .getQueryData<Subtask[]>(subtaskKeys.list(taskId))
        ?.find((s) => s.id === subtaskId);
      const task = findTask(qc, taskId);
      if (!subtask || !task) return;

      const wasRunning = !!subtask.timerStartedAt;
      const snapshots = [
        ...qc.getQueriesData({ queryKey: taskKeys.all }),
        ...qc.getQueriesData({ queryKey: subtaskKeys.all }),
      ];

      if (wasRunning) {
        writeSubtask(qc, stopped(subtask));
        if (task.timerStartedAt) writeTask(qc, stopped(task));
        qc.setQueryData(timerKeys.active(), null);
      } else {
        stopCachedSubtasks(qc, subtaskId);
        writeSubtask(qc, {
          ...subtask,
          timerStartedAt: new Date(),
          timerAccumulatedSeconds: loggedSeconds(subtask),
        });
        if (!task.timerStartedAt) {
          const others = qc
            .getQueriesData<Task[]>({ queryKey: taskKeys.lists() })
            .flatMap(([, list]) => list ?? [])
            .filter((t) => t.id !== taskId && t.timerStartedAt);
          for (const other of others) writeTask(qc, stopped(other));
          const started: Task = {
            ...task,
            timerStartedAt: new Date(),
            timerAccumulatedSeconds: loggedSeconds(task),
          };
          writeTask(qc, started);
          qc.setQueryData(timerKeys.active(), started);
        }
      }

      try {
        const api = getApi();
        if (wasRunning) {
          const result = await api.subtasks.timerStop(taskId, subtaskId);
          writeSubtask(qc, result.subtask);
          writeTask(qc, result.task);
        } else {
          const result = await api.subtasks.timerStart(taskId, subtaskId);
          writeSubtask(qc, result.subtask);
          writeTask(qc, result.task);
          if (result.stoppedTask) writeTask(qc, result.stoppedTask);
        }
      } catch (error) {
        for (const [key, data] of snapshots) qc.setQueryData(key, data);
        toast({
          variant: "destructive",
          title: wasRunning ? "Couldn't stop the timer" : "Couldn't start the timer",
          description: error instanceof Error ? error.message : undefined,
        });
      } finally {
        void qc.invalidateQueries({ queryKey: timerKeys.active() });
      }
    }),
    [qc]
  );
}
