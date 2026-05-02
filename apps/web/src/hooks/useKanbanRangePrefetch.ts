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
 * Upper bound on a single range fetch. We refuse to seed when the API hits
 * this limit, because some days inside the range will be silently truncated
 * and seeding would hide tasks from the user.
 */
const RANGE_FETCH_LIMIT = 1000;

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

  // Stabilise the center reference. Callers often pass `firstVisibleDate ??
  // new Date()` directly, which allocates a new Date object on every render.
  // We bucket to the YYYY-MM-DD string so the rest of the hook depends on
  // a stable primitive and React Query's cache key never churns.
  const rawCenter = options.centerDate ?? null;
  const centerString = React.useMemo(() => {
    return format(rawCenter ?? new Date(), "yyyy-MM-dd");
  }, [
    rawCenter ? format(rawCenter, "yyyy-MM-dd") : null,
  ]);

  const bufferDays = options.bufferDays ?? PREFETCH_BUFFER_DAYS;
  const fromString = React.useMemo(() => {
    const center = new Date(centerString + "T00:00:00");
    return format(subDays(center, bufferDays), "yyyy-MM-dd");
  }, [centerString, bufferDays]);
  const toString = React.useMemo(() => {
    const center = new Date(centerString + "T00:00:00");
    return format(addDays(center, bufferDays), "yyyy-MM-dd");
  }, [centerString, bufferDays]);

  const queryKey = React.useMemo(
    () =>
      [
        ...taskKeys.lists(),
        "range",
        { from: fromString, to: toString },
      ] as const,
    [fromString, toString]
  );

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<{ tasks: Task[]; truncated: boolean }> => {
      const api = getApi();
      const response = await api.tasks.list({
        scheduledDateFrom: fromString,
        scheduledDateTo: toString,
        limit: RANGE_FETCH_LIMIT,
      });
      const tasks = response.data ?? [];
      const total = response.meta?.total ?? tasks.length;
      return { tasks, truncated: total > tasks.length };
    },
    enabled: isAuthenticated,
    staleTime: 30_000,
  });

  const data = query.data;

  React.useEffect(() => {
    if (!data) return;
    // If the API truncated the range we cannot trust the per-day projections;
    // skip seeding and let DayColumn fall back to its own per-day fetches.
    if (data.truncated) return;

    const byDate = new Map<string, Task[]>();
    for (const task of data.tasks) {
      if (!task.scheduledDate) continue;
      const arr = byDate.get(task.scheduledDate);
      if (arr) arr.push(task);
      else byDate.set(task.scheduledDate, [task]);
    }

    const rangeFetchedAt =
      queryClient.getQueryState(queryKey)?.dataUpdatedAt ?? Date.now();
    const center = new Date(centerString + "T00:00:00");

    for (let i = -bufferDays; i <= bufferDays; i++) {
      const d = addDays(center, i);
      const key = format(d, "yyyy-MM-dd");
      const tasks = byDate.get(key) ?? [];
      const cacheKey = dayCacheKey(key);
      const existing = queryClient.getQueryData<Task[]>(cacheKey);

      // Never clobber an in-flight optimistic insert.
      if (existing && existing.some((t) => t.id.startsWith("optimistic-"))) {
        continue;
      }

      // If the per-day query already has data fetched after the range
      // started, trust it — it's more specific and may include reconciled
      // mutations that haven't echoed back through this range fetch yet.
      const dayState = queryClient.getQueryState(cacheKey);
      if (
        existing &&
        dayState?.dataUpdatedAt &&
        dayState.dataUpdatedAt >= rangeFetchedAt
      ) {
        continue;
      }

      queryClient.setQueryData(cacheKey, tasks);
    }
  }, [data, queryClient, queryKey, bufferDays, centerString]);

  return query;
}
