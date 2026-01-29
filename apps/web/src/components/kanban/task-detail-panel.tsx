import * as React from "react";
import { format } from "date-fns";
import {
  Calendar,
  Check,
  Clock,
  FileText,
  Trash2,
  Undo2,
} from "lucide-react";
import type { Task, TimeBlock } from "@chronoflow/types";
import {
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
} from "@/hooks/useTasks";
import { useTimeBlocks } from "@/hooks/useTimeBlocks";
import { cn, formatDuration } from "@/lib/utils";
import {
  Button,
  Input,
  Label,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Textarea,
  Badge,
} from "@/components/ui";

interface TaskDetailPanelProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ESTIMATED_TIME_OPTIONS = [
  { value: 15, label: "15 min" },
  { value: 30, label: "30 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
];

/**
 * Slide-over panel for viewing and editing task details.
 * Includes full task editing, completion toggle, and delete functionality.
 */
export function TaskDetailPanel({
  task,
  open,
  onOpenChange,
}: TaskDetailPanelProps) {
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [scheduledDate, setScheduledDate] = React.useState("");
  const [estimatedMins, setEstimatedMins] = React.useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const completeTask = useCompleteTask();

  // Fetch time blocks for this task
  const { data: timeBlocks } = useTimeBlocks(
    task ? { taskId: task.id } : undefined
  );

  const isCompleted = task?.completedAt != null;

  // Initialize form when task changes
  React.useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes ?? "");
      setScheduledDate(task.scheduledDate ?? "");
      setEstimatedMins(task.estimatedMins);
      setShowDeleteConfirm(false);
    }
  }, [task]);

  const handleSave = async () => {
    if (!task) return;

    await updateTask.mutateAsync({
      id: task.id,
      data: {
        title: title.trim(),
        notes: notes.trim() || null,
        scheduledDate: scheduledDate || null,
        estimatedMins: estimatedMins,
      },
    });
  };

  const handleTitleBlur = () => {
    if (task && title.trim() !== task.title) {
      handleSave();
    }
  };

  const handleNotesBlur = () => {
    if (task && notes.trim() !== (task.notes ?? "")) {
      handleSave();
    }
  };

  const handleDateChange = async (value: string) => {
    setScheduledDate(value);
    if (task) {
      await updateTask.mutateAsync({
        id: task.id,
        data: { scheduledDate: value || null },
      });
    }
  };

  const handleEstimatedTimeChange = async (value: number | null) => {
    setEstimatedMins(value);
    if (task) {
      await updateTask.mutateAsync({
        id: task.id,
        data: { estimatedMins: value },
      });
    }
  };

  const handleToggleComplete = async () => {
    if (!task) return;
    await completeTask.mutateAsync({
      id: task.id,
      completed: !isCompleted,
    });
  };

  const handleDelete = async () => {
    if (!task) return;
    await deleteTask.mutateAsync(task.id);
    onOpenChange(false);
  };

  if (!task) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="space-y-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="sr-only">Task Details</SheetTitle>
            <Badge
              variant={isCompleted ? "success" : "secondary"}
              className="gap-1"
            >
              {isCompleted ? (
                <>
                  <Check className="h-3 w-3" />
                  Completed
                </>
              ) : (
                "Pending"
              )}
            </Badge>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              className={cn(
                "text-lg font-semibold",
                isCompleted && "line-through text-muted-foreground"
              )}
            />
          </div>

          {/* Scheduled Date */}
          <div className="space-y-2">
            <Label htmlFor="task-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Scheduled Date
            </Label>
            <Input
              id="task-date"
              type="date"
              value={scheduledDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          {/* Estimated Time */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Estimated Time
            </Label>
            <div className="flex flex-wrap gap-2">
              {ESTIMATED_TIME_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  variant={estimatedMins === option.value ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    handleEstimatedTimeChange(
                      estimatedMins === option.value ? null : option.value
                    )
                  }
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="task-notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Notes
            </Label>
            <Textarea
              id="task-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
              rows={4}
            />
          </div>

          <Separator />

          {/* Time Blocks */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              Time Blocks
            </Label>
            {timeBlocks && timeBlocks.length > 0 ? (
              <div className="space-y-2">
                {timeBlocks.map((block) => (
                  <TimeBlockItem key={block.id} timeBlock={block} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No time blocks scheduled for this task.
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t pt-4">
          {/* Complete/Uncomplete Button */}
          <Button
            variant={isCompleted ? "outline" : "default"}
            onClick={handleToggleComplete}
            className="gap-2"
          >
            {isCompleted ? (
              <>
                <Undo2 className="h-4 w-4" />
                Mark Incomplete
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Mark Complete
              </>
            )}
          </Button>

          {/* Delete Button */}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Delete?</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

interface TimeBlockItemProps {
  timeBlock: TimeBlock;
}

function TimeBlockItem({ timeBlock }: TimeBlockItemProps) {
  const startTime = new Date(timeBlock.startTime);
  const endTime = new Date(timeBlock.endTime);
  const durationMins = Math.round(
    (endTime.getTime() - startTime.getTime()) / 60000
  );

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
      <div>
        <p className="text-sm font-medium">
          {format(startTime, "EEE, MMM d")}
        </p>
        <p className="text-xs text-muted-foreground">
          {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
        </p>
      </div>
      <Badge variant="secondary">{formatDuration(durationMins)}</Badge>
    </div>
  );
}
