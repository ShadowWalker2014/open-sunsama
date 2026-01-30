/**
 * Hook for syncing user preferences to the database
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { UserPreferences, User } from "@open-sunsama/types";

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
      const token = localStorage.getItem("open_sunsama_token");
      if (!token || !user) {
        // Not authenticated, skip saving to server
        return null;
      }

      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const response = await fetch(`${baseUrl}/auth/me`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ preferences }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || "Failed to save preferences");
      }

      const result = await response.json();
      return result.data as User; // Return the updated user
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
