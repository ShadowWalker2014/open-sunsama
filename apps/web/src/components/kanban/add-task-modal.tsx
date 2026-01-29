import * as React from "react";
import { Plus, X, Check, Clock } from "lucide-react";
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

const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface AddTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduledDate?: string | null;
}

export function AddTaskModal({ open, onOpenChange, scheduledDate }: AddTaskModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [estimatedMins, setEstimatedMins] = React.useState<string>("");
  const [priority, setPriority] = React.useState<TaskPriority>("P2");
  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState("");

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
      setNewSubtaskTitle("");
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

  // Subtask handlers
  const addSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSubtask: Subtask = {
      id: `temp-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      completed: false,
    };
    setSubtasks([...subtasks, newSubtask]);
    setNewSubtaskTitle("");
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(
      subtasks.map((st) =>
        st.id === id ? { ...st, completed: !st.completed } : st
      )
    );
  };

  const deleteSubtask = (id: string) => {
    setSubtasks(subtasks.filter((st) => st.id !== id));
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
              
              {/* Subtask list */}
              {subtasks.length > 0 && (
                <div className="space-y-1 mb-2">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="group flex items-center gap-2 py-1.5 px-2 -mx-2 rounded-md hover:bg-muted/50"
                    >
                      <button
                        type="button"
                        onClick={() => toggleSubtask(subtask.id)}
                        className={cn(
                          "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                          subtask.completed
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground/40 hover:border-primary"
                        )}
                      >
                        {subtask.completed && (
                          <Check className="h-2.5 w-2.5" strokeWidth={3} />
                        )}
                      </button>
                      <span
                        className={cn(
                          "flex-1 text-sm",
                          subtask.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {subtask.title}
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => deleteSubtask(subtask.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add subtask input */}
              <div className="flex items-center gap-2">
                <Plus className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubtask();
                    }
                  }}
                  placeholder="Add a subtask..."
                  className="border-none p-0 h-auto text-sm shadow-none focus-visible:ring-0"
                />
              </div>
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
                      className={cn(
                        "gap-2",
                        priority === p && "bg-accent"
                      )}
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
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || createTask.isPending}>
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
