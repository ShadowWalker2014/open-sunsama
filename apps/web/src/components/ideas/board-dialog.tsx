import * as React from "react";
import type { IdeaBoard } from "@open-sunsama/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Button,
  Input,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui";
import { useCreateIdeaBoard, useUpdateIdeaBoard } from "@/hooks/useIdeas";
import { BoardIcon } from "./board-icon";
import { IconPicker } from "./icon-picker";
import { DEFAULT_ICON } from "./idea-icons";

const DEFAULT_COLOR = "#6366F1";

interface BoardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the dialog edits this board; otherwise it creates one. */
  board?: IdeaBoard;
  /** Called with the new board id after a successful create. */
  onCreated?: (boardId: string) => void;
}

export function BoardDialog({
  open,
  onOpenChange,
  board,
  onCreated,
}: BoardDialogProps) {
  const isEdit = !!board;
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState(DEFAULT_ICON);
  const [color, setColor] = React.useState(DEFAULT_COLOR);
  const [pickerOpen, setPickerOpen] = React.useState(false);

  const createBoard = useCreateIdeaBoard();
  const updateBoard = useUpdateIdeaBoard();
  const pending = createBoard.isPending || updateBoard.isPending;

  // Reset form whenever the dialog opens.
  React.useEffect(() => {
    if (open) {
      setName(board?.name ?? "");
      setIcon(board?.icon ?? DEFAULT_ICON);
      setColor(board?.color ?? DEFAULT_COLOR);
      setPickerOpen(false);
    }
  }, [open, board]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    if (isEdit && board) {
      await updateBoard.mutateAsync({
        id: board.id,
        input: { name: trimmed, icon, color },
      });
      onOpenChange(false);
    } else {
      const created = await createBoard.mutateAsync({
        name: trimmed,
        icon,
        color,
      });
      onOpenChange(false);
      onCreated?.(created.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit board" : "New board"}</DialogTitle>
            <DialogDescription>
              Group a kind of idea — movies, startup ideas, books…
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Name</label>
            <div className="flex items-center gap-2.5">
              <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    title="Choose icon"
                    className="shrink-0 rounded-lg outline-hidden ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <BoardIcon icon={icon} color={color} size={40} />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-auto p-1">
                  <IconPicker
                    icon={icon}
                    color={color}
                    onIconChange={setIcon}
                    onColorChange={setColor}
                  />
                </PopoverContent>
              </Popover>
              <Input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Movies to watch"
                maxLength={120}
                className="flex-1"
              />
            </div>
          </div>

          <DialogFooter className="mt-5">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!name.trim() || pending}>
              {isEdit ? "Save changes" : "Create board"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
