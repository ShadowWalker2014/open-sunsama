import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useDesktopEvents } from "@/hooks/useDesktop";
import { toast } from "@/hooks/use-toast";
import {
  SHORTCUTS,
  formatShortcut,
  type ShortcutDefinition,
} from "@/hooks/useKeyboardShortcuts";
import { getApi } from "@/lib/api";
import { pickFocusTarget } from "@/lib/focus-target";
import { taskKeys, timeBlockKeys, timerKeys } from "@/lib/query-keys";

const keys = (shortcut: ShortcutDefinition | undefined) =>
  shortcut ? formatShortcut(shortcut).replace(/ /g, "") : "";

interface DesktopShortcutsHandlerProps {
  onAddTask: () => void;
}

/**
 * Handles the desktop app's global shortcuts (⌘⇧T quick add, ⌘⇧F focus) plus
 * the tray and app-menu actions. The Rust side brings the window forward
 * before emitting. Renders nothing, and does nothing outside Tauri.
 */
export function DesktopShortcutsHandler({ onAddTask }: DesktopShortcutsHandlerProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleStartFocus = React.useCallback(async () => {
    const api = getApi();
    const today = format(new Date(), "yyyy-MM-dd");

    try {
      // Same keys and response shapes as useTimer, useTasks and
      // useTimeBlocksForDate, so this shares their cache.
      const [activeTimerTask, todayTasks, todayTimeBlocks] = await Promise.all([
        queryClient.fetchQuery({
          queryKey: timerKeys.active(),
          queryFn: () => api.tasks.timerActive(),
          staleTime: 0,
        }),
        queryClient.fetchQuery({
          queryKey: taskKeys.list({ scheduledDate: today }),
          queryFn: async () =>
            (await api.tasks.list({ scheduledDate: today, limit: 200 })).data ?? [],
          staleTime: 10_000,
        }),
        queryClient.fetchQuery({
          queryKey: timeBlockKeys.list({ date: today }),
          queryFn: () => api.timeBlocks.list({ date: today }),
          staleTime: 10_000,
        }),
      ]);

      const target = pickFocusTarget({
        activeTimerTask,
        todayTasks,
        todayTimeBlocks,
        now: new Date(),
      });

      if (target.kind === "task") {
        void navigate({ to: "/app/focus/$taskId", params: { taskId: target.taskId } });
      } else if (target.kind === "all-done") {
        void navigate({ to: "/app/focus/complete" });
      } else {
        void navigate({ to: "/app" });
        toast({
          title: "Nothing planned for today",
          description: `Press ${keys(SHORTCUTS.desktopQuickAdd)} to add a task, then ${keys(SHORTCUTS.desktopStartFocus)} to focus on it.`,
        });
      }
    } catch {
      toast({
        variant: "destructive",
        title: "Couldn't start focus mode",
        description: "Check your connection and try again.",
      });
    }
  }, [navigate, queryClient]);

  const handleStartFocusEvent = React.useCallback(() => {
    void handleStartFocus();
  }, [handleStartFocus]);

  useDesktopEvents({
    onQuickAddTask: onAddTask,
    onStartFocusMode: handleStartFocusEvent,
  });

  return null;
}
