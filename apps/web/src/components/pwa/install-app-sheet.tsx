import * as React from "react";
import { Download } from "lucide-react";
import { Dialog, DialogTitle, DialogDescription } from "@/components/ui";
import { BottomSheetContent } from "@/components/ui/bottom-sheet";
import { cn } from "@/lib/utils";
import {
  canPromptInstall,
  currentInstallPlatform,
  promptInstall,
  subscribeInstallPrompt,
} from "@/lib/pwa";
import { installGuideFor } from "./install-guides";
import { PhoneDemo, type DemoPhase } from "./phone-demo";

const PHASE_MS = 2400;

interface InstallAppSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Shows how to add Open Sunsama to the Home Screen on this phone's browser:
 * an animated phone acting out the taps, with the matching step highlighted.
 * Where the browser supports it (Chrome on Android), one button installs.
 */
export function InstallAppSheet({ open, onOpenChange }: InstallAppSheetProps) {
  const guide = React.useMemo(() => installGuideFor(currentInstallPlatform()), []);
  const canInstall = React.useSyncExternalStore(subscribeInstallPrompt, canPromptInstall, () => false);
  const [phase, setPhase] = React.useState<DemoPhase>(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setPhase(0);
    setPaused(false);
  }, [open]);

  React.useEffect(() => {
    if (!open || paused) return;
    const id = window.setInterval(
      () => setPhase((p) => ((p + 1) % 4) as DemoPhase),
      PHASE_MS
    );
    return () => window.clearInterval(id);
  }, [open, paused]);

  const activeStep = Math.min(phase, 2);

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <BottomSheetContent onDismiss={() => onOpenChange(false)}>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          <DialogTitle className="text-center text-[19px] font-semibold leading-snug tracking-tight">
            Put Open Sunsama on your Home Screen
          </DialogTitle>
          <DialogDescription className="mx-auto mt-1.5 max-w-[300px] text-center text-sm text-muted-foreground">
            It opens full screen like any app, one tap from your day.
          </DialogDescription>

          <div className="relative mx-auto mt-4 flex justify-center overflow-hidden rounded-[28px] bg-gradient-to-b from-orange-50 to-orange-100/40 py-5 dark:from-orange-500/10 dark:to-transparent">
            <div className="pointer-events-none absolute -top-16 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-orange-300/30 blur-3xl dark:bg-orange-500/20" />
            <PhoneDemo guide={guide} phase={phase} scale={0.74} />
          </div>

          <ol className="mt-3 space-y-1">
            {guide.steps.map((step, i) => (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => {
                    setPhase(i as DemoPhase);
                    setPaused(true);
                  }}
                  className={cn(
                    "flex w-full items-start gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors duration-300",
                    activeStep === i ? "bg-primary/[0.08]" : "active:bg-muted"
                  )}
                  aria-current={activeStep === i ? "step" : undefined}
                >
                  <span
                    className={cn(
                      "mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums transition-colors duration-300",
                      activeStep === i
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[15px] font-medium leading-snug">{step.text}</span>
                    {step.detail && (
                      <span className="mt-0.5 block text-[13px] leading-snug text-muted-foreground">
                        {step.detail}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>

        <div className="flex shrink-0 gap-2 border-t border-border/40 px-5 py-3">
          {canInstall ? (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-11 flex-1 rounded-full text-[15px] font-medium text-muted-foreground active:bg-muted"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => void handleInstall()}
                className="flex h-11 flex-[2] items-center justify-center gap-2 rounded-full bg-primary text-[15px] font-semibold text-primary-foreground shadow-sm shadow-primary/30 active:scale-[0.98]"
              >
                <Download className="h-4 w-4" />
                Install app
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-11 flex-1 rounded-full text-[15px] font-medium text-muted-foreground active:bg-muted"
              >
                Not now
              </button>
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="h-11 flex-[2] rounded-full bg-foreground text-[15px] font-semibold text-background active:scale-[0.98]"
              >
                Got it
              </button>
            </>
          )}
        </div>
      </BottomSheetContent>
    </Dialog>
  );
}
