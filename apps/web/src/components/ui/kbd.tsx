import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Keyboard-key badge. Used by the shortcuts modal and the command palette.
 * Lives in its own file so consumers can import it without pulling in the
 * shortcuts-modal chunk (which is itself lazy-loaded).
 */
export function Kbd({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-border bg-muted px-1.5",
        "text-[11px] font-medium text-muted-foreground",
        className
      )}
    >
      {children}
    </kbd>
  );
}
