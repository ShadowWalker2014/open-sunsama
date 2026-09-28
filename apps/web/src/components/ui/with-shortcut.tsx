import * as React from "react";
import { SHORTCUTS, formatShortcut } from "@/hooks/useKeyboardShortcuts";
import { Tooltip, TooltipContent, TooltipTrigger } from "./tooltip";

/**
 * The one way to surface a shortcut: hovering or focusing a control shows
 * its name and key, e.g. "Complete task  C". Pass a SHORTCUTS entry or
 * literal keys.
 */
interface WithShortcutProps extends React.HTMLAttributes<HTMLElement> {
  label: string;
  shortcut?: keyof typeof SHORTCUTS;
  keys?: string[];
  side?: "top" | "bottom" | "left" | "right";
  children: React.ReactElement;
}

// Forwards props and ref so it can sit inside another asChild trigger
// (a popover or menu) and still pass them to the control.
export const WithShortcut = React.forwardRef<HTMLElement, WithShortcutProps>(
  function WithShortcut(
    { label, shortcut, keys, side = "top", children, ...rest },
    ref
  ) {
    const def = shortcut ? SHORTCUTS[shortcut] : undefined;
    const parts = keys ?? (def ? formatShortcut(def).split(" ") : []);
    return (
      <Tooltip delayDuration={400}>
        <TooltipTrigger
          asChild
          ref={ref as React.Ref<HTMLButtonElement>}
          {...rest}
        >
          {children}
        </TooltipTrigger>
        <TooltipContent side={side} className="flex items-center gap-2 text-xs">
          <span>{label}</span>
          {parts.length > 0 && <KeyCaps keys={parts} />}
        </TooltipContent>
      </Tooltip>
    );
  }
);

export function KeyCaps({ keys }: { keys: string[] }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {keys.map((k, i) => (
        <kbd
          key={i}
          className="inline-flex h-4 min-w-[16px] items-center justify-center rounded border border-current/20 px-1 text-[10px] font-medium opacity-70"
        >
          {k}
        </kbd>
      ))}
    </span>
  );
}
