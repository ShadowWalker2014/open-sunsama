import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import confetti from "canvas-confetti";
import { useTasks } from "@/hooks/useTasks";

/**
 * Completion page shown when all tasks for today are done
 * Celebratory, minimal design with confetti
 */
export default function FocusCompletePage() {
  const navigate = useNavigate();

  // Fetch today's tasks to show stats
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayTasks = [] } = useTasks({ scheduledDate: today });

  const completedCount = todayTasks.filter((t) => t.completedAt).length;
  const totalMins = todayTasks.reduce(
    (sum, t) => sum + (t.actualMins || t.estimatedMins || 0),
    0
  );
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  // Fire confetti on mount
  React.useEffect(() => {
    const duration = 2000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b"],
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };

    frame();
  }, []);

  const goBack = React.useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ to: "/app" });
    }
  }, [navigate]);

  // Handle Esc key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        goBack();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goBack]);

  const handleClose = () => goBack();

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background overflow-hidden">
      {/* Top bar - minimal, matching focus page */}
      <div className="bg-background/80 backdrop-blur-sm border-b border-border/50">
        <div className="mx-auto max-w-3xl px-6 h-12 flex items-center">
          <button
            onClick={handleClose}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back</span>
          </button>
        </div>
      </div>

      {/* Main content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="flex flex-col items-center gap-8 text-center max-w-md">
          {/* Celebratory emoji */}
          <span
            className="text-7xl animate-bounce"
            style={{ animationDuration: "2s" }}
          >
            🎉
          </span>

          {/* Message */}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              All done for today!
            </h1>
            <p className="text-muted-foreground text-lg">
              Great work. Time to relax.
            </p>
          </div>

          {/* Stats - clean horizontal layout */}
          {completedCount > 0 && (
            <div className="flex items-center gap-8 text-sm">
              <div className="flex flex-col items-center gap-1">
                <span className="text-4xl font-light text-foreground tabular-nums">
                  {completedCount}
                </span>
                <span className="text-muted-foreground/60 text-xs uppercase tracking-wider">
                  tasks
                </span>
              </div>
              {totalMins > 0 && (
                <>
                  <div className="h-12 w-px bg-border/50" />
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-4xl font-light text-foreground tabular-nums">
                      {hours > 0 ? (
                        <>
                          {hours}
                          <span className="text-2xl text-muted-foreground/60">
                            h
                          </span>{" "}
                          {mins > 0 && (
                            <>
                              {mins}
                              <span className="text-2xl text-muted-foreground/60">
                                m
                              </span>
                            </>
                          )}
                        </>
                      ) : (
                        <>
                          {mins}
                          <span className="text-2xl text-muted-foreground/60">
                            m
                          </span>
                        </>
                      )}
                    </span>
                    <span className="text-muted-foreground/60 text-xs uppercase tracking-wider">
                      focused
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Action button */}
          <button
            onClick={handleClose}
            className="mt-4 px-8 py-3 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 hover:scale-105 transition-all"
          >
            Done
          </button>
        </div>
      </div>

      {/* Keyboard hints at bottom */}
      <div className="pb-8 flex items-center justify-center">
        <p className="text-xs text-muted-foreground/40">
          Press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
            Esc
          </kbd>{" "}
          or{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-muted/50 text-muted-foreground">
            Enter
          </kbd>{" "}
          to return
        </p>
      </div>
    </div>
  );
}
