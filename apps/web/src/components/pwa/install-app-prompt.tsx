import * as React from "react";
import { X } from "lucide-react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { currentInstallPlatform, isRunningInstalled } from "@/lib/pwa";
import { InstallAppSheet } from "./install-app-sheet";

const STORAGE_KEY = "open-sunsama-install-tip";
const SHOW_AFTER_MS = 6000;
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
 * A small card above the bottom nav, offered to phone visitors using the web
 * app in a browser tab: "Add Open Sunsama to your Home Screen". "Show me"
 * opens the animated guide. Dismissing snoozes it for a week; it stops
 * asking after three dismissals.
 */
export function InstallAppPrompt() {
  const isMobile = useIsMobile();
  const [visible, setVisible] = React.useState(false);
  const [sheetOpen, setSheetOpen] = React.useState(false);

  React.useEffect(() => {
    if (!isMobile || !shouldOffer()) return;
    const id = window.setTimeout(() => setVisible(true), SHOW_AFTER_MS);
    return () => window.clearTimeout(id);
  }, [isMobile]);

  // Lift floating add buttons so the card never covers them.
  React.useEffect(() => {
    document.body.toggleAttribute("data-install-tip", visible);
    return () => document.body.removeAttribute("data-install-tip");
  }, [visible]);

  const dismiss = () => {
    const state = readState();
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ dismissedAt: Date.now(), dismissals: (state.dismissals ?? 0) + 1 })
      );
    } catch {
      // Private mode: the card simply comes back next visit.
    }
    setVisible(false);
  };

  return (
    <>
      {visible && (
        <div
          role="dialog"
          aria-label="Add Open Sunsama to your Home Screen"
          className="fixed inset-x-3 z-40 animate-[install-tip-in_420ms_cubic-bezier(0.32,0.72,0,1)] lg:hidden"
          style={{ bottom: "calc(4.75rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background/95 p-2.5 pr-2 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.35)] backdrop-blur supports-[backdrop-filter]:bg-background/85">
            <img
              src="/apple-touch-icon.png"
              alt=""
              className="h-11 w-11 shrink-0 rounded-[11px] shadow-sm"
            />
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-[14px] font-semibold">Get the app</p>
              <p className="mt-0.5 truncate text-[12.5px] text-muted-foreground">
                Add to Home Screen in 3 taps
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSheetOpen(true);
                dismiss();
              }}
              className="h-9 shrink-0 rounded-full bg-primary px-3.5 text-[13px] font-semibold text-primary-foreground active:scale-95"
            >
              Show me
            </button>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Not now"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground active:bg-muted"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
      <InstallAppSheet open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
