import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
} from "@chronoflow/types";
import { getApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

/**
 * Query key factory for notification preferences
 */
export const notificationPreferencesKeys = {
  all: ["notificationPreferences"] as const,
  preferences: () => [...notificationPreferencesKeys.all, "preferences"] as const,
};

/**
 * Fetch notification preferences for the current user
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationPreferencesKeys.preferences(),
    queryFn: async (): Promise<NotificationPreferences> => {
      const api = getApi();
      return await api.notifications.getPreferences();
    },
  });
}

/**
 * Update notification preferences
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateNotificationPreferencesInput): Promise<NotificationPreferences> => {
      const api = getApi();
      return await api.notifications.updatePreferences(data);
    },
    onSuccess: (updatedPreferences) => {
      // Update the cache with the new preferences
      queryClient.setQueryData(
        notificationPreferencesKeys.preferences(),
        updatedPreferences
      );
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update preferences",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

/**
 * Request browser notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    toast({
      variant: "destructive",
      title: "Not supported",
      description: "Browser notifications are not supported in this browser.",
    });
    return "denied";
  }

  if (Notification.permission === "granted") {
    return "granted";
  }

  if (Notification.permission === "denied") {
    toast({
      variant: "destructive",
      title: "Permission denied",
      description: "Please enable notifications in your browser settings.",
    });
    return "denied";
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return "denied";
  }
}

/**
 * Check if browser notifications are supported and permission is granted
 */
export function getNotificationPermissionStatus(): {
  supported: boolean;
  permission: NotificationPermission | null;
} {
  if (!("Notification" in window)) {
    return { supported: false, permission: null };
  }
  return { supported: true, permission: Notification.permission };
}

// Re-export types for convenience
export type { NotificationPreferences, UpdateNotificationPreferencesInput };
