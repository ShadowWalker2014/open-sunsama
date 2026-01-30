/**
 * Open Sunsama Mobile - Tauri Bridge
 * 
 * This module provides TypeScript wrappers for Tauri mobile commands.
 * Import these in the web app when running in Tauri mobile context.
 */

import { invoke } from '@tauri-apps/api/core';

export type HapticType = 'light' | 'medium' | 'heavy' | 'selection' | 'success' | 'warning' | 'error';
export type Platform = 'ios' | 'android' | 'unknown';

/**
 * Check if running on a mobile platform
 */
export async function isMobile(): Promise<boolean> {
  if (typeof window === 'undefined' || !('__TAURI__' in window)) {
    return false;
  }
  return invoke<boolean>('is_mobile');
}

/**
 * Get the current platform
 */
export async function getPlatform(): Promise<Platform> {
  if (typeof window === 'undefined' || !('__TAURI__' in window)) {
    return 'unknown';
  }
  return invoke<Platform>('get_platform');
}

/**
 * Trigger haptic feedback
 */
export async function triggerHaptic(type: HapticType): Promise<void> {
  if (typeof window === 'undefined' || !('__TAURI__' in window)) {
    return;
  }
  await invoke('trigger_haptic', { hapticType: type });
}

/**
 * Request notification permission
 * @returns true if permission was granted
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('__TAURI__' in window)) {
    return false;
  }
  return invoke<boolean>('request_notification_permission');
}

/**
 * Set the app badge count (iOS only)
 */
export async function setBadgeCount(count: number): Promise<void> {
  if (typeof window === 'undefined' || !('__TAURI__' in window)) {
    return;
  }
  await invoke('set_badge_count', { count });
}

/**
 * Check if running in Tauri context
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI__' in window;
}
