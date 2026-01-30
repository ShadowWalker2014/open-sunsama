/**
 * Desktop integration for the web app
 *
 * This module provides desktop-specific functionality when running in Tauri,
 * with graceful fallbacks when running in a regular browser.
 */

// Type definitions for desktop functionality
export interface NotificationOptions {
  title: string;
  body?: string;
  actionTypeId?: string;
}

export interface AppSettings {
  theme: string;
  autoLaunch: boolean;
  minimizeToTray: boolean;
  globalShortcutsEnabled: boolean;
}

/**
 * Check if we're running in a Tauri desktop environment
 */
export function isDesktop(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/**
 * Show a native notification (desktop) or web notification (browser)
 */
export async function showNotification(
  options: NotificationOptions
): Promise<void> {
  if (isDesktop()) {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("show_notification", { options });
      return;
    } catch (error) {
      console.error("Desktop notification failed, falling back to web:", error);
    }
  }

  // Fallback to web notifications
  if ("Notification" in window) {
    if (Notification.permission === "granted") {
      new Notification(options.title, { body: options.body });
    } else if (Notification.permission !== "denied") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        new Notification(options.title, { body: options.body });
      }
    }
  }
}

/**
 * Get auto-launch status (desktop only)
 */
export async function getAutoLaunch(): Promise<boolean> {
  if (!isDesktop()) return false;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<boolean>("get_auto_launch");
  } catch {
    return false;
  }
}

/**
 * Set auto-launch status (desktop only)
 */
export async function setAutoLaunch(enabled: boolean): Promise<boolean> {
  if (!isDesktop()) return false;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_auto_launch", { enabled });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get app settings (desktop only)
 */
export async function getSettings(): Promise<AppSettings | null> {
  if (!isDesktop()) return null;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return await invoke<AppSettings>("get_settings");
  } catch {
    return null;
  }
}

/**
 * Save app settings (desktop only)
 */
export async function setSettings(settings: AppSettings): Promise<boolean> {
  if (!isDesktop()) return false;

  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_settings", { settings });
    return true;
  } catch {
    return false;
  }
}

/**
 * Listen to desktop events
 */
export async function listenToDesktopEvent<T>(
  event: string,
  handler: (payload: T) => void
): Promise<(() => void) | null> {
  if (!isDesktop()) return null;

  try {
    const { listen } = await import("@tauri-apps/api/event");
    const unlisten = await listen<T>(event, (e) => handler(e.payload));
    return unlisten;
  } catch {
    return null;
  }
}

/**
 * Hook for listening to quick-add-task event
 */
export function onQuickAddTask(handler: () => void): Promise<(() => void) | null> {
  return listenToDesktopEvent("quick-add-task", handler);
}

/**
 * Hook for listening to navigation events
 */
export function onNavigate(
  handler: (path: string) => void
): Promise<(() => void) | null> {
  return listenToDesktopEvent<string>("navigate", handler);
}

/**
 * Hook for listening to focus mode events
 */
export function onStartFocusMode(
  handler: () => void
): Promise<(() => void) | null> {
  return listenToDesktopEvent("start-focus-mode", handler);
}
