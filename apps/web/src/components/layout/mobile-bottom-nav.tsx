import * as React from "react";
import { ListTodo, Calendar, Lightbulb, MoreHorizontal } from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

interface NavItem {
  href: "/app" | "/app/calendar" | "/app/ideas" | "/app/more";
  icon: React.ReactNode;
  label: string;
  matchExact?: boolean;
}

const navItems: NavItem[] = [
  {
    href: "/app",
    icon: <ListTodo className="h-[21px] w-[21px]" strokeWidth={1.65} />,
    label: "Tasks",
    matchExact: true,
  },
  {
    href: "/app/calendar",
    icon: <Calendar className="h-[21px] w-[21px]" strokeWidth={1.65} />,
    label: "Calendar",
  },
  {
    href: "/app/ideas",
    icon: <Lightbulb className="h-[21px] w-[21px]" strokeWidth={1.65} />,
    label: "Ideas",
  },
  {
    href: "/app/more",
    icon: <MoreHorizontal className="h-[21px] w-[21px]" strokeWidth={1.65} />,
    label: "More",
  },
];

/**
 * Mobile-only bottom navigation bar
 * Shows on screens < lg breakpoint (1024px)
 * Keeps 56px touch targets with compact, light-stroke icons
 */
export function MobileBottomNav() {
  const routerState = useRouterState();
  const currentPath = routerState.location.pathname;

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "bg-canvas/95 backdrop-blur-xl",
        "lg:hidden" // Hide on desktop
      )}
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-center justify-around px-2">
        {navItems.map((item) => {
          const isActive = item.matchExact
            ? ["/app", "/app/tasks", "/app/board"].includes(currentPath)
            : currentPath.startsWith(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 py-1.5 px-3",
                "h-14 min-w-[64px]", // Touch-friendly size (> 44px)
                "transition-colors",
                "active:opacity-70", // Touch feedback
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {item.icon}
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
