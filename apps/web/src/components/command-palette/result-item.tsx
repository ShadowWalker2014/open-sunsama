import * as React from "react";
import { cn } from "@/lib/utils";

interface ResultItemProps {
  icon: React.ReactNode;
  title: string;
  /** Muted context shown after the title (board name, calendar, …). */
  subtitle?: string | null;
  /** Right-aligned meta — a date, a time, a badge. */
  meta?: React.ReactNode;
  isSelected: boolean;
  strikethrough?: boolean;
  onClick: () => void;
}

/**
 * One row of palette search results. A single shape across tasks, ideas and
 * events keeps the list scannable: icon, title, muted context, right-aligned
 * meta — all on one line that truncates rather than wraps.
 */
export function ResultItem({
  icon,
  title,
  subtitle,
  meta,
  isSelected,
  strikethrough,
  onClick,
}: ResultItemProps) {
  return (
    <button
      data-selected={isSelected}
      onClick={onClick}
      className={cn(
        "flex h-[40px] w-full cursor-pointer items-center gap-3 px-3 text-left transition-colors",
        isSelected ? "bg-accent" : "hover:bg-accent/50"
      )}
    >
      <span className="shrink-0 text-muted-foreground">{icon}</span>
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-[13px]",
          strikethrough && "text-muted-foreground line-through"
        )}
      >
        {title}
      </span>
      {subtitle && (
        <span className="hidden max-w-[35%] shrink-0 truncate text-[11px] text-muted-foreground sm:inline">
          {subtitle}
        </span>
      )}
      {meta && (
        <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground/80">
          {meta}
        </span>
      )}
    </button>
  );
}
