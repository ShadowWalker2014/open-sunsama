import * as React from "react";
import { ChevronDown, Clock } from "lucide-react";
import type { TaskPriority } from "@open-sunsama/types";
import { cn, TIME_PRESETS, formatTimeDisplayCompact } from "@/lib/utils";
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
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
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
  const createSubtask = useCreateSubtask();
  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

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

  // Cmd+Enter / Ctrl+Enter to submit
  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
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
        <form ref={formRef} onSubmit={handleSubmit}>
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
                    <span>{formatTimeDisplayCompact(estimatedMins) || "Time"}</span>
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
          <DialogFooter className="px-4 py-3 border-t bg-muted/20 flex-row justify-between items-center gap-2">
            <span className="text-xs text-muted-foreground/50 hidden sm:inline-flex items-center gap-1">
              <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium">⌘</kbd>
              <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium">↵</kbd>
              <span className="ml-0.5">to create</span>
            </span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="submit"
                      size="sm"
                      className="h-8"
                      disabled={!title.trim() || createTask.isPending || createSubtask.isPending}
                    >
                      {createTask.isPending || createSubtask.isPending ? "Creating..." : "Create"}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="flex items-center gap-1.5">
                    <span>Create task</span>
                    <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-0.5 rounded border border-zinc-700 bg-zinc-800 px-1.5 font-mono text-[10px] font-medium text-zinc-300 dark:border-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                      ⌘↵
                    </kbd>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
