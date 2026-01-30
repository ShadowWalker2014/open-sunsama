import * as React from "react";
import { cn } from "@/lib/utils";
import { SHORTCUTS, formatShortcut } from "@/hooks/useKeyboardShortcuts";

interface ShortcutHintProps {
  shortcutKey: keyof typeof SHORTCUTS;
  className?: string;
  showOnHover?: boolean;
}

/**
 * Subtle shortcut hint that shows the keyboard shortcut for an action.
 * Linear-style minimal design.
 */
export function ShortcutHint({ shortcutKey, className, showOnHover }: ShortcutHintProps) {
  const shortcut = SHORTCUTS[shortcutKey];
  if (!shortcut) return null;
  
  const formatted = formatShortcut(shortcut);
  const keys = formatted.split(" ");

  return (
    <span 
      className={cn(
        "inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/60",
        showOnHover && "opacity-0 group-hover:opacity-100 transition-opacity",
        className
      )}
    >
      {keys.map((key, idx) => (
        <kbd
          key={idx}
          className="inline-flex h-4 min-w-[14px] items-center justify-center rounded border border-border/50 bg-muted/50 px-1 text-[9px] font-medium"
        >
          {key}
        </kbd>
      ))}
    </span>
  );
}
