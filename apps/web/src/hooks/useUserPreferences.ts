/**
 * Hook for syncing user preferences to the database
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { UserPreferences } from "@open-sunsama/types";

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

      return response.json();
    },
    onSuccess: (data) => {
      if (data) {
        // Invalidate user query to refresh cached user data
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      }
    },
    onError: (error) => {
      // Log error for debugging but don't disrupt user experience
      // Preferences are still saved in localStorage as fallback
      console.error("[useSavePreferences] Failed to save to server:", error.message);
    },
  });
}
