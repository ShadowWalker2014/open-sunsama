import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { Task } from "@open-sunsama/types";
import { addDays, format, subDays } from "date-fns";
import { getApi } from "@/lib/api";
import { taskKeys } from "@/hooks/useTasks";
import { useAuth } from "@/hooks/useAuth";

/**
 * The number of days to prefetch in each direction around the current
 * focused day. Matches the kanban board's BUFFER_DAYS so all visible columns
 * are seeded by a single roundtrip.
 */
const PREFETCH_BUFFER_DAYS = 14;

/**
 * Per-day cache key used by `DayColumn` (`useTasks({ scheduledDate, limit: 200 })`).
 * We reproduce it here so we can seed the cache by hand from the range query.
 */
function dayCacheKey(dateString: string) {
  return taskKeys.list({ scheduledDate: dateString, limit: 200 });
}

interface RangePrefetchOptions {
  /**
   * Center date for the prefetch window. Defaults to today.
   */
  centerDate?: Date;
  /**
   * Days to prefetch on each side of `centerDate`.
   */
  bufferDays?: number;
}

/**
 * Fetches the entire visible date range for the kanban board in a single
 * request and seeds the per-day list caches that `DayColumn` reads from.
 *
 * Without this, the kanban makes one request per visible column on first
 * load (today, today+1, today+2, today-1, …). On a wide monitor that's a
 * dozen or more parallel requests and the columns trickle in. With this
 * hook, the columns hydrate together as soon as the range request resolves.
 */
export function useKanbanRangePrefetch(options: RangePrefetchOptions = {}) {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const center = options.centerDate ?? new Date();
  const bufferDays = options.bufferDays ?? PREFETCH_BUFFER_DAYS;

  const fromDate = subDays(center, bufferDays);
  const toDate = addDays(center, bufferDays);
  const fromString = format(fromDate, "yyyy-MM-dd");
  const toString = format(toDate, "yyyy-MM-dd");

  const query = useQuery({
    queryKey: [
      ...taskKeys.lists(),
      "range",
      { from: fromString, to: toString },
    ],
    queryFn: async (): Promise<Task[]> => {
      const api = getApi();
      const response = await api.tasks.list({
        scheduledDateFrom: fromString,
        scheduledDateTo: toString,
        limit: 1000,
      });
      return response.data ?? [];
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  // When the range query resolves, group the result by scheduledDate and
  // populate the per-day caches that DayColumn already subscribes to.
  // We use the version-stable string representation of the data length+ids
  // to avoid re-running this effect on object-identity churn alone.
  const data = query.data;
  const fingerprint = React.useMemo(() => {
    if (!data) return null;
    let fp = "";
    for (const t of data) {
      fp += t.id + ":" + (t.updatedAt instanceof Date ? t.updatedAt.toISOString() : String(t.updatedAt)) + "|";
    }
    return fp;
  }, [data]);

  React.useEffect(() => {
    if (!data) return;

    const byDate = new Map<string, Task[]>();
    for (const task of data) {
      if (!task.scheduledDate) continue;
      const arr = byDate.get(task.scheduledDate);
      if (arr) {
        arr.push(task);
      } else {
        byDate.set(task.scheduledDate, [task]);
      }
    }

    // Seed every day inside the range, even empty ones, so DayColumn doesn't
    // fall back to an isLoading state. We deliberately overwrite existing
    // per-day caches here UNLESS the per-day cache contains an optimistic
    // task (we'd lose the user's pending insert) or its query state shows
    // a recent fetch that's newer than the range data we just received.
    const rangeFetchedAt = queryClient.getQueryState([
      ...taskKeys.lists(),
      "range",
      { from: format(subDays(center, bufferDays), "yyyy-MM-dd"), to: format(addDays(center, bufferDays), "yyyy-MM-dd") },
    ])?.dataUpdatedAt ?? Date.now();

    for (let i = -bufferDays; i <= bufferDays; i++) {
      const d = addDays(center, i);
      const key = format(d, "yyyy-MM-dd");
      const tasks = byDate.get(key) ?? [];
      const cacheKey = dayCacheKey(key);
      const existing = queryClient.getQueryData<Task[]>(cacheKey);

      if (existing && existing.some((t) => t.id.startsWith("optimistic-"))) {
        continue;
      }

      const dayState = queryClient.getQueryState(cacheKey);
      // If a per-day query already has data fetched AFTER the range query,
      // trust it instead — it's more specific and may include fresher
      // optimistic-update reconciliations.
      if (
        dayState?.dataUpdatedAt &&
        dayState.dataUpdatedAt > rangeFetchedAt &&
        existing
      ) {
        continue;
      }

      queryClient.setQueryData(cacheKey, tasks);
    }
  }, [fingerprint, data, queryClient, bufferDays, center]);

  return query;
}
