import * as React from "react";
import {
  Repeat,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Square,
  RefreshCw,
  Trash2,
  Settings,
} from "lucide-react";
import { Link } from "@tanstack/react-router";
import type { Task } from "@open-sunsama/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import {
  useTaskSeries,
  useTaskSeriesInstances,
  useStopTaskSeries,
  useDeleteTaskSeriesInstances,
  useSyncTaskSeriesInstances,
} from "@/hooks/useTaskSeries";
import { getScheduleDescription } from "./repeat-config-popover";

interface TaskSeriesBannerProps {
  task: Task;
  onNavigateToInstance?: (taskId: string) => void;
}

export function TaskSeriesBanner({
  task,
  onNavigateToInstance,
}: TaskSeriesBannerProps) {
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<
    "stop" | "delete" | null
  >(null);

  // Fetch the series data
  const { data: series, isLoading: seriesLoading } = useTaskSeries(
    task.seriesId ?? null
  );

  // Fetch instances to enable prev/next navigation
  const { data: instances = [] } = useTaskSeriesInstances(
    task.seriesId ?? null,
    {
      limit: 100, // Fetch enough to find prev/next
    }
  );

  // Mutations
  const stopSeries = useStopTaskSeries();
  const deleteSeries = useDeleteTaskSeriesInstances();
  const syncSeries = useSyncTaskSeriesInstances();

  // Don't render if not part of a series
  if (!task.seriesId) return null;

  // Loading state
  if (seriesLoading || !series) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-md text-sm text-muted-foreground">
        <Repeat className="h-4 w-4 animate-pulse" />
        <span>Loading...</span>
      </div>
    );
  }

  // Get schedule description
  const scheduleDesc = getScheduleDescription({
    recurrenceType: series.recurrenceType,
    frequency: series.frequency,
    daysOfWeek: series.daysOfWeek ?? undefined,
    dayOfMonth: series.dayOfMonth ?? undefined,
    weekOfMonth: series.weekOfMonth ?? undefined,
    dayOfWeekMonthly: series.dayOfWeekMonthly ?? undefined,
  });

  // Find current task's position in instances for prev/next navigation
  const currentIndex = instances.findIndex((t) => t.id === task.id);
  const prevInstance = currentIndex > 0 ? instances[currentIndex - 1] : null;
  const nextInstance =
    currentIndex < instances.length - 1 ? instances[currentIndex + 1] : null;

  const handlePrevInstance = () => {
    if (prevInstance && onNavigateToInstance) {
      onNavigateToInstance(prevInstance.id);
    }
  };

  const handleNextInstance = () => {
    if (nextInstance && onNavigateToInstance) {
      onNavigateToInstance(nextInstance.id);
    }
  };

  const handleStopRepeating = () => {
    setConfirmAction("stop");
    setConfirmDialogOpen(true);
  };

  const handleDeleteInstances = () => {
    setConfirmAction("delete");
    setConfirmDialogOpen(true);
  };

  const handleSyncInstances = () => {
    if (task.seriesId) {
      syncSeries.mutate(task.seriesId);
    }
  };

  const handleConfirmAction = () => {
    if (!task.seriesId) return;

    if (confirmAction === "stop") {
      stopSeries.mutate(task.seriesId);
    } else if (confirmAction === "delete") {
      deleteSeries.mutate(task.seriesId);
    }

    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  const instanceNumber = task.seriesInstanceNumber ?? currentIndex + 1;

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-md text-sm">
        <Repeat className="h-4 w-4 text-primary shrink-0" />

        <div className="flex-1 min-w-0">
          <span className="text-muted-foreground">
            Repeats {scheduleDesc.toLowerCase()}
          </span>
          {instanceNumber > 0 && (
            <span className="text-muted-foreground/70 ml-1">
              · Instance #{instanceNumber}
            </span>
          )}
        </div>

        {/* Navigation buttons */}
        {(prevInstance || nextInstance) && (
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={!prevInstance}
              onClick={handlePrevInstance}
              title="Previous instance"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              disabled={!nextInstance}
              onClick={handleNextInstance}
              title="Next instance"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Actions dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={handleSyncInstances}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Update all incomplete
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleStopRepeating}>
              <Square className="mr-2 h-4 w-4" />
              Stop repeating
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleDeleteInstances}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Stop and delete incomplete
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link to="/app/routines">
                <Settings className="mr-2 h-4 w-4" />
                Manage routines
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction === "stop"
                ? "Stop repeating?"
                : "Stop and delete?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction === "stop"
                ? "This task will stop repeating. Existing instances will be kept."
                : "This will stop the task from repeating and delete all incomplete instances. Completed instances will be kept."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setConfirmDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmAction}
              variant={confirmAction === "delete" ? "destructive" : "default"}
            >
              {confirmAction === "stop" ? "Stop repeating" : "Stop and delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
