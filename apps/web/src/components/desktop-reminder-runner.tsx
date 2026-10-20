import * as React from "react";
import { addDays, endOfDay, startOfDay } from "date-fns";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import { useTimeBlocks } from "@/hooks/useTimeBlocks";
import { showNotification } from "@/lib/desktop";
import {
  getDesktopReminderKey,
  getDueDesktopReminders,
} from "@/lib/desktop-reminders";

const SENT_KEYS_STORAGE_PREFIX = "open_sunsama_desktop_reminders";
const POLL_INTERVAL_MS = 30_000;
const MAX_STORED_KEYS = 500;

function storageKey(userId: string): string {
  return `${SENT_KEYS_STORAGE_PREFIX}:${userId}`;
}

function readSentKeys(userId: string): Set<string> {
  try {
    const value = localStorage.getItem(storageKey(userId));
    const keys = value ? (JSON.parse(value) as unknown) : [];
    return new Set(
      Array.isArray(keys)
        ? keys.filter((key): key is string => typeof key === "string")
        : []
    );
  } catch {
    return new Set();
  }
}

function writeSentKeys(userId: string, keys: Set<string>): void {
  try {
    localStorage.setItem(
      storageKey(userId),
      JSON.stringify(Array.from(keys).slice(-MAX_STORED_KEYS))
    );
  } catch {
    // Notification delivery still works if storage is unavailable, but a later
    // reload cannot guarantee deduplication in that browser profile.
  }
}

/** Runs only in the Tauri webview; the browser path never polls for reminders. */
export function DesktopReminderRunner({ userId }: { userId: string }) {
  const [now, setNow] = React.useState(() => new Date());
  const inFlightKeys = React.useRef(new Set<string>());
  const { data: preferences } = useNotificationPreferences();
  const range = React.useMemo(
    () => ({
      startTimeFrom: startOfDay(now),
      startTimeTo: endOfDay(addDays(now, 1)),
    }),
    [now.getFullYear(), now.getMonth(), now.getDate()]
  );
  const { data: timeBlocks = [] } = useTimeBlocks(range, {
    enabled: !!preferences?.taskRemindersEnabled,
    refetchInterval: POLL_INTERVAL_MS,
    // The Tauri window is hidden while the tray app remains responsible for reminders.
    refetchIntervalInBackground: true,
  });

  React.useEffect(() => {
    const interval = window.setInterval(
      () => setNow(new Date()),
      POLL_INTERVAL_MS
    );
    return () => window.clearInterval(interval);
  }, []);

  React.useEffect(() => {
    if (
      !preferences?.taskRemindersEnabled ||
      !preferences.pushNotificationsEnabled
    )
      return;

    const sentKeys = readSentKeys(userId);
    for (const key of inFlightKeys.current) sentKeys.add(key);
    const dueBlocks = getDueDesktopReminders(
      timeBlocks,
      now,
      preferences.reminderTiming,
      sentKeys
    );

    for (const block of dueBlocks) {
      const key = getDesktopReminderKey(block);
      inFlightKeys.current.add(key);
      void showNotification({
        title: "Upcoming time block",
        body: `${block.title} starts in ${preferences.reminderTiming} minutes`,
      }).then((delivered) => {
        inFlightKeys.current.delete(key);
        if (delivered) {
          sentKeys.add(key);
          writeSentKeys(userId, sentKeys);
        }
      });
    }
  }, [now, preferences, timeBlocks, userId]);

  return null;
}
