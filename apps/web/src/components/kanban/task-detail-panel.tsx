import * as React from "react";
import { Check, Trash2, Undo2 } from "lucide-react";
import type { Task } from "@chronoflow/types";
import {
  useUpdateTask,
  useDeleteTask,
  useCompleteTask,
} from "@/hooks/useTasks";
import { useTimeBlocks } from "@/hooks/useTimeBlocks";
import {
  Button,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Badge,
} from "@/components/ui";
import {
  TitleSection,
  DateSection,
  EstimatedTimeSection,
  NotesSection,
} from "./task-form-sections";
import { TimeBlocksList } from "./task-time-blocks";

interface TaskDetailPanelProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

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
          <TitleSection
            title={title}
            isCompleted={isCompleted}
            onChange={setTitle}
            onBlur={handleTitleBlur}
          />

          <DateSection
            scheduledDate={scheduledDate}
            onChange={handleDateChange}
          />

          <EstimatedTimeSection
            estimatedMins={estimatedMins}
            onChange={handleEstimatedTimeChange}
          />

          <NotesSection
            notes={notes}
            onChange={setNotes}
            onBlur={handleNotesBlur}
          />

          <Separator />

          <TimeBlocksList timeBlocks={timeBlocks} />
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
