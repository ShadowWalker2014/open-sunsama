import * as React from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { currentInstallPlatform, isRunningInstalled } from "@/lib/pwa";
import { InstallAppSheet } from "./install-app-sheet";

const STORAGE_KEY = "open-sunsama-install-tip";
const SHOW_AFTER_MS = 8000;
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_DISMISSALS = 3;

interface TipState {
  dismissedAt?: number;
  dismissals?: number;
}

function readState(): TipState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as TipState;
  } catch {
    return {};
  }
}

function shouldOffer(): boolean {
  if (isRunningInstalled() || currentInstallPlatform() === "desktop") return false;
  const { dismissedAt = 0, dismissals = 0 } = readState();
  if (dismissals >= MAX_DISMISSALS) return false;
  return Date.now() - dismissedAt > SNOOZE_MS;
}

/**
 * Opens the install guide once for phone visitors using the web app in a
 * browser tab, a few seconds after they arrive. Each showing snoozes it for a
 * week, and it stops after three. The guide is always available under
 * More → Add to Home Screen.
 */
export function InstallAppPrompt() {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isMobile || !shouldOffer()) return;
    const id = window.setTimeout(() => {
      // Don't cover a sheet or dialog the user is working in.
      if (document.querySelector("[role=dialog]")) return;
      recordShown();
      setOpen(true);
    }, SHOW_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [isMobile]);

  return <InstallAppSheet open={open} onOpenChange={setOpen} />;
}

function recordShown() {
  const { dismissals = 0 } = readState();
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ dismissedAt: Date.now(), dismissals: dismissals + 1 })
    );
  } catch {
    // Private mode: it simply offers again next visit.
  }
}
