import * as React from "react";
import { format } from "date-fns";
import { Repeat, Square, Trash2, MoreHorizontal, Search } from "lucide-react";
import {
  Button,
  Input,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui";
import {
  useTaskSeriesList,
  useStopTaskSeries,
  useDeleteTaskSeriesInstances,
} from "@/hooks/useTaskSeries";
import {
  getScheduleDescription,
  formatTime12Hour,
} from "@/components/kanban/repeat-config-popover";
import type { TaskSeriesWithMeta } from "@open-sunsama/types";

export function RoutinesSettings() {
  const [searchQuery, setSearchQuery] = React.useState("");
  const [confirmDialogOpen, setConfirmDialogOpen] = React.useState(false);
  const [confirmAction, setConfirmAction] = React.useState<{
    type: "stop" | "delete";
    series: TaskSeriesWithMeta;
  } | null>(null);

  const { data: seriesList = [], isLoading } = useTaskSeriesList({
    isActive: true,
    titleSearch: searchQuery || undefined,
  });

  const stopSeries = useStopTaskSeries();
  const deleteSeries = useDeleteTaskSeriesInstances();

  const handleStopRepeating = (series: TaskSeriesWithMeta) => {
    setConfirmAction({ type: "stop", series });
    setConfirmDialogOpen(true);
  };

  const handleDeleteInstances = (series: TaskSeriesWithMeta) => {
    setConfirmAction({ type: "delete", series });
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (!confirmAction) return;

    if (confirmAction.type === "stop") {
      stopSeries.mutate(confirmAction.series.id);
    } else if (confirmAction.type === "delete") {
      deleteSeries.mutate(confirmAction.series.id);
    }

    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Routines</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your recurring tasks. Create a routine by right-clicking any
          task and selecting "Repeat..."
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search routines..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Routines List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-lg bg-muted/50 animate-pulse"
            />
          ))}
        </div>
      ) : seriesList.length === 0 ? (
        <div className="text-center py-8 border border-dashed rounded-lg">
          <Repeat className="h-8 w-8 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No routines yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {seriesList.map((series) => (
            <RoutineRow
              key={series.id}
              series={series}
              onStop={() => handleStopRepeating(series)}
              onDelete={() => handleDeleteInstances(series)}
            />
          ))}
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirmAction?.type === "stop"
                ? "Stop repeating?"
                : "Stop and delete?"}
            </DialogTitle>
            <DialogDescription>
              {confirmAction?.type === "stop"
                ? `"${confirmAction.series.title}" will stop repeating. Existing instances will be kept.`
                : `"${confirmAction?.series.title}" will stop repeating and all incomplete instances will be deleted.`}
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
              variant={
                confirmAction?.type === "delete" ? "destructive" : "default"
              }
            >
              {confirmAction?.type === "stop"
                ? "Stop repeating"
                : "Stop and delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface RoutineRowProps {
  series: TaskSeriesWithMeta;
  onStop: () => void;
  onDelete: () => void;
}

function RoutineRow({ series, onStop, onDelete }: RoutineRowProps) {
  const scheduleDesc = getScheduleDescription({
    recurrenceType: series.recurrenceType,
    frequency: series.frequency,
    daysOfWeek: series.daysOfWeek ?? undefined,
    dayOfMonth: series.dayOfMonth ?? undefined,
    weekOfMonth: series.weekOfMonth ?? undefined,
    dayOfWeekMonthly: series.dayOfWeekMonthly ?? undefined,
  });

  const startDate = new Date(series.startDate);
  const formattedTime = series.startTime
    ? formatTime12Hour(series.startTime)
    : null;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
        <Repeat className="h-4 w-4" />
      </div>

      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-sm truncate">{series.title}</h3>
        <p className="text-xs text-muted-foreground">
          {scheduleDesc}
          {formattedTime && ` · at ~${formattedTime}`}
        </p>
      </div>

      <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        <div className="text-right hidden sm:block">
          <div className="text-muted-foreground/70">Started</div>
          <div className="font-medium text-foreground">
            {format(startDate, "MMM d, yyyy")}
          </div>
        </div>

        {series.instanceCount !== undefined && (
          <div className="text-right hidden sm:block">
            <div className="text-muted-foreground/70">Instances</div>
            <div className="font-medium text-foreground">
              {series.instanceCount}
            </div>
          </div>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onSelect={onStop}>
              <Square className="mr-2 h-4 w-4" />
              Stop repeating
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Stop and delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
