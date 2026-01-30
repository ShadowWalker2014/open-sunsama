import { invoke } from "@tauri-apps/api/core";
import {
  isPermissionGranted,
  requestPermission,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import type { NotificationOptions } from "./types";

/**
 * Check if notification permissions are granted
 */
export async function checkNotificationPermission(): Promise<boolean> {
  try {
    return await isPermissionGranted();
  } catch {
    return false;
  }
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const permission = await requestPermission();
    return permission === "granted";
  } catch {
    return false;
  }
}

/**
 * Show a native notification
 */
export async function showNotification(
  options: NotificationOptions
): Promise<void> {
  try {
    // First try the invoke command
    await invoke("show_notification", { options });
  } catch {
    // Fallback to direct plugin call
    try {
      const notificationOptions: { title: string; body?: string } = {
        title: options.title,
      };
      if (options.body !== undefined) {
        notificationOptions.body = options.body;
      }
      sendNotification(notificationOptions);
    } catch (error) {
      console.error("Failed to show notification:", error);
      throw error;
    }
  }
}

/**
 * Show a task reminder notification
 */
export async function showTaskReminder(
  taskTitle: string,
  taskId: string
): Promise<void> {
  await showNotification({
    title: "Task Reminder",
    body: taskTitle,
    actionTypeId: `task:${taskId}`,
  });
}

/**
 * Show a time block notification
 */
export async function showTimeBlockNotification(
  title: string,
  message: string
): Promise<void> {
  await showNotification({
    title,
    body: message,
  });
}
