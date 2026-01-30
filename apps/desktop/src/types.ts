/**
 * Options for showing a notification
 */
export interface NotificationOptions {
  /** The notification title */
  title: string;
  /** The notification body/message */
  body?: string;
  /** An action type ID for handling notification clicks */
  actionTypeId?: string;
}

/**
 * App settings stored in the desktop app
 */
export interface AppSettings {
  /** Theme preference: 'light', 'dark', or 'system' */
  theme: string;
  /** Whether to start app on system boot */
  autoLaunch: boolean;
  /** Whether to minimize to tray instead of closing */
  minimizeToTray: boolean;
  /** Whether global shortcuts are enabled */
  globalShortcutsEnabled: boolean;
}

/**
 * Events emitted by the desktop app
 */
export interface DesktopEvents {
  /** Emitted when quick add task shortcut is pressed */
  "quick-add-task": undefined;
  /** Emitted when navigation is requested */
  navigate: string;
  /** Emitted when focus mode should start */
  "start-focus-mode": undefined;
}
