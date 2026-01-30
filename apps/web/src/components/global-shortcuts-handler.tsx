import * as React from "react";
import {
  SHORTCUTS,
  matchesShortcut,
  shouldIgnoreShortcut,
  useShortcutsModal,
} from "@/hooks/useKeyboardShortcuts";
import { useSearch } from "@/hooks/useSearch";

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
        setShowShortcutsModal(true);
        return;
      }

      // Search/Command Palette (Cmd+K)
      if (SHORTCUTS.search && matchesShortcut(event, SHORTCUTS.search)) {
        event.preventDefault();
        openSearch();
        return;
      }

      // Add task (A)
      if (SHORTCUTS.addTask && matchesShortcut(event, SHORTCUTS.addTask)) {
        event.preventDefault();
        onAddTask();
        return;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setShowShortcutsModal, openSearch, onAddTask]);

  return null; // This component renders nothing
}
