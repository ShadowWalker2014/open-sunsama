import {
  register,
  unregister,
  unregisterAll,
  isRegistered,
} from "@tauri-apps/plugin-global-shortcut";

export type ShortcutHandler = () => void;

export interface ShortcutConfig {
  shortcut: string;
  handler: ShortcutHandler;
}

/**
 * Register a global keyboard shortcut
 */
export async function registerShortcut(
  shortcut: string,
  handler: ShortcutHandler
): Promise<boolean> {
  try {
    await register(shortcut, handler);
    return true;
  } catch (error) {
    console.error(`Failed to register shortcut ${shortcut}:`, error);
    return false;
  }
}

/**
 * Unregister a global keyboard shortcut
 */
export async function unregisterShortcut(shortcut: string): Promise<boolean> {
  try {
    await unregister(shortcut);
    return true;
  } catch (error) {
    console.error(`Failed to unregister shortcut ${shortcut}:`, error);
    return false;
  }
}

/**
 * Unregister all global keyboard shortcuts
 */
export async function unregisterAllShortcuts(): Promise<boolean> {
  try {
    await unregisterAll();
    return true;
  } catch (error) {
    console.error("Failed to unregister all shortcuts:", error);
    return false;
  }
}

/**
 * Check if a shortcut is registered
 */
export async function isShortcutRegistered(shortcut: string): Promise<boolean> {
  try {
    return await isRegistered(shortcut);
  } catch {
    return false;
  }
}

// Default shortcuts used by the app
export const DEFAULT_SHORTCUTS = {
  quickAddTask: "CommandOrControl+Shift+T",
  toggleWindow: "CommandOrControl+Shift+O",
  focusMode: "CommandOrControl+Shift+F",
} as const;
