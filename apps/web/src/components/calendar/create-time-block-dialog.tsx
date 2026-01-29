import * as React from "react";
import { format } from "date-fns";
import { Clock, ListTodo } from "lucide-react";
import type { Task } from "@chronoflow/types";
import { useCreateTimeBlock, useTasks } from "@/hooks";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@/components/ui";

interface CreateTimeBlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The date for which to create the time block */
  date: Date;
  /** Pre-filled start time */
  startTime: Date;
  /** Pre-filled end time */
  endTime: Date;
}

/**
 * Dialog for quickly creating a new time block when clicking on an empty slot.
 * Allows setting a title and optionally associating a task.
 */
export function CreateTimeBlockDialog({
  open,
  onOpenChange,
  date,
  startTime,
  endTime,
}: CreateTimeBlockDialogProps) {
  const [title, setTitle] = React.useState("");
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const [showTaskList, setShowTaskList] = React.useState(false);

  const createTimeBlock = useCreateTimeBlock();
  
  // Fetch unscheduled tasks for today that could be associated
  const dateString = format(date, "yyyy-MM-dd");
  const { data: tasks = [] } = useTasks({ scheduledDate: dateString });

  // Filter to incomplete tasks
  const availableTasks = tasks.filter((task) => !task.completedAt);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setTitle("");
      setSelectedTaskId(null);
      setShowTaskList(false);
    }
  }, [open]);

  // Update title when task is selected
  React.useEffect(() => {
    if (selectedTaskId) {
      const task = availableTasks.find((t) => t.id === selectedTaskId);
      if (task) {
        setTitle(task.title);
      }
    }
  }, [selectedTaskId, availableTasks]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    await createTimeBlock.mutateAsync({
      title: title.trim(),
      startTime,
      endTime,
      taskId: selectedTaskId ?? undefined,
    });

    onOpenChange(false);
  };

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId === selectedTaskId ? null : taskId);
    setShowTaskList(false);
  };

  const selectedTask = selectedTaskId
    ? availableTasks.find((t) => t.id === selectedTaskId)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Time Block</DialogTitle>
          <DialogDescription>
            Schedule a new time block for {format(date, "EEEE, MMMM d")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Time Display */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg px-3 py-2">
            <Clock className="h-4 w-4" />
            <span>
              {format(startTime, "h:mm a")} - {format(endTime, "h:mm a")}
            </span>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What are you working on?"
              autoFocus
            />
          </div>

          {/* Task Association */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ListTodo className="h-4 w-4" />
              Link to Task (Optional)
            </Label>
            
            {selectedTask ? (
              <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                <span className="text-sm truncate">{selectedTask.title}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedTaskId(null);
                    setTitle("");
                  }}
                >
                  Remove
                </Button>
              </div>
            ) : (
              <div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setShowTaskList(!showTaskList)}
                >
                  {availableTasks.length > 0
                    ? "Select a task..."
                    : "No tasks available"}
                </Button>

                {showTaskList && availableTasks.length > 0 && (
                  <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border bg-background shadow-md">
                    {availableTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-muted transition-colors truncate"
                        onClick={() => handleTaskSelect(task.id)}
                      >
                        {task.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || createTimeBlock.isPending}
            >
              {createTimeBlock.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
