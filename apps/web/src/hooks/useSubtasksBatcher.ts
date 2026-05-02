import * as React from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import type { Subtask } from "@open-sunsama/types";
import { getApi } from "@/lib/api";

/**
 * Per-render coalescing batcher for `GET /tasks/:id/subtasks`.
 *
 * The kanban renders dozens of `<TaskCard>` components at once, each calling
 * `useSubtasks(task.id)`. Without this, every card fires its own roundtrip
 * — 30+ requests fan out and Tiptap, the editor chunk, and the kanban data
 * all get queued behind them on the same connection. We instead funnel
 * those reads into a single `POST /tasks/subtasks-batch` request and feed
 * each `useSubtasks(taskId)` caller's queryFn promise the right slice.
 *
 * Coalescing window: a microtask. Anything that registers within the same
 * synchronous render pass (or React Query refetch tick) joins the same
 * batch.
 *
 * Design notes:
 * - We do NOT short-circuit on cached data. React Query already skips
 *   `queryFn` entirely when cached data is fresh (within staleTime), and
 *   when it doesn't skip — e.g. the WebSocket layer just invalidated the
 *   query for a cross-device update — we want a real network fetch.
 * - We do NOT call `queryClient.setQueryData` from the batch resolution.
 *   Doing so races with optimistic mutations: a mutation's `onMutate`
 *   calls `cancelQueries(...)` which signals queries to ignore their
 *   in-flight result, but a direct `setQueryData` write bypasses that
 *   guard and clobbers the optimistic snapshot. Resolving the per-entry
 *   promises is enough — React Query takes care of writing the cache for
 *   each subscriber that's still active.
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

  fetch(taskId: string): Promise<Subtask[]> {
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
      batcher = new SubtasksBatcher();
      batchersByQueryClient.set(queryClient, batcher);
    }
    return batcher;
  }, [queryClient]);
}
