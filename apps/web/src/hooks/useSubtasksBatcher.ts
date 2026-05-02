import * as React from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { Subtask } from "@open-sunsama/types";
import { getApi } from "@/lib/api";
import { subtaskKeys } from "./useSubtasks";

/**
 * Per-render coalescing batcher for `GET /tasks/:id/subtasks`.
 *
 * The kanban renders dozens of `<TaskCard>` components at once, each calling
 * `useSubtasks(task.id)`. Without this, every card fires its own roundtrip
 * — 30+ requests fan out and Tiptap, the editor chunk, and the kanban data
 * all get queued behind them on the same connection. We instead funnel
 * those reads into a single `POST /tasks/subtasks-batch` request and
 * distribute the result into per-task query caches that the
 * `useSubtasks(taskId)` callers already subscribe to.
 *
 * Coalescing window: a microtask. Anything that registers within the same
 * synchronous render pass joins the same batch.
 */

type Resolve = (subtasks: Subtask[]) => void;
type Reject = (err: unknown) => void;
type PendingEntry = {
  resolve: Resolve;
  reject: Reject;
};

class SubtasksBatcher {
  private pending = new Map<string, PendingEntry[]>();
  private flushScheduled = false;

  constructor(private queryClient: QueryClient) {}

  fetch(taskId: string): Promise<Subtask[]> {
    // Return any cached data immediately — the React Query layer already
    // dedupes once data is in the cache, but we still need to honour an
    // explicit `enabled: false → true` transition where no cache exists.
    const cached = this.queryClient.getQueryData<Subtask[]>(
      subtaskKeys.list(taskId)
    );
    if (cached) return Promise.resolve(cached);

    return new Promise<Subtask[]>((resolve, reject) => {
      const entries = this.pending.get(taskId);
      if (entries) {
        entries.push({ resolve, reject });
      } else {
        this.pending.set(taskId, [{ resolve, reject }]);
      }
      this.scheduleFlush();
    });
  }

  private scheduleFlush() {
    if (this.flushScheduled) return;
    this.flushScheduled = true;
    queueMicrotask(() => {
      this.flushScheduled = false;
      void this.flush();
    });
  }

  private async flush() {
    const taskIds = Array.from(this.pending.keys());
    const pendingSnapshot = this.pending;
    this.pending = new Map();

    if (taskIds.length === 0) return;

    try {
      const api = getApi();
      const grouped = await api.subtasks.batchList(taskIds);

      for (const [taskId, entries] of pendingSnapshot) {
        const subtasks = grouped[taskId] ?? [];
        // Seed the per-task cache so any future `useSubtasks(taskId)`
        // mount finds data immediately.
        this.queryClient.setQueryData(subtaskKeys.list(taskId), subtasks);
        for (const entry of entries) entry.resolve(subtasks);
      }
    } catch (err) {
      for (const entries of pendingSnapshot.values()) {
        for (const entry of entries) entry.reject(err);
      }
    }
  }
}

const batchersByQueryClient = new WeakMap<QueryClient, SubtasksBatcher>();

export function useSubtasksBatcher(): SubtasksBatcher {
  const queryClient = useQueryClient();
  return React.useMemo(() => {
    let batcher = batchersByQueryClient.get(queryClient);
    if (!batcher) {
      batcher = new SubtasksBatcher(queryClient);
      batchersByQueryClient.set(queryClient, batcher);
    }
    return batcher;
  }, [queryClient]);
}
