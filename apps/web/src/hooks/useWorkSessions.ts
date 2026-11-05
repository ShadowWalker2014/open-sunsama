import { useQuery } from "@tanstack/react-query";
import type { WorkSession } from "@open-sunsama/types";
import { getApiClient } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { workSessionKeys } from "@/lib/query-keys";
import { mergeBackToBackRuns } from "@/lib/work-sessions";

function hideAll(): WorkSession[] {
  return [];
}

/**
 * When tasks were actually worked on in a time range, from their timers.
 * Returns nothing when the user turned off "Show actual time on calendar".
 */
export function useWorkSessions(from: string, to: string) {
  const { user } = useAuth();
  const showActualTime = user?.preferences?.showActualTime ?? true;

  return useQuery({
    queryKey: workSessionKeys.range(from, to),
    queryFn: async (): Promise<WorkSession[]> => {
      const client = getApiClient();
      const response = await client.get<{
        success: boolean;
        data: WorkSession[];
      }>("work-sessions", { searchParams: { from, to } });
      return response.data;
    },
    enabled: showActualTime,
    // Turning the setting off must also hide sessions already in the cache.
    select: showActualTime ? mergeBackToBackRuns : hideAll,
    // A running timer's block grows; refresh it every minute.
    refetchInterval: (query) =>
      query.state.data?.some((session) => session.isRunning) ? 60_000 : false,
  });
}
