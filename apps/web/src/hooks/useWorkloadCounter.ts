/**
 * Hook for what the day header's time total shows: planned time, or actual
 * vs planned. Saved in the user's preferences, so every column and device
 * shows the same view.
 */
import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { DEFAULT_PREFERENCES } from "@/lib/themes";
import type { User, UserPreferences } from "@open-sunsama/types";

export type WorkloadCounter = NonNullable<UserPreferences["workloadCounter"]>;

export function useWorkloadCounter(): {
  counter: WorkloadCounter;
  toggleCounter: () => void;
} {
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();
  const counter = user?.preferences?.workloadCounter ?? "planned";

  const toggleCounter = React.useCallback(() => {
    if (!user) return;
    const preferences: UserPreferences = {
      ...DEFAULT_PREFERENCES,
      ...(user.preferences ?? {}),
      workloadCounter: counter === "planned" ? "actual" : "planned",
    };
    // Switch every column at once, then save in the background.
    queryClient.setQueryData<User>(["auth", "me"], { ...user, preferences });
    void updateUser({ preferences });
  }, [user, counter, updateUser, queryClient]);

  return { counter, toggleCounter };
}
