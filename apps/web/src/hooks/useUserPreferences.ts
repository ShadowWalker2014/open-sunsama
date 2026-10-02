/**
 * Hook for syncing user preferences to the database
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { getApi } from "@/lib/api";
import type { UserPreferences } from "@open-sunsama/types";

const AUTH_USER_KEY = "open_sunsama_user";

/**
 * Hook to save user preferences to the database
 * Returns a mutation that persists preferences to the server
 */
export function useSavePreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (preferences: UserPreferences) => {
      if (!user) {
        // Not authenticated, skip saving to server
        return null;
      }

      return await getApi().auth.updateMe({ preferences });
    },
    onSuccess: (updatedUser) => {
      if (updatedUser) {
        // Directly update the cache with the new user data (no refetch needed)
        queryClient.setQueryData(["auth", "me"], updatedUser);
        // Also update localStorage to prevent stale fallback
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(updatedUser));
      }
    },
    onError: (error) => {
      console.error("[useSavePreferences] Failed to save to server:", error.message);
    },
  });
}
