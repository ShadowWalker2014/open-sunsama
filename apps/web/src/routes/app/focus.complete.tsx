import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { useTasks } from "@/hooks/useTasks";

/**
 * Completion page shown when all tasks for today are done
 * Linear-style minimal design
 */
export default function FocusCompletePage() {
  const navigate = useNavigate();

  // Fetch today's tasks to show stats
  const today = format(new Date(), "yyyy-MM-dd");
  const { data: todayTasks = [] } = useTasks({ scheduledDate: today });

  const completedCount = todayTasks.filter(t => t.completedAt).length;
  const totalMins = todayTasks.reduce((sum, t) => sum + (t.actualMins || t.estimatedMins || 0), 0);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  // Handle Esc key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") {
        navigate({ to: "/app" });
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [navigate]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      {/* Back button */}
      <button
        onClick={() => navigate({ to: "/app" })}
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {/* Main content */}
      <div className="flex flex-col items-center gap-8 text-center px-6">
        {/* Success icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-green-500/20 rounded-full blur-xl" />
          <CheckCircle2 className="relative h-20 w-20 text-green-500" strokeWidth={1.5} />
        </div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">All done for today</h1>
          <p className="text-muted-foreground">
            You've completed all your scheduled tasks.
          </p>
        </div>

        {/* Stats */}
        {completedCount > 0 && (
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-medium text-foreground">{completedCount}</span>
              <span>tasks</span>
            </div>
            {totalMins > 0 && (
              <>
                <div className="h-8 w-px bg-border" />
                <div className="flex flex-col items-center">
                  <span className="text-2xl font-medium text-foreground">
                    {hours > 0 ? `${hours}h ${mins}m` : `${mins}m`}
                  </span>
                  <span>focused</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Action */}
        <button
          onClick={() => navigate({ to: "/app" })}
          className="mt-4 px-6 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Return to Board
        </button>

        {/* Keyboard hint */}
        <p className="text-xs text-muted-foreground/60">
          Press <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs">Esc</kbd> or <kbd className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-xs">Enter</kbd> to return
        </p>
      </div>
    </div>
  );
}
