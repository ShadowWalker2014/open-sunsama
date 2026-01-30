import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  NotificationPreferences,
  UpdateNotificationPreferencesInput,
} from "@open-sunsama/types";
import { getApi } from "@/lib/api";
import { toast } from "@/hooks/use-toast";

// API base URL for direct fetch calls (push subscription doesn't go through api-client)
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001";

/**
 * Query key factory for notification preferences
 */
export const notificationPreferencesKeys = {
  all: ["notificationPreferences"] as const,
  preferences: () => [...notificationPreferencesKeys.all, "preferences"] as const,
};

/**
 * Fetch notification preferences for the current user
 * Preferences rarely change, so we use a longer staleTime to reduce refetches
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationPreferencesKeys.preferences(),
    queryFn: async (): Promise<NotificationPreferences> => {
      const api = getApi();
      return await api.notifications.getPreferences();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes - preferences don't change often
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

// ============================================================================
// Web Push Notification Functions
// ============================================================================

/**
 * Check if push notifications are supported by the browser
 */
export function isPushSupported(): boolean {
  return (
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

/**
 * Register the service worker for push notifications
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("[Push] Service workers not supported");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("[Push] Service worker registered:", registration.scope);
    return registration;
  } catch (error) {
    console.error("[Push] Service worker registration failed:", error);
    return null;
  }
}

/**
 * Get the VAPID public key from the API server
 */
async function getVapidPublicKey(): Promise<string | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/push/vapid-public-key`);
    const data = await response.json();
    
    if (data.success && data.data?.publicKey) {
      return data.data.publicKey;
    }
    return null;
  } catch (error) {
    console.error("[Push] Failed to get VAPID public key:", error);
    return null;
  }
}

/**
 * Convert a base64 string to Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  
  const rawData = window.atob(base64);
  const buffer = new ArrayBuffer(rawData.length);
  const outputArray = new Uint8Array(buffer);
  
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Send the push subscription to the backend
 */
async function sendSubscriptionToServer(
  subscription: PushSubscription
): Promise<boolean> {
  const token = localStorage.getItem("open_sunsama_token");
  
  if (!token) {
    console.error("[Push] No auth token available");
    return false;
  }

  try {
    const p256dh = subscription.getKey("p256dh");
    const auth = subscription.getKey("auth");
    
    if (!p256dh || !auth) {
      console.error("[Push] Missing subscription keys");
      return false;
    }

    const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(String.fromCharCode(...new Uint8Array(p256dh))),
          auth: btoa(String.fromCharCode(...new Uint8Array(auth))),
        },
        expirationTime: subscription.expirationTime,
      }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("[Push] Failed to send subscription to server:", error);
    return false;
  }
}

/**
 * Remove push subscription from the backend
 */
async function removeSubscriptionFromServer(endpoint: string): Promise<boolean> {
  const token = localStorage.getItem("open_sunsama_token");
  
  if (!token) {
    return false;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/push/subscribe`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ endpoint }),
    });

    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("[Push] Failed to remove subscription from server:", error);
    return false;
  }
}

/**
 * Subscribe to push notifications
 * This handles the full flow: service worker, permission, subscription, and API
 */
export async function subscribeToPush(): Promise<{
  success: boolean;
  error?: string;
}> {
  // Check browser support
  if (!isPushSupported()) {
    return { success: false, error: "Push notifications not supported in this browser" };
  }

  // Request permission
  const permission = await requestNotificationPermission();
  if (permission !== "granted") {
    return { success: false, error: "Notification permission denied" };
  }

  // Register service worker
  const registration = await registerServiceWorker();
  if (!registration) {
    return { success: false, error: "Failed to register service worker" };
  }

  // Get VAPID public key
  const vapidPublicKey = await getVapidPublicKey();
  if (!vapidPublicKey) {
    return { success: false, error: "Push notifications not configured on server" };
  }

  try {
    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });
    }

    // Send subscription to server
    const sent = await sendSubscriptionToServer(subscription);
    if (!sent) {
      return { success: false, error: "Failed to save subscription on server" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Push] Subscription failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(): Promise<{
  success: boolean;
  error?: string;
}> {
  if (!("serviceWorker" in navigator)) {
    return { success: true }; // Nothing to unsubscribe
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      // Remove from server first
      await removeSubscriptionFromServer(subscription.endpoint);
      
      // Then unsubscribe locally
      await subscription.unsubscribe();
    }

    return { success: true };
  } catch (error) {
    console.error("[Push] Unsubscribe failed:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Check if currently subscribed to push notifications
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (!("serviceWorker" in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch {
    return false;
  }
}

/**
 * Hook for managing push notification subscription
 * Integrates with the notification preferences toggle
 */
export function useUpdatePushSubscription() {
  const queryClient = useQueryClient();
  const updatePreferences = useUpdateNotificationPreferences();

  return useMutation({
    mutationFn: async (enabled: boolean) => {
      if (enabled) {
        const result = await subscribeToPush();
        if (!result.success) {
          throw new Error(result.error || "Failed to enable push notifications");
        }
      } else {
        const result = await unsubscribeFromPush();
        if (!result.success) {
          throw new Error(result.error || "Failed to disable push notifications");
        }
      }
      
      // Update preferences on server
      await updatePreferences.mutateAsync({ pushNotificationsEnabled: enabled });
      
      return enabled;
    },
    onSuccess: (enabled) => {
      toast({
        title: enabled ? "Push notifications enabled" : "Push notifications disabled",
        description: enabled
          ? "You will receive push notifications for task reminders."
          : "Push notifications have been turned off.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to update push notifications",
        description: error instanceof Error ? error.message : "Unknown error",
      });
    },
  });
}

// Re-export types for convenience
export type { NotificationPreferences, UpdateNotificationPreferencesInput };
