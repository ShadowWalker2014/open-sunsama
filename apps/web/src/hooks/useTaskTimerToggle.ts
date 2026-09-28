import * as React from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { Task } from "@open-sunsama/types";
import { getApi } from "@/lib/api";
import { taskKeys, timerKeys } from "@/lib/query-keys";
import { toast } from "@/hooks/use-toast";

// One start or stop at a time across the app: a second click while the
// first request is in flight would race it.
let inFlight = false;

function toMs(value: unknown): number {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" || typeof value === "number")
    return new Date(value).getTime();
  return 0;
}

/** Seconds a task has logged right now; mirrors the API's timer rules. */
export function loggedSeconds(task: Task, now = Date.now()): number {
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

function stopped(task: Task): Task {
  const seconds = loggedSeconds(task);
  return {
    ...task,
    timerStartedAt: null,
    timerAccumulatedSeconds: seconds,
    actualMins: Math.ceil(seconds / 60),
  };
}

/**
 * Starts or stops a task's timer. The change shows at once (and any other
 * running timer stops, as the server does); a failed request puts the
 * previous state back and says so. Clicks while a request is in flight are
 * ignored, so a double click can't start and stop in one go.
 */
export function useTaskTimerToggle() {
  const qc = useQueryClient();

  return React.useCallback(
    async (taskId: string) => {
      if (inFlight) return;
      const task = findTask(qc, taskId);
      if (!task) return;
      inFlight = true;

      const wasRunning = !!task.timerStartedAt;
      // Task lists, details and the active timer all live under "tasks".
      const snapshots = qc.getQueriesData({ queryKey: taskKeys.all });

      if (wasRunning) {
        writeTask(qc, stopped(task));
        qc.setQueryData(timerKeys.active(), null);
      } else {
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
        inFlight = false;
        void qc.invalidateQueries({ queryKey: timerKeys.active() });
      }
    },
    [qc]
  );
}
