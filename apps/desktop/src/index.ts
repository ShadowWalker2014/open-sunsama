/**
 * Desktop API - TypeScript bindings for Tauri commands
 * This module exports all desktop-specific functionality
 */

export * from "./notifications";
export * from "./shortcuts";
export * from "./autolaunch";
export * from "./types";

import { invoke } from "@tauri-apps/api/core";

/**
 * Check if the app is running in desktop mode
 */
export async function isDesktop(): Promise<boolean> {
  try {
    return await invoke<boolean>("is_desktop");
  } catch {
    return false;
  }
}

/**
 * Synchronously check if we're likely in a Tauri environment
 * This is a quick check that doesn't require an async call
 */
export function isDesktopSync(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
