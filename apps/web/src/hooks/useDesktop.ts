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
 * Hook for listening to desktop events
 */
export function useDesktopEvents(options: {
  onQuickAddTask?: () => void;
  onStartFocusMode?: () => void;
}) {
  const navigate = useNavigate();

  useEffect(() => {
    const cleanups: Array<(() => void) | null> = [];

    const setup = async () => {
      // Listen for quick add task
      if (options.onQuickAddTask) {
        const cleanup = await onQuickAddTask(options.onQuickAddTask);
        cleanups.push(cleanup);
      }

      // Listen for navigation
      const navCleanup = await onNavigate((path) => {
        navigate({ to: path });
      });
      cleanups.push(navCleanup);

      // Listen for focus mode
      if (options.onStartFocusMode) {
        const focusCleanup = await onStartFocusMode(options.onStartFocusMode);
        cleanups.push(focusCleanup);
      }
    };

    setup();

    return () => {
      cleanups.forEach((cleanup) => cleanup?.());
    };
  }, [navigate, options.onQuickAddTask, options.onStartFocusMode]);
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
