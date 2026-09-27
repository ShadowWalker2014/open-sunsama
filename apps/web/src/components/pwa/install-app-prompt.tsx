import * as React from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { currentInstallPlatform, isRunningInstalled } from "@/lib/pwa";
import { InstallAppSheet } from "./install-app-sheet";

const STORAGE_KEY = "open-sunsama-install-tip";
const SHOW_AFTER_MS = 8000;
/** How long the user must have been hands-off before it opens. */
const IDLE_MS = 4000;
/** Stop waiting for a quiet moment after this; try again next visit. */
const GIVE_UP_AFTER_MS = 2 * 60 * 1000;
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
 * browser tab, at the first quiet moment after they arrive. Each showing snoozes it for a
 * week, and it stops after three. The guide is always available under
 * More → Add to Home Screen.
 */
export function InstallAppPrompt() {
  const isMobile = useIsMobile();
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isMobile || !shouldOffer()) return;

    // Only interrupt someone who has paused: no tap or keypress for a few
    // seconds, no sheet or dialog open, and no field being typed into.
    let lastInput = Date.now();
    const onInput = () => {
      lastInput = Date.now();
    };
    window.addEventListener("pointerdown", onInput, true);
    window.addEventListener("keydown", onInput, true);

    const startedAt = Date.now();
    const id = window.setInterval(() => {
      if (Date.now() - startedAt < SHOW_AFTER_MS) return;
      if (Date.now() - startedAt > GIVE_UP_AFTER_MS) {
        window.clearInterval(id);
        return;
      }
      const active = document.activeElement;
      const typing =
        active instanceof HTMLElement &&
        (active.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName));
      if (Date.now() - lastInput < IDLE_MS || typing || document.querySelector("[role=dialog]")) {
        return;
      }
      window.clearInterval(id);
      recordShown();
      setOpen(true);
    }, 1000);

    return () => {
      window.clearInterval(id);
      window.removeEventListener("pointerdown", onInput, true);
      window.removeEventListener("keydown", onInput, true);
    };
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
