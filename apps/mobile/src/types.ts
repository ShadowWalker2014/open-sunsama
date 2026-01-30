/**
 * Types for Tauri mobile bridge
 */

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';

export type Platform = 'ios' | 'android' | 'unknown';

export interface MobileAPI {
  isMobile: () => Promise<boolean>;
  getPlatform: () => Promise<Platform>;
  triggerHaptic: (type: HapticType) => Promise<void>;
  requestNotificationPermission: () => Promise<boolean>;
  setBadgeCount: (count: number) => Promise<void>;
  isTauri: () => boolean;
}
