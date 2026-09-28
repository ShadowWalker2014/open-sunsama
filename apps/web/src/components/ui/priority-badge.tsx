import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle, Flag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@open-sunsama/types";

/**
 * Priority color palette (consistent across all views):
 * P0 (Urgent): Red
 * P1 (High): Orange
 * P2 (Medium): Blue
 * P3 (Low): Gray
 */

const priorityBadgeVariants = cva(
  "inline-flex items-center justify-center rounded text-xs font-medium transition-colors duration-150",
  {
    variants: {
      priority: {
        P0: "bg-red-500/15 text-red-600 dark:text-red-400",
        P1: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
        P2: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
        P3: "bg-slate-400/10 text-slate-400 dark:text-slate-500",
      },
      size: {
        sm: "h-4 px-1 text-[10px]",
        default: "h-5 px-1.5 text-xs",
        lg: "h-6 px-2 text-sm",
      },
    },
    defaultVariants: {
      priority: "P2",
      size: "default",
    },
  }
);

const priorityDotVariants = cva(
  "rounded-full transition-colors duration-150",
  {
    variants: {
      priority: {
        P0: "bg-red-500",
        P1: "bg-orange-500",
        P2: "bg-blue-500",
        P3: "bg-slate-300 dark:bg-slate-600",
      },
      size: {
        sm: "h-1.5 w-1.5",
        default: "h-2 w-2",
        lg: "h-2.5 w-2.5",
      },
    },
    defaultVariants: {
      priority: "P2",
      size: "default",
    },
  }
);

/**
 * Linear/Todoist-style priority tag variants
 * Small, minimal tags that only show for important priorities
 */
const priorityTagVariants = cva(
  "inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide transition-colors duration-150",
  {
    variants: {
      priority: {
        P0: "bg-red-500 text-white",
        P1: "bg-orange-500 text-white",
        P2: "bg-blue-500/15 text-blue-600 dark:text-blue-400",
        P3: "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500",
      },
    },
    defaultVariants: {
      priority: "P2",
    },
  }
);

export interface PriorityBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof priorityBadgeVariants> {
  priority: TaskPriority;
  showLabel?: boolean;
  showDot?: boolean;
}

/**
 * Priorities keep their P0–P3 codes, each with a short description. P2 is
 * the default, "Normal", and cards don't mark it. `key` picks it in the
 * priority menus.
 */
export const PRIORITY_META: Record<
  TaskPriority,
  { description: string; key: string; flagClass: string; filled: boolean }
> = {
  P0: { description: "Urgent", key: "0", flagClass: "text-red-500", filled: true },
  P1: { description: "High", key: "1", flagClass: "text-orange-500", filled: true },
  P2: { description: "Normal", key: "2", flagClass: "text-muted-foreground", filled: false },
  P3: { description: "Low", key: "3", flagClass: "text-muted-foreground/60", filled: true },
};

/** "P1 · High" */
const PRIORITY_LABELS: Record<TaskPriority, string> = {
  P0: `P0 · ${PRIORITY_META.P0.description}`,
  P1: `P1 · ${PRIORITY_META.P1.description}`,
  P2: `P2 · ${PRIORITY_META.P2.description}`,
  P3: `P3 · ${PRIORITY_META.P3.description}`,
};

const PRIORITY_SHORT_LABELS: Record<TaskPriority, string> = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
  P3: "P3",
};

const PRIORITY_TAG_LABELS: Record<TaskPriority, string> = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
  P3: "P3",
};

export function PriorityBadge({
  className,
  priority,
  size,
  showLabel = false,
  showDot = true,
  ...props
}: PriorityBadgeProps) {
  return (
    <div
      className={cn(priorityBadgeVariants({ priority, size }), className)}
      title={PRIORITY_LABELS[priority]}
      {...props}
    >
      {showDot && (
        <span className={cn(priorityDotVariants({ priority, size }))} />
      )}
      {showLabel && (
        <span className={cn(showDot && "ml-1")}>
          {PRIORITY_SHORT_LABELS[priority]}
        </span>
      )}
    </div>
  );
}

/**
 * Simple priority dot indicator for minimal displays
 */
export function PriorityDot({
  priority,
  size = "default",
  className,
}: {
  priority: TaskPriority;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  return (
    <span
      className={cn(priorityDotVariants({ priority, size }), className)}
      title={PRIORITY_LABELS[priority]}
    />
  );
}

/**
 * Priority icon for use in menus and selectors
 */
export function PriorityIcon({
  priority,
  size = "default",
  className,
}: {
  priority: TaskPriority;
  size?: "sm" | "default" | "lg";
  className?: string;
}) {
  const sizeClasses = { sm: "h-3 w-3", default: "h-3.5 w-3.5", lg: "h-4 w-4" };
  const meta = PRIORITY_META[priority];
  return (
    <Flag
      className={cn(sizeClasses[size], meta.flagClass, className)}
      fill={meta.filled ? "currentColor" : "none"}
      strokeWidth={meta.filled ? 0 : 2}
      aria-label={PRIORITY_LABELS[priority]}
    />
  );
}

/**
 * Linear/Todoist-style priority tag for task cards
 * Only renders for P0 and P1 (keeps UI clean for default/low priority)
 */
export interface PriorityTagProps {
  priority: TaskPriority;
  showIcon?: boolean;
  className?: string;
}

export function PriorityTag({
  priority,
  showIcon = true,
  className,
}: PriorityTagProps) {
  // Only show tag for urgent (P0) and high (P1) priorities
  // P2 and P3 are hidden to keep the UI clean
  if (priority === "P2" || priority === "P3") {
    return null;
  }

  return (
    <span
      className={cn(priorityTagVariants({ priority }), className)}
      title={PRIORITY_LABELS[priority]}
    >
      {showIcon && priority === "P0" && (
        <AlertTriangle className="h-2.5 w-2.5" />
      )}
      {PRIORITY_TAG_LABELS[priority]}
    </span>
  );
}

/**
 * Linear-style priority label (P0, P1, P2, P3) for task cards
 * Clean pill tags with background and text color
 * Shows for all priority levels
 */
export function PriorityLabel({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  const styleClasses: Record<TaskPriority, string> = {
    P0: "bg-red-500/15 text-red-600 dark:text-red-400",
    P1: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    P2: "bg-blue-500/10 text-blue-500 dark:text-blue-400",
    P3: "bg-slate-400/10 text-slate-400 dark:text-slate-500",
  };

  return (
    <span
      className={cn(
        "shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium",
        styleClasses[priority],
        className
      )}
      title={PRIORITY_LABELS[priority]}
    >
      {priority}
    </span>
  );
}

export { PRIORITY_LABELS, PRIORITY_SHORT_LABELS, priorityBadgeVariants, priorityTagVariants };
