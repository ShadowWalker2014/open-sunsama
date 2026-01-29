import * as React from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import type { TimeBlock } from "@chronoflow/types";
import { useUpdateTimeBlock, useDeleteTimeBlock } from "@/hooks";
import {
  Button,
  Label,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui";
import {
  TimeBlockTitleSection,
  TimeRangeSection,
  ColorSection,
  TimeBlockNotesSection,
} from "./time-block-form-sections";

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

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader className="space-y-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="sr-only">Time Block Details</SheetTitle>
            <div className="flex items-center gap-2">
              <div
                className="h-4 w-4 rounded-full border"
                style={{ backgroundColor: color || "#3B82F6" }}
              />
              <span className="text-sm text-muted-foreground">
                {format(blockStartTime, "EEE, MMM d")}
              </span>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 space-y-6 overflow-y-auto py-4">
          <TimeBlockTitleSection
            title={title}
            onChange={setTitle}
            onBlur={handleTitleBlur}
          />

          <TimeRangeSection
            startTime={startTime}
            endTime={endTime}
            durationMins={durationMins}
            onStartTimeChange={setStartTime}
            onEndTimeChange={setEndTime}
            onBlur={handleTimeBlur}
          />

          <ColorSection color={color} onChange={handleColorChange} />

          <TimeBlockNotesSection
            notes={notes}
            onChange={setNotes}
            onBlur={handleNotesBlur}
          />

          <Separator />

          {/* Associated Task Info */}
          {timeBlock.taskId && (
            <div className="space-y-2">
              <Label className="text-muted-foreground">Associated Task</Label>
              <p className="text-sm text-muted-foreground">
                This time block is linked to a task. Click on the task in the
                unscheduled panel to view its details.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end border-t pt-4">
          {/* Delete Button */}
          {showDeleteConfirm ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Delete this time block?</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                disabled={deleteTimeBlock.isPending}
              >
                {deleteTimeBlock.isPending ? "Deleting..." : "Yes, Delete"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
              onClick={() => setShowDeleteConfirm(true)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Time Block
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
