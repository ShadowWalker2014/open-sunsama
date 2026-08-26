import * as React from "react";
import { ChevronDown, Clock } from "lucide-react";
import type { TaskPriority } from "@open-sunsama/types";
import { cn, TIME_PRESETS, formatTimeDisplayCompact } from "@/lib/utils";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui";
import { PriorityIcon, PRIORITY_LABELS } from "@/components/ui/priority-badge";
import { RichTextEditor } from "@/components/ui/rich-text-editor.lazy";
import { SubtaskList, type Subtask } from "@/components/kanban/subtask-list";
import { useCreateIdea } from "@/hooks/useIdeas";
import { useCreateIdeaSubtask } from "@/hooks/useIdeaSubtasks";

const PRIORITIES: TaskPriority[] = ["P0", "P1", "P2", "P3"];

interface AddIdeaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  columnId: string;
  columnName: string;
}

/**
 * Add-idea modal — the same Dialog chrome + rich text editor as AddTaskModal
 * (add-task-modal.tsx), trimmed to the Ideas model (title + notes, scoped to
 * a column).
 */
export function AddIdeaModal({
  open,
  onOpenChange,
  boardId,
  columnId,
  columnName,
}: AddIdeaModalProps) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [estimatedMins, setEstimatedMins] = React.useState<string>("");
  const [priority, setPriority] = React.useState<TaskPriority>("P2");
  const [subtasks, setSubtasks] = React.useState<Subtask[]>([]);
  const createIdea = useCreateIdea(boardId);
  const createSubtask = useCreateIdeaSubtask();

  const titleInputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);

  // Focus title when opening.
  React.useEffect(() => {
    if (open) setTimeout(() => titleInputRef.current?.focus(), 100);
  }, [open]);

  // Reset on close.
  React.useEffect(() => {
    if (!open) {
      setTitle("");
      setDescription("");
      setEstimatedMins("");
      setPriority("P2");
      setSubtasks([]);
    }
  }, [open]);

  // ⌘/Ctrl+Enter to submit.
  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const idea = await createIdea.mutateAsync({
      boardId,
      columnId,
      title: title.trim(),
      notes: description || undefined,
      estimatedMins: estimatedMins ? parseInt(estimatedMins, 10) : undefined,
      priority,
    });
    // Persist subtasks once we have the idea id.
    if (subtasks.length > 0) {
      await Promise.all(
        subtasks.map((st) =>
          createSubtask.mutateAsync({
            ideaId: idea.id,
            input: { title: st.title },
          })
        )
      );
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md gap-0 overflow-hidden p-0">
        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Header — title input */}
          <div className="border-b px-4 pb-3 pt-4">
            <Input
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Idea title..."
              required
              className="h-auto border-none p-0 pr-6 text-base font-medium shadow-none focus-visible:ring-0"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">
              Adding to <span className="font-medium">{columnName}</span>
            </p>
          </div>

          {/* Body — priority, subtasks, notes, estimate */}
          <div className="max-h-[50vh] space-y-4 overflow-y-auto px-4 py-4">
            {/* Priority */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">
                Priority
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1.5 px-2.5 text-sm font-normal"
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
                      className={cn(
                        "gap-2 text-sm",
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

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Subtasks
              </Label>
              <SubtaskList subtasks={subtasks} onSubtasksChange={setSubtasks} />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Notes
              </Label>
              <RichTextEditor
                value={description}
                onChange={setDescription}
                placeholder="Add details..."
                minHeight="80px"
              />
            </div>

            {/* Estimated time */}
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-muted-foreground">
                Duration
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 gap-1.5 px-2.5 text-sm font-normal",
                      !estimatedMins && "text-muted-foreground"
                    )}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {formatTimeDisplayCompact(estimatedMins) || "Time"}
                    </span>
                    <ChevronDown className="h-3 w-3 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  {TIME_PRESETS.map((preset) => (
                    <DropdownMenuItem
                      key={preset.value}
                      onClick={() => setEstimatedMins(preset.value)}
                      className={cn(
                        "text-sm",
                        estimatedMins === preset.value && "bg-accent"
                      )}
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
          <DialogFooter className="flex-row items-center justify-between gap-2 border-t bg-muted/20 px-4 py-3">
            <span className="hidden items-center gap-1 text-xs text-muted-foreground/50 sm:inline-flex">
              <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium">
                ⌘
              </kbd>
              <kbd className="inline-flex h-5 select-none items-center rounded border bg-muted px-1 font-mono text-[10px] font-medium">
                ↵
              </kbd>
              <span className="ml-0.5">add idea</span>
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
              <Button
                type="submit"
                size="sm"
                className="h-8"
                disabled={!title.trim() || createIdea.isPending}
              >
                {createIdea.isPending ? "Adding..." : "Add idea"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
