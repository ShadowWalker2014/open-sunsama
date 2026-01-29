import * as React from "react";
import { ChevronDown } from "lucide-react";
import type { TaskPriority } from "@chronoflow/types";
import { cn } from "@/lib/utils";
import { useCreateTask } from "@/hooks/useTasks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  Button,
  Input,
  Label,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { PriorityIcon, PRIORITY_LABELS } from "@/components/ui/priority-badge";
import { SubtaskList, type Subtask } from "./subtask-list";
import { CompactEstimatedTimeField } from "./task-modal-form";

const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

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

    await createTask.mutateAsync({
      title: title.trim(),
      notes: description || undefined,
      scheduledDate: scheduledDate || undefined,
      estimatedMins: estimatedMins ? parseInt(estimatedMins, 10) : undefined,
      priority,
    });

    // TODO: Create subtasks via API when implemented

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-4 pt-4 pb-3 border-b">
            <div className="flex items-center justify-between gap-3">
              <Input
                ref={titleInputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Task title..."
                required
                className="border-none p-0 text-base font-medium shadow-none focus-visible:ring-0 h-auto flex-1"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 gap-1 text-xs font-medium hover:bg-muted shrink-0"
                  >
                    <PriorityIcon priority={priority} />
                    <span>{priority}</span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  {PRIORITIES.map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn("gap-2 text-xs", priority === p && "bg-accent")}
                    >
                      <PriorityIcon priority={p} />
                      <span>{PRIORITY_LABELS[p]}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </DialogHeader>

          <div className="px-4 py-3 space-y-3 max-h-[50vh] overflow-y-auto">
            {/* Subtasks - first */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Subtasks</Label>
              <SubtaskList subtasks={subtasks} onSubtasksChange={setSubtasks} />
            </div>

            {/* Description - second */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Description</Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Add details..."
                minHeight="80px"
              />
            </div>

            {/* Estimated time - third, using preset popover */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Estimated time</Label>
              <CompactEstimatedTimeField
                value={estimatedMins}
                onChange={setEstimatedMins}
              />
            </div>
          </div>

          <DialogFooter className="px-4 py-2.5 border-t bg-muted/20">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 text-sm"
              disabled={!title.trim() || createTask.isPending}
            >
              {createTask.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
