/**
 * Mobile integration utilities
 * 
 * Provides helpers for detecting and interacting with Tauri mobile features.
 * Import from '@open-sunsama/mobile' when running in Tauri mobile context.
 */

import { invoke } from '@tauri-apps/api/core';

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';
export type Platform = 'ios' | 'android' | 'desktop' | 'web';

/**
 * Check if running in Tauri context (desktop or mobile)
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}

/**
 * Check if running on Tauri mobile
 */
export async function isTauriMobile(): Promise<boolean> {
  if (!isTauri()) return false;
  
  try {
    return await invoke<boolean>('is_mobile');
  } catch {
    return false;
  }
}

/**
 * Get the current platform
 */
export async function getPlatform(): Promise<Platform> {
  if (!isTauri()) return 'web';
  
  try {
    const platform = await invoke<string>('get_platform');
    if (platform === 'ios' || platform === 'android') {
      return platform;
    }
    return 'desktop';
  } catch {
    return 'desktop';
  }
}

/**
 * Trigger haptic feedback (mobile only)
 */
export async function triggerHaptic(type: HapticType): Promise<void> {
  if (!isTauri()) return;
  
  try {
    const isMobile = await invoke<boolean>('is_mobile');
    if (isMobile) {
      await invoke('trigger_haptic', { hapticType: type });
    }
  } catch {
    // Silently fail if haptics not available
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (!isTauri()) {
    // Use web notification API
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
  
  try {
    return await invoke<boolean>('request_notification_permission');
  } catch {
    return false;
  }
}

/**
 * Set the app badge count (iOS only, no-op elsewhere)
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (!isTauri()) return;
  
  try {
    await invoke('set_badge_count', { count });
  } catch {
    // Silently fail if not supported
  }
}
