/**
 * App update banner - shown when a new desktop version is available
 * 
 * Minimal banner at the top of the app with update info,
 * download progress, and install/dismiss actions.
 */

import { Download, X, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui';
import { useAppUpdate } from '@/hooks/useAppUpdate';
import { cn } from '@/lib/utils';

export function AppUpdateBanner() {
  const { status, update, progress, installUpdate, dismiss } = useAppUpdate();

  if (status === 'idle' || status === 'checking' || status === 'error') {
    return null;
  }

  const progressPercent =
    progress?.contentLength && progress.contentLength > 0
      ? Math.round((progress.downloaded / progress.contentLength) * 100)
      : null;

  return (
    <div className="relative flex items-center justify-center gap-3 bg-primary px-4 py-1.5 text-primary-foreground text-xs">
      {status === 'available' && (
        <>
          <RefreshCw className="h-3 w-3 shrink-0" />
          <span className="truncate">
            Version {update?.version} is available
          </span>
          <Button
            size="sm"
            variant="secondary"
            className="h-5 px-2 text-[11px] cursor-pointer"
            onClick={installUpdate}
          >
            <Download className="mr-1 h-3 w-3" />
            Update now
          </Button>
          <button
            onClick={dismiss}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 hover:bg-primary-foreground/20 transition-colors cursor-pointer"
          >
            <X className="h-3 w-3" />
          </button>
        </>
      )}

      {(status === 'downloading' || status === 'installing') && (
        <>
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
          <span className="truncate">
            {status === 'installing'
              ? 'Installing update...'
              : progressPercent !== null
                ? `Downloading update... ${progressPercent}%`
                : 'Downloading update...'}
          </span>
          {progressPercent !== null && (
            <div className="h-1 w-24 rounded-full bg-primary-foreground/20 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full bg-primary-foreground transition-all duration-300'
                )}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
