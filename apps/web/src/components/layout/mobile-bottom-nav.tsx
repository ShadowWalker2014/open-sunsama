import * as React from "react";
import { LayoutGrid, List, Calendar, Settings } from "lucide-react";
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
    icon: <LayoutGrid className="h-5 w-5" />,
    label: "Board",
    matchExact: true,
  },
  {
    href: "/app/tasks",
    icon: <List className="h-5 w-5" />,
    label: "Tasks",
  },
  {
    href: "/app/calendar",
    icon: <Calendar className="h-5 w-5" />,
    label: "Calendar",
  },
  {
    href: "/app/settings",
    icon: <Settings className="h-5 w-5" />,
    label: "Settings",
  },
];

/**
 * Mobile-only bottom navigation bar
 * Shows on screens < lg breakpoint (1024px)
 * Touch-friendly with 44px minimum touch targets
 */
export function MobileBottomNav() {
  const [currentPath, setCurrentPath] = React.useState(() => {
    if (typeof window === "undefined") return "/app";
    return window.location.pathname;
  });

  // Listen for navigation changes
  React.useEffect(() => {
    const handleNavigation = () => {
      setCurrentPath(window.location.pathname);
    };

    // Listen for popstate (browser back/forward)
    window.addEventListener("popstate", handleNavigation);
    
    // Create a MutationObserver to detect URL changes from client-side routing
    const observer = new MutationObserver(() => {
      if (window.location.pathname !== currentPath) {
        setCurrentPath(window.location.pathname);
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      window.removeEventListener("popstate", handleNavigation);
      observer.disconnect();
    };
  }, [currentPath]);

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50",
        "border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80",
        "lg:hidden", // Hide on desktop
        "safe-area-pb" // iOS safe area
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
                "active:bg-accent/50", // Touch feedback
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full p-1.5 transition-colors",
                  isActive && "bg-primary/10"
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
