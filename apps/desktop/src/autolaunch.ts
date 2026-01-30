import { invoke } from "@tauri-apps/api/core";

/**
 * Get the current auto-launch status
 */
export async function getAutoLaunch(): Promise<boolean> {
  try {
    return await invoke<boolean>("get_auto_launch");
  } catch (error) {
    console.error("Failed to get auto-launch status:", error);
    return false;
  }
}

/**
 * Enable or disable auto-launch at system startup
 */
export async function setAutoLaunch(enabled: boolean): Promise<boolean> {
  try {
    await invoke("set_auto_launch", { enabled });
    return true;
  } catch (error) {
    console.error("Failed to set auto-launch:", error);
    return false;
  }
}
