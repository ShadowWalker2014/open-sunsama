import * as React from "react";
import { Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface CreateTaskItemProps {
  query: string;
  isSelected: boolean;
  isCreating: boolean;
  onClick: () => void;
}

export function CreateTaskItem({
  query,
  isSelected,
  isCreating,
  onClick,
}: CreateTaskItemProps) {
  return (
    <button
      data-selected={isSelected}
      onClick={onClick}
      disabled={isCreating}
      className={cn(
        "flex items-center gap-3 px-3 h-[40px] w-full text-left transition-colors cursor-pointer mt-1",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <Plus className="h-4 w-4 text-primary shrink-0" />
      <span className="text-[13px] text-primary flex-1">Create "{query}"</span>
      {isCreating && <Loader2 className="h-3 w-3 animate-spin" />}
    </button>
  );
}
