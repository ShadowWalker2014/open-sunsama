import * as React from "react";
import { format } from "date-fns";
import { Trash2, Check } from "lucide-react";
import type { TimeBlock } from "@open-sunsama/types";
import { useUpdateTimeBlock, useDeleteTimeBlock, useTask, useSubtasks, useUpdateSubtask } from "@/hooks";
import { cn } from "@/lib/utils";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import { PriorityBadge } from "@/components/ui/priority-badge";
import {
  TimeBlockTitleSection,
  TimeRangeSection,
  ColorSection,
} from "./time-block-form-sections";
import { NotesField } from "@/components/ui/notes-field";

interface TimeBlockDetailSheetProps {
  timeBlock: TimeBlock | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Slide-over panel for viewing and editing time block details.
 * Includes full editing, color selection, and delete functionality.
 */
export function TimeBlockDetailSheet({
  timeBlock,
  open,
  onOpenChange,
}: TimeBlockDetailSheetProps) {
  const [title, setTitle] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [color, setColor] = React.useState<string | null>(null);
  const [startTime, setStartTime] = React.useState("");
  const [endTime, setEndTime] = React.useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);

  const updateTimeBlock = useUpdateTimeBlock();
  const deleteTimeBlock = useDeleteTimeBlock();
  
  // Fetch associated task and subtasks if linked
  const { data: linkedTask } = useTask(timeBlock?.taskId ?? "");
  const { data: subtasks = [] } = useSubtasks(timeBlock?.taskId ?? "");
  const updateSubtask = useUpdateSubtask();

  // Initialize form when time block changes
  React.useEffect(() => {
    if (timeBlock) {
      setTitle(timeBlock.title);
      setNotes(timeBlock.notes ?? "");
      setColor(timeBlock.color);
      
      // Format times for input fields
      const start = new Date(timeBlock.startTime);
      const end = new Date(timeBlock.endTime);
      setStartTime(format(start, "HH:mm"));
      setEndTime(format(end, "HH:mm"));
      setShowDeleteConfirm(false);
    }
  }, [timeBlock]);

  const handleSave = async () => {
    if (!timeBlock) return;

    // Parse the time inputs back to full Date objects
    const blockDate = new Date(timeBlock.startTime);
    const [startHour, startMin] = startTime.split(":").map(Number);
    const [endHour, endMin] = endTime.split(":").map(Number);
    
    const newStartTime = new Date(blockDate);
    newStartTime.setHours(startHour ?? 0, startMin ?? 0, 0, 0);
    
    const newEndTime = new Date(blockDate);
    newEndTime.setHours(endHour ?? 0, endMin ?? 0, 0, 0);

    await updateTimeBlock.mutateAsync({
      id: timeBlock.id,
      data: {
        title: title.trim(),
        notes: notes.trim() || null,
        color: color,
        startTime: newStartTime,
        endTime: newEndTime,
      },
    });
  };

  const handleTitleBlur = () => {
    if (timeBlock && title.trim() !== timeBlock.title) {
      handleSave();
    }
  };

  const handleNotesBlur = () => {
    if (timeBlock && notes.trim() !== (timeBlock.notes ?? "")) {
      handleSave();
    }
  };

  const handleTimeBlur = () => {
    if (!timeBlock) return;
    
    const [currentStartHour, currentStartMin] = format(new Date(timeBlock.startTime), "HH:mm").split(":").map(Number);
    const [currentEndHour, currentEndMin] = format(new Date(timeBlock.endTime), "HH:mm").split(":").map(Number);
    const [newStartHour, newStartMin] = startTime.split(":").map(Number);
    const [newEndHour, newEndMin] = endTime.split(":").map(Number);
    
    // Check if times have changed
    const startChanged = newStartHour !== currentStartHour || newStartMin !== currentStartMin;
    const endChanged = newEndHour !== currentEndHour || newEndMin !== currentEndMin;
    
    if (startChanged || endChanged) {
      handleSave();
    }
  };

  const handleColorChange = async (newColor: string) => {
    setColor(newColor);
    if (timeBlock) {
      await updateTimeBlock.mutateAsync({
        id: timeBlock.id,
        data: { color: newColor },
      });
    }
  };

  const handleDelete = async () => {
    if (!timeBlock) return;
    await deleteTimeBlock.mutateAsync(timeBlock.id);
    onOpenChange(false);
  };

  if (!timeBlock) return null;

  const blockStartTime = new Date(timeBlock.startTime);
  const blockEndTime = new Date(timeBlock.endTime);
  const durationMins = Math.round(
    (blockEndTime.getTime() - blockStartTime.getTime()) / 60000
  );

  const toggleSubtask = async (subtaskId: string, completed: boolean) => {
    if (!timeBlock?.taskId) return;
    await updateSubtask.mutateAsync({
      taskId: timeBlock.taskId,
      subtaskId,
      data: { completed: !completed },
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-sm p-4">
        <SheetHeader className="space-y-0 pb-3">
          <SheetTitle className="sr-only">Time Block Details</SheetTitle>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: color || "#3B82F6" }}
            />
            <span>{format(blockStartTime, "EEE, MMM d")}</span>
            {linkedTask && <PriorityBadge priority={linkedTask.priority} />}
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {/* Title */}
          <TimeBlockTitleSection
            title={title}
            onChange={setTitle}
            onBlur={handleTitleBlur}
          />

          {/* Time */}
          <TimeRangeSection
            startTime={startTime}
            endTime={endTime}
            durationMins={durationMins}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onBlur={handleTimeBlur}
          />

          {/* Color */}
          <ColorSection color={color} onChange={handleColorChange} />

          {/* Subtasks - only show if task has subtasks */}
          {subtasks.length > 0 && (
            <div className="space-y-1.5">
              <span className="text-xs text-muted-foreground">Subtasks</span>
              <div className="space-y-0.5">
                {subtasks.map((subtask) => (
                  <button
                    key={subtask.id}
                    onClick={() => toggleSubtask(subtask.id, subtask.completed)}
                    className="flex items-center gap-2 w-full py-1 text-left hover:bg-muted/50 rounded px-1 -mx-1 transition-colors"
                  >
                    <div
                      className={cn(
                        "h-3.5 w-3.5 shrink-0 rounded-full border flex items-center justify-center transition-colors",
                        subtask.completed
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      )}
                    >
                      {subtask.completed && <Check className="h-2 w-2" strokeWidth={3} />}
                    </div>
                    <span
                      className={cn(
                        "text-sm truncate",
                        subtask.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {subtask.title}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Notes</span>
            <NotesField
              notes={notes}
              onChange={setNotes}
              onBlur={handleNotesBlur}
              placeholder="Add notes..."
              minHeight="60px"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-3 border-t">
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Delete?</span>
              <Button
                variant="destructive"
                size="sm"
                className="h-7 text-xs"
                onClick={handleDelete}
                disabled={deleteTimeBlock.isPending}
              >
                Yes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowDeleteConfirm(false)}
              >
                No
              </Button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
