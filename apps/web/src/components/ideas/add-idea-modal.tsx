import { Dialog, DialogContent, DialogTitle } from "@/components/ui";
import { AddTaskComposer } from "@/components/kanban/add-task-composer";
import { useCreateIdea } from "@/hooks/useIdeas";
import { useCreateIdeaSubtask } from "@/hooks/useIdeaSubtasks";

interface AddIdeaModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boardId: string;
  columnId: string;
  columnName: string;
}

/**
 * Add an idea with the same quick composer as tasks: one line for the
 * title, Tab for subtasks, chips for planned time and priority.
 */
export function AddIdeaModal({
  open,
  onOpenChange,
  boardId,
  columnId,
  columnName,
}: AddIdeaModalProps) {
  const createIdea = useCreateIdea(boardId);
  const createSubtask = useCreateIdeaSubtask();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="top-[18vh] max-w-xl translate-y-0 gap-0 overflow-visible rounded-xl border-border/40 bg-popover p-0 shadow-2xl [&>button]:hidden"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">Add idea to {columnName}</DialogTitle>
        {open && (
          <AddTaskComposer
            scheduledDate={null}
            showDate={false}
            showPosition={false}
            placeholder="Idea…"
            context={`Adding to ${columnName}`}
            onDone={() => onOpenChange(false)}
            onSubmit={(values) => {
              void createIdea
                .mutateAsync({
                  boardId,
                  columnId,
                  title: values.title,
                  estimatedMins: values.estimatedMins ?? undefined,
                  priority: values.priority,
                })
                .then(async (idea) => {
                  // One at a time, so they keep the order they were typed in.
                  for (const title of values.subtasks) {
                    await createSubtask.mutateAsync({ ideaId: idea.id, input: { title } });
                  }
                })
                .catch(() => {
                  // The create hooks show the error.
                });
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
