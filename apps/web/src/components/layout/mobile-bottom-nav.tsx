import * as React from "react";
import { ListTodo, Calendar, MoreHorizontal } from "lucide-react";
import { useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
  matchExact?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/app",
    icon: <ListTodo className="h-6 w-6" />,
    label: "Tasks",
    matchExact: true,
  },
  {
    href: "/app/calendar",
    icon: <Calendar className="h-6 w-6" />,
    label: "Calendar",
  },
  {
    href: "/app/more",
    icon: <MoreHorizontal className="h-6 w-6" />,
    label: "More",
  },
];

/**
 * Mobile-only bottom navigation bar
 * Shows on screens < lg breakpoint (1024px)
 * Touch-friendly with 64px minimum touch targets
 */
export function MobileBottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "lg:hidden" // Hide on desktop
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = item.matchExact
            ? currentPath === item.href
            : currentPath.startsWith(item.href);

          return (
            <a
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-2 px-3",
                "min-h-[56px] min-w-[64px]", // Touch-friendly size (> 44px)
                "transition-colors",
                "active:opacity-70", // Touch feedback
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full px-4 py-1.5 transition-colors",
                  isActive && "bg-muted"
                )}
              >
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
