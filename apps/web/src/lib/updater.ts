/**
 * Desktop auto-update utilities
 * 
 * Uses @tauri-apps/plugin-updater to check for and install updates.
 * Only functional when running inside Tauri desktop app.
 */

import { isDesktop } from './desktop';

export interface UpdateInfo {
  version: string;
  currentVersion: string;
  date: string | null;
  body: string | null;
}

export interface UpdateProgress {
  contentLength: number | null;
  downloaded: number;
}

/**
 * Check for available updates
 * Returns update info if available, null otherwise
 */
export async function checkForUpdate(): Promise<UpdateInfo | null> {
  if (!isDesktop()) return null;

  const { check } = await import('@tauri-apps/plugin-updater');
  const update = await check();

  if (!update) return null;

  return {
    version: update.version,
    currentVersion: update.currentVersion,
    date: update.date ?? null,
    body: update.body ?? null,
  };
}

/**
 * Download and install an update with progress tracking
 */
export async function downloadAndInstallUpdate(
  onProgress?: (progress: UpdateProgress) => void
): Promise<void> {
  if (!isDesktop()) return;

  const { check } = await import('@tauri-apps/plugin-updater');
  const { relaunch } = await import('@tauri-apps/plugin-process');

  const update = await check();
  if (!update) return;

  let downloaded = 0;
  let contentLength: number | null = null;

  await update.downloadAndInstall((event) => {
    switch (event.event) {
      case 'Started':
        contentLength = event.data.contentLength ?? null;
        onProgress?.({ contentLength, downloaded: 0 });
        break;
      case 'Progress':
        downloaded += event.data.chunkLength;
        onProgress?.({ contentLength, downloaded });
        break;
      case 'Finished':
        onProgress?.({ contentLength, downloaded: contentLength ?? downloaded });
        break;
    }
  });

  await relaunch();
}
