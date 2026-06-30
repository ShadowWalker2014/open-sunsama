import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  Inbox,
  User,
  Lock,
  Palette,
  ListTodo,
  Repeat,
  CalendarDays,
  Bell,
  Key,
  Terminal,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  id: string;
  icon: React.ElementType;
  label: string;
  href?: string;
  onClick?: () => void;
  destructive?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

interface MobileMoreMenuProps {
  onLogout?: () => void;
}

interface MenuItemComponentProps {
  item: MenuItem;
}

function MenuItemComponent({ item }: MenuItemComponentProps) {
  const Icon = item.icon;

  const content = (
    <>
      <div className="flex items-center gap-3">
        <Icon className={cn(
          "h-5 w-5",
          item.destructive ? "text-destructive" : "text-muted-foreground"
        )} />
        <span className={cn(
          "text-[15px]",
          item.destructive && "text-destructive"
        )}>{item.label}</span>
      </div>
      {!item.destructive && (
        <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
      )}
    </>
  );

  const className = cn(
    "flex w-full items-center justify-between px-4 py-3",
    "min-h-[48px]", // Touch-friendly minimum height
    "transition-colors",
    "active:bg-accent/50", // Touch feedback
    "hover:bg-accent/30"
  );

  if (item.href) {
    return (
      <Link to={item.href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={item.onClick} className={className}>
      {content}
    </button>
  );
}

interface MenuSectionComponentProps {
  section: MenuSection;
  isLast?: boolean;
}

function MenuSectionComponent({ section, isLast }: MenuSectionComponentProps) {
  return (
    <div className="mb-2">
      {/* Section header (omitted for untitled groups) */}
      {section.title && (
        <div className="px-4 py-2">
          <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {section.title}
          </h3>
        </div>
      )}

      {/* Section items */}
      <div className="bg-card rounded-lg mx-2 overflow-hidden">
        {section.items.map((item, index) => (
          <React.Fragment key={item.id}>
            <MenuItemComponent item={item} />
            {index < section.items.length - 1 && (
              <div className="mx-4 border-b border-border/50" />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Dashed separator between sections */}
      {!isLast && (
        <div className="mx-4 mt-4 border-t border-dashed border-border/40" />
      )}
    </div>
  );
}

/**
 * Mobile More menu component
 * Displays grouped navigation items with section headers
 * Only includes features that actually exist in the app
 */
export function MobileMoreMenu({ onLogout }: MobileMoreMenuProps) {
  const { logout } = useAuth();

  const handleLogout = React.useCallback(() => {
    logout();
    onLogout?.();
  }, [logout, onLogout]);

  // Each entry deep-links straight to its content (the settings page opens the
  // matching sheet directly on mobile — no intermediate settings list).
  const menuSections: MenuSection[] = React.useMemo(() => [
    {
      title: "Work",
      items: [
        {
          id: "backlog",
          icon: Inbox,
          label: "Backlog",
          href: "/app/tasks?backlog=1",
        },
      ],
    },
    {
      title: "Settings",
      items: [
        {
          id: "profile",
          icon: User,
          label: "Profile",
          href: "/app/settings?tab=profile",
        },
        {
          id: "security",
          icon: Lock,
          label: "Security",
          href: "/app/settings?tab=security",
        },
        {
          id: "appearance",
          icon: Palette,
          label: "Appearance",
          href: "/app/settings?tab=appearance",
        },
        {
          id: "tasks",
          icon: ListTodo,
          label: "Task defaults",
          href: "/app/settings?tab=tasks",
        },
        {
          id: "routines",
          icon: Repeat,
          label: "Routines",
          href: "/app/settings?tab=routines",
        },
        {
          id: "calendars",
          icon: CalendarDays,
          label: "Calendars",
          href: "/app/settings?tab=calendars",
        },
        {
          id: "notifications",
          icon: Bell,
          label: "Notifications",
          href: "/app/settings?tab=notifications",
        },
        {
          // Settings tab id is "api" (not "api-keys") — an invalid tab silently
          // falls back to the Profile tab.
          id: "api",
          icon: Key,
          label: "API Keys",
          href: "/app/settings?tab=api",
        },
        {
          id: "mcp",
          icon: Terminal,
          label: "MCP",
          href: "/app/settings?tab=mcp",
        },
      ],
    },
    {
      title: "Account",
      items: [
        {
          id: "logout",
          icon: LogOut,
          label: "Log out",
          onClick: handleLogout,
          destructive: true,
        },
      ],
    },
  ], [handleLogout]);

  return (
    // Definite height so the list scrolls internally and the "More" header
    // stays fixed (the app shell is `min-h-screen`, so a percentage height
    // can't resolve — see mobile-calendar-view for the same fix).
    <div className="flex h-[calc(100dvh-4rem)] flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-4 border-b border-border/40">
        <h1 className="text-xl font-semibold">More</h1>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto py-4"
        style={{ paddingBottom: "calc(80px + env(safe-area-inset-bottom, 0px))" }}
      >
        {menuSections.map((section, index) => (
          <MenuSectionComponent
            key={section.title}
            section={section}
            isLast={index === menuSections.length - 1}
          />
        ))}
      </div>
    </div>
  );
}
