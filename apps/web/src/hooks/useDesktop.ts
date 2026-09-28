import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  isDesktop,
  showNotification,
  getAutoLaunch,
  setAutoLaunch,
  getSettings,
  setSettings,
  onQuickAddTask,
  onNavigate,
  onStartFocusMode,
  type NotificationOptions,
  type AppSettings,
} from "@/lib/desktop";

/**
 * Hook to check if running in desktop mode
 */
export function useIsDesktop(): boolean {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    setDesktop(isDesktop());
  }, []);

  return desktop;
}

/**
 * Hook for native notifications with fallback to web notifications
 */
export function useNativeNotification() {
  const sendNotification = useCallback(
    async (options: NotificationOptions): Promise<void> => {
      await showNotification(options);
    },
    []
  );

  return { sendNotification };
}

/**
 * Hook for auto-launch settings
 */
export function useAutoLaunch() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatus = async () => {
      const status = await getAutoLaunch();
      setEnabled(status);
      setLoading(false);
    };
    fetchStatus();
  }, []);

  const toggle = useCallback(async (value: boolean): Promise<boolean> => {
    const success = await setAutoLaunch(value);
    if (success) {
      setEnabled(value);
    }
    return success;
  }, []);

  return { enabled, loading, toggle };
}

/**
 * Hook for desktop app settings
 */
export function useDesktopSettings() {
  const [settings, setLocalSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const data = await getSettings();
      setLocalSettings(data);
      setLoading(false);
    };
    fetchSettings();
  }, []);

  const updateSettings = useCallback(
    async (newSettings: AppSettings): Promise<boolean> => {
      const success = await setSettings(newSettings);
      if (success) {
        setLocalSettings(newSettings);
      }
      return success;
    },
    []
  );

  return { settings, loading, updateSettings };
}

/**
 * Hook for listening to events the desktop shell emits (global shortcuts,
 * tray and app menu). No-op outside Tauri.
 */
export function useDesktopEvents(options: {
  onQuickAddTask?: () => void;
  onStartFocusMode?: () => void;
}) {
  const navigate = useNavigate();
  const { onQuickAddTask: handleQuickAdd, onStartFocusMode: handleFocus } =
    options;

  useEffect(() => {
    if (!isDesktop()) return;

    let disposed = false;
    const cleanups: Array<() => void> = [];
    // Listeners register asynchronously; if the effect is torn down first
    // (StrictMode, fast remount), unlisten as soon as each one resolves.
    const keep = (cleanup: (() => void) | null) => {
      if (!cleanup) return;
      if (disposed) cleanup();
      else cleanups.push(cleanup);
    };

    if (handleQuickAdd) void onQuickAddTask(handleQuickAdd).then(keep);
    void onNavigate((path) => void navigate({ to: path })).then(keep);
    if (handleFocus) void onStartFocusMode(handleFocus).then(keep);

    return () => {
      disposed = true;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [navigate, handleQuickAdd, handleFocus]);
}

/**
 * Combined hook for all desktop functionality
 */
export function useDesktop() {
  const isDesktopApp = useIsDesktop();
  const { sendNotification } = useNativeNotification();
  const { enabled: autoLaunchEnabled, toggle: toggleAutoLaunch } =
    useAutoLaunch();
  const { settings, updateSettings } = useDesktopSettings();

  return {
    isDesktop: isDesktopApp,
    sendNotification,
    autoLaunchEnabled,
    toggleAutoLaunch,
    settings,
    updateSettings,
  };
}
