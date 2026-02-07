import * as React from "react";
import { Pencil, Eye, Unlink, Trash2 } from "lucide-react";
import type { TimeBlock } from "@open-sunsama/types";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui";
import { useDeleteTimeBlock, useUpdateTimeBlock } from "@/hooks";
import { toast } from "@/hooks/use-toast";

interface TimeBlockContextMenuProps {
  timeBlock: TimeBlock;
  children: React.ReactNode;
  onEdit?: () => void;
  onEditBlock?: () => void;
  onViewTask?: (taskId: string) => void;
}

export function TimeBlockContextMenu({
  timeBlock,
  children,
  onEdit,
  onEditBlock,
  onViewTask,
}: TimeBlockContextMenuProps) {
  const deleteTimeBlock = useDeleteTimeBlock();
  const updateTimeBlock = useUpdateTimeBlock();

  const hasLinkedTask = timeBlock.taskId !== null;

  const handleEdit = () => {
    onEdit?.();
  };

  const handleEditBlock = () => {
    onEditBlock?.();
  };

  const handleViewTask = () => {
    if (timeBlock.taskId) {
      onViewTask?.(timeBlock.taskId);
    }
  };

  const handleUnlinkTask = async () => {
    if (!timeBlock.taskId) return;

    await updateTimeBlock.mutateAsync({
      id: timeBlock.id,
      data: { taskId: null },
    });

    toast({
      title: "Task unlinked",
      description: `"${timeBlock.title}" is no longer linked to a task.`,
    });
  };

  const handleDelete = async () => {
    const deletedBlock = timeBlock;

    await deleteTimeBlock.mutateAsync(timeBlock.id);

    toast({
      title: "Time block deleted",
      description: `"${deletedBlock.title}" has been removed from your calendar.`,
    });
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        {/* Open Task - for linked blocks, or Edit for standalone */}
        <ContextMenuItem onClick={handleEdit}>
          {hasLinkedTask ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Open Task
            </>
          ) : (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </>
          )}
          <ContextMenuShortcut>Enter</ContextMenuShortcut>
        </ContextMenuItem>

        {/* Edit Time Block - only show for linked blocks (standalone uses Edit above) */}
        {hasLinkedTask && (
          <ContextMenuItem onClick={handleEditBlock}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Time Block
          </ContextMenuItem>
        )}

        <ContextMenuSeparator />

        {/* Unlink Task - only show if time block has a linked task */}
        {hasLinkedTask && (
          <>
            <ContextMenuItem onClick={handleUnlinkTask}>
              <Unlink className="mr-2 h-4 w-4" />
              Unlink Task
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}

        {/* Delete Time Block */}
        <ContextMenuItem
          onClick={handleDelete}
          className="text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
          <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
