import * as React from "react";
import { ChevronDown, Clock } from "lucide-react";
import type { TaskPriority } from "@open-sunsama/types";
import { cn } from "@/lib/utils";
import { useCreateTask } from "@/hooks/useTasks";
import { useCreateSubtask } from "@/hooks/useSubtaskMutations";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  Button,
  Input,
  Label,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { PriorityIcon, PRIORITY_LABELS } from "@/components/ui/priority-badge";
import { SubtaskList, type Subtask } from "./subtask-list";

const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

const TIME_PRESETS = [
  { label: "15 min", value: "15" },
  { label: "30 min", value: "30" },
  { label: "1 hour", value: "60" },
  { label: "2 hours", value: "120" },
];

function formatTimeDisplay(mins: string): string {
  if (!mins) return "";
  const num = parseInt(mins, 10);
  if (isNaN(num)) return "";
  if (num < 60) return `${num}m`;
  const hours = Math.floor(num / 60);
  const remaining = num % 60;
  if (remaining === 0) return `${hours}h`;
  return `${hours}h ${remaining}m`;
}

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduledDate?: string | null;
}

export function AddTaskModal({
  open,
  onOpenChange,
  scheduledDate,
}: AddTaskModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [estimatedMins, setEstimatedMins] = React.useState<string>("");
  const [priority, setPriority] = React.useState<TaskPriority>("P2");
  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);

  const createTask = useCreateTask();
  const createSubtask = useCreateSubtask();
  const titleInputRef = React.useRef<HTMLInputElement>(null);

  // Focus title input when modal opens
  React.useEffect(() => {
    if (open) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [open]);

  // Reset form when modal closes
  React.useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setEstimatedMins("");
      setPriority("P2");
      setSubtasks([]);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newTask = await createTask.mutateAsync({
      title: title.trim(),
      notes: description || undefined,
      scheduledDate: scheduledDate || undefined,
      estimatedMins: estimatedMins ? parseInt(estimatedMins, 10) : undefined,
      priority,
    });

    // Create subtasks after task is created
    if (subtasks.length > 0) {
      await Promise.all(
        subtasks.map((st) =>
          createSubtask.mutateAsync({
            taskId: newTask.id,
            data: { title: st.title },
          })
        )
      );
    }

    onOpenChange(false);
  };

  const handleTimeSelect = (value: string) => {
    setEstimatedMins(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Header - Title input */}
          <div className="px-4 pt-4 pb-3 border-b">
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              required
              className="border-none p-0 text-base font-medium shadow-none focus-visible:ring-0 h-auto pr-6"
            />
          </div>

          {/* Main Content */}
          <div className="px-4 py-4 space-y-4 max-h-[50vh] overflow-y-auto">
            {/* Priority */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Priority</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 px-2.5 gap-1.5 text-sm font-normal"
                  >
                    <PriorityIcon priority={priority} />
                    <span>{PRIORITY_LABELS[priority]}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  {PRIORITIES.map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn("gap-2 text-sm", priority === p && "bg-accent")}
                    >
                      <PriorityIcon priority={p} />
                      <span>{PRIORITY_LABELS[p]}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Subtasks</Label>
              <SubtaskList
                subtasks={subtasks}
                onSubtasksChange={setSubtasks}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">Notes</Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Add details..."
                minHeight="60px"
              />
            </div>

            {/* Estimated time */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">Duration</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 px-2.5 gap-1.5 text-sm font-normal",
                      !estimatedMins && "text-muted-foreground"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>{formatTimeDisplay(estimatedMins) || "Time"}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-32">
                  {TIME_PRESETS.map((preset) => (
                    <DropdownMenuItem
                      key={preset.value}
                      onClick={() => handleTimeSelect(preset.value)}
                      className={cn("text-sm", estimatedMins === preset.value && "bg-accent")}
                    >
                      {preset.label}
                    </DropdownMenuItem>
                  ))}
                  {estimatedMins && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => setEstimatedMins("")}
                        className="text-sm text-muted-foreground"
                      >
                        Clear
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="px-4 py-3 border-t bg-muted/20 flex-row justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8"
              disabled={!title.trim() || createTask.isPending || createSubtask.isPending}
            >
              {createTask.isPending || createSubtask.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
