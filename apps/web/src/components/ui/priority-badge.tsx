import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskPriority } from "@open-sunsama/types";

/**
 * Linear-style priority indicators
 * P0 (Urgent): Red background, white text - always visible
 * P1 (High): Orange/amber background - always visible  
 * P2 (Medium): Hidden by default (default priority, keep it clean)
 * P3 (Low): Hidden by default (very subtle)
 */

const priorityBadgeVariants = cva(
  "inline-flex items-center justify-center rounded text-xs font-medium transition-colors duration-150",
  {
    variants: {
      priority: {
        P0: "bg-red-500/15 text-red-600 dark:text-red-400",
        P1: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
        P2: "bg-slate-500/10 text-slate-500 dark:text-slate-400",
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
        P2: "bg-slate-400",
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
        P1: "bg-amber-500/90 text-white",
        P2: "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
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

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  P0: "Urgent",
  P1: "High",
  P2: "Medium",
  P3: "Low",
};

const PRIORITY_SHORT_LABELS: Record<TaskPriority, string> = {
  P0: "P0",
  P1: "P1",
  P2: "P2",
  P3: "P3",
};

const PRIORITY_TAG_LABELS: Record<TaskPriority, string> = {
  P0: "Urgent",
  P1: "High",
  P2: "Med",
  P3: "Low",
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
  const sizeClasses = {
    sm: "h-3 w-3",
    default: "h-4 w-4",
    lg: "h-5 w-5",
  };

  const barHeights: Record<TaskPriority, string[]> = {
    P0: ["h-full", "h-full", "h-full", "h-full"],
    P1: ["h-1/4", "h-1/2", "h-3/4", "h-full"],
    P2: ["h-1/4", "h-1/2", "h-3/4", "h-0"],
    P3: ["h-1/4", "h-1/2", "h-0", "h-0"],
  };

  const colorClasses: Record<TaskPriority, string> = {
    P0: "bg-red-500",
    P1: "bg-orange-500",
    P2: "bg-slate-400",
    P3: "bg-slate-300 dark:bg-slate-500",
  };

  return (
    <div
      className={cn(
        "flex items-end gap-0.5",
        sizeClasses[size],
        className
      )}
      title={PRIORITY_LABELS[priority]}
    >
      {barHeights[priority].map((height, i) => (
        <div
          key={i}
          className={cn(
            "w-0.5 rounded-sm transition-all duration-150",
            height === "h-0" ? "bg-transparent" : colorClasses[priority],
            height
          )}
        />
      ))}
    </div>
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
 * Compact priority label (P0, P1, P2, P3) for task cards
 * Shows for all priority levels, uses minimal space
 */
export function PriorityLabel({
  priority,
  className,
}: {
  priority: TaskPriority;
  className?: string;
}) {
  const colorClasses: Record<TaskPriority, string> = {
    P0: "text-red-500",
    P1: "text-amber-500",
    P2: "text-slate-400",
    P3: "text-slate-300 dark:text-slate-500",
  };

  return (
    <span
      className={cn(
        "shrink-0 text-[11px] font-medium tabular-nums",
        colorClasses[priority],
        className
      )}
      title={PRIORITY_LABELS[priority]}
    >
      {priority}
    </span>
  );
}

export { PRIORITY_LABELS, PRIORITY_SHORT_LABELS, priorityBadgeVariants, priorityTagVariants };
