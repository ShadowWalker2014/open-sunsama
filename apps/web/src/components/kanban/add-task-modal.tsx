import * as React from "react";
import { Clock } from "lucide-react";
import type { TaskPriority } from "@chronoflow/types";
import { cn } from "@/lib/utils";
import { useCreateTask } from "@/hooks/useTasks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
      <DialogContent className="max-w-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                ref={titleInputRef}
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What needs to be done?"
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Add details, notes, or context..."
                minHeight="100px"
              />
            </div>

            {/* Subtasks */}
            <div className="space-y-2">
              <Label>Subtasks</Label>
              <SubtaskList subtasks={subtasks} onSubtasksChange={setSubtasks} />
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-fit gap-2 h-9"
                  >
                    <PriorityIcon priority={priority} />
                    <span>{PRIORITY_LABELS[priority]}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40">
                  {PRIORITIES.map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => setPriority(p)}
                      className={cn("gap-2", priority === p && "bg-accent")}
                    >
                      <PriorityIcon priority={p} />
                      <span>{PRIORITY_LABELS[p]}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Estimated time */}
            <div className="space-y-2">
              <Label>Estimated Time</Label>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={estimatedMins}
                  onChange={(e) => setEstimatedMins(e.target.value)}
                  placeholder="Minutes"
                  className="w-24"
                  min={1}
                  max={480}
                />
                <span className="text-sm text-muted-foreground">minutes</span>
              </div>
            </div>
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
              disabled={!title.trim() || createTask.isPending}
            >
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
