import * as React from "react";
import {
  SHORTCUTS,
  matchesShortcut,
  shouldIgnoreShortcut,
  useShortcutsModal,
} from "@/hooks/useKeyboardShortcuts";
import { useSearch } from "@/hooks/useSearch";
import { toast } from "@/hooks/use-toast";
import { prefetchCommandPalette } from "@/components/command-palette/command-palette.lazy";
import { prefetchShortcutsModal } from "@/components/ui/shortcuts-modal.lazy";

interface GlobalShortcutsHandlerProps {
  onAddTask: () => void;
}

/**
 * Global keyboard shortcuts handler.
 * Handles shortcuts that work across all pages (not task-specific).
 * Renders nothing - just listens for keyboard events.
 */
export function GlobalShortcutsHandler({ onAddTask }: GlobalShortcutsHandlerProps) {
  const { setShowShortcutsModal } = useShortcutsModal();
  const { openSearch } = useSearch();

  React.useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      // Ignore if typing in input
      if (shouldIgnoreShortcut(event)) return;

      // Show shortcuts modal (Shift + ?)
      if (SHORTCUTS.showShortcuts && matchesShortcut(event, SHORTCUTS.showShortcuts)) {
        event.preventDefault();
        // Kick the chunk download in flight before React commits the open
        // state — by the time Suspense suspends, the module is loading.
        void prefetchShortcutsModal();
        setShowShortcutsModal(true);
        return;
      }

      // Search/Command Palette (Cmd+K)
      if (SHORTCUTS.search && matchesShortcut(event, SHORTCUTS.search)) {
        event.preventDefault();
        void prefetchCommandPalette();
        openSearch();
        return;
      }

      // Add task (A)
      if (SHORTCUTS.addTask && matchesShortcut(event, SHORTCUTS.addTask)) {
        event.preventDefault();
        onAddTask();
        return;
      }

      // Undo (Cmd+Z)
      if (SHORTCUTS.undo && matchesShortcut(event, SHORTCUTS.undo)) {
        event.preventDefault();
        // TODO: Implement command history for actual undo functionality
        toast({ title: "No commands to undo" });
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setShowShortcutsModal, openSearch, onAddTask]);

  return null; // This component renders nothing
}
