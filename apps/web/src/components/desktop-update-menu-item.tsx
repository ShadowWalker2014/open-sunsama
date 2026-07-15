/**
 * "Check for updates" menu item for the desktop app.
 *
 * Renders the current app version plus a manual update check that always gives
 * feedback via toast — "you're on the latest" when current, an actionable
 * "update now" when behind. Complements the passive auto-check banner, which is
 * invisible when there's nothing to install. Renders nothing on web.
 */

import * as React from "react";
import { RefreshCw } from "lucide-react";
import { isDesktop } from "@/lib/desktop";
import {
  getAppVersion,
  checkForUpdate,
  downloadAndInstallUpdate,
} from "@/lib/updater";
import { toast } from "@/hooks/use-toast";
import { DropdownMenuItem, ToastAction } from "@/components/ui";

export function DesktopUpdateMenuItem() {
  const [version, setVersion] = React.useState<string | null>(null);
  const [checking, setChecking] = React.useState(false);

  React.useEffect(() => {
    if (!isDesktop()) return;
    void getAppVersion().then(setVersion);
  }, []);

  if (!isDesktop()) return null;

  const handleCheck = async (event: Event) => {
    // Keep the dropdown from closing so the spinner stays visible.
    event.preventDefault();
    if (checking) return;
    setChecking(true);

    try {
      const update = await checkForUpdate();

      if (update) {
        toast({
          title: `Version ${update.version} available`,
          description: "A new version of Open Sunsama is ready to install.",
          action: (
            <ToastAction
              altText="Update now"
              onClick={() => {
                void handleInstall(update.version);
              }}
            >
              Update now
            </ToastAction>
          ),
        });
      } else {
        toast({
          title: "You're up to date",
          description: version
            ? `Open Sunsama ${version} is the latest version.`
            : "You're on the latest version.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Couldn't check for updates",
        description:
          err instanceof Error ? err.message : "Please try again later.",
      });
    } finally {
      setChecking(false);
    }
  };

  const handleInstall = async (nextVersion: string) => {
    const { id, update, dismiss } = toast({
      title: `Installing ${nextVersion}…`,
      description: "Downloading update. The app will restart when ready.",
      duration: Infinity,
    });

    try {
      await downloadAndInstallUpdate();
      // Normally the app relaunches before reaching here.
      dismiss();
    } catch (err) {
      update({
        id,
        variant: "destructive",
        title: "Update failed",
        description:
          err instanceof Error ? err.message : "Please try again later.",
      });
    }
  };

  return (
    <DropdownMenuItem
      className="text-[13px] py-1.5 cursor-pointer"
      onSelect={(e) => {
        void handleCheck(e);
      }}
    >
      <RefreshCw
        className={`mr-2 h-3.5 w-3.5 ${checking ? "animate-spin" : ""}`}
      />
      <span className="flex-1">Check for updates</span>
      {version && (
        <span className="ml-2 text-[11px] text-muted-foreground tabular-nums">
          {version}
        </span>
      )}
    </DropdownMenuItem>
  );
}
