/**
 * Hook for desktop app auto-updates
 * 
 * Checks for updates on mount (desktop only) and provides
 * state + actions for the update UI.
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { isDesktop } from '@/lib/desktop';
import {
  checkForUpdate,
  downloadAndInstallUpdate,
  type UpdateInfo,
  type UpdateProgress,
} from '@/lib/updater';

export type UpdateStatus = 'idle' | 'checking' | 'available' | 'downloading' | 'installing' | 'error';

export interface AppUpdateState {
  status: UpdateStatus;
  update: UpdateInfo | null;
  progress: UpdateProgress | null;
  error: string | null;
  checkForUpdate: () => void;
  installUpdate: () => void;
  dismiss: () => void;
}

export function useAppUpdate(): AppUpdateState {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState<UpdateProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const hasCheckedRef = useRef(false);

  const doCheck = useCallback(async () => {
    if (!isDesktop()) return;

    setStatus('checking');
    setError(null);

    const result = await checkForUpdate();
    if (result) {
      setUpdate(result);
      setStatus('available');
      setDismissed(false);
    } else {
      setStatus('idle');
    }
  }, []);

  const installUpdate = useCallback(async () => {
    if (!isDesktop()) return;

    setStatus('downloading');
    setProgress(null);

    await downloadAndInstallUpdate((p) => {
      setProgress(p);
    });
    // If we get here, relaunch didn't happen (shouldn't normally reach this)
    setStatus('installing');
  }, []);

  const dismiss = useCallback(() => {
    setDismissed(true);
  }, []);

  // Check on mount (once)
  useEffect(() => {
    if (hasCheckedRef.current) return;
    hasCheckedRef.current = true;

    // Delay check by 3s to not block app startup
    const timer = setTimeout(doCheck, 3000);
    return () => clearTimeout(timer);
  }, [doCheck]);

  // If dismissed, report as idle
  const effectiveStatus = dismissed && status === 'available' ? 'idle' : status;

  return {
    status: effectiveStatus,
    update,
    progress,
    error,
    checkForUpdate: doCheck,
    installUpdate,
    dismiss,
  };
}
