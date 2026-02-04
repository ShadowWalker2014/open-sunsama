import * as React from "react";
import {
  User,
  Lock,
  Palette,
  Bell,
  Key,
  ListTodo,
  Terminal,
  ChevronRight,
  CalendarDays,
  Monitor,
  Repeat,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useSearch, useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/useIsMobile";
import { calendarKeys } from "@/hooks/useCalendars";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ApiKeysSettings,
  PasswordSettings,
  ProfileSettings,
  AppearanceSettings,
  NotificationSettings,
  TaskSettings,
  McpSettings,
  CalendarSettings,
  DesktopSettings,
  RoutinesSettings,
} from "@/components/settings";

type SettingsTab =
  | "profile"
  | "security"
  | "appearance"
  | "tasks"
  | "routines"
  | "calendars"
  | "notifications"
  | "desktop"
  | "api"
  | "mcp";

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "profile", label: "Profile", icon: User },
  { id: "security", label: "Security", icon: Lock },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "tasks", label: "Tasks", icon: ListTodo },
  { id: "routines", label: "Routines", icon: Repeat },
  { id: "calendars", label: "Calendars", icon: CalendarDays },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "desktop", label: "Desktop App", icon: Monitor },
  { id: "api", label: "API Keys", icon: Key },
  { id: "mcp", label: "MCP", icon: Terminal },
];

function SettingsContent({ tab }: { tab: SettingsTab }) {
  switch (tab) {
    case "profile":
      return <ProfileSettings />;
    case "security":
      return <PasswordSettings />;
    case "appearance":
      return <AppearanceSettings />;
    case "tasks":
      return <TaskSettings />;
    case "routines":
      return <RoutinesSettings />;
    case "calendars":
      return <CalendarSettings />;
    case "notifications":
      return <NotificationSettings />;
    case "desktop":
      return <DesktopSettings />;
    case "api":
      return <ApiKeysSettings />;
    case "mcp":
      return <McpSettings />;
  }
}

export default function SettingsPage() {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Use TanStack Router's useSearch for proper search param handling
  const searchParams = useSearch({ from: "/app/settings" }) as {
    tab?: string;
    calendar?: string;
    provider?: string;
  };

  // Determine initial tab and if this is a calendar redirect
  const isCalendarRedirect = searchParams.calendar === "connected";
  const initialTab = React.useMemo(() => {
    const tabParam = searchParams.tab as SettingsTab | undefined;
    const validTab =
      tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : null;
    return validTab || (isCalendarRedirect ? "calendars" : "profile");
  }, [searchParams.tab, isCalendarRedirect]);

  const [activeTab, setActiveTab] = React.useState<SettingsTab>(initialTab);
  const [openSheet, setOpenSheet] = React.useState<SettingsTab | null>(
    isMobile ? (initialTab !== "profile" ? initialTab : null) : null
  );

  // Track if we've already handled the calendar redirect to avoid double-refetching
  const hasHandledRedirect = React.useRef(false);

  // Handle OAuth redirect - refetch calendar data, set tab, and clean up URL
  React.useEffect(() => {
    // Only process if there are search params to handle
    const hasParams =
      searchParams.tab || searchParams.calendar || searchParams.provider;
    if (!hasParams) return;

    // Handle OAuth redirect - set tab to calendars and force refetch
    if (isCalendarRedirect && !hasHandledRedirect.current) {
      hasHandledRedirect.current = true;

      // Force set the active tab to calendars
      setActiveTab("calendars");
      if (isMobile) {
        setOpenSheet("calendars");
      }

      // Invalidate and refetch calendar queries immediately
      // Using invalidateQueries ensures fresh data even if queries are already cached
      queryClient.invalidateQueries({ queryKey: calendarKeys.accounts() });
      queryClient.invalidateQueries({ queryKey: calendarKeys.calendars() });
    }

    // Clean up URL params using TanStack Router navigation
    // This is safer than directly manipulating window.history
    navigate({
      to: "/app/settings",
      search: {},
      replace: true,
    });
  }, [searchParams, isCalendarRedirect, isMobile, queryClient, navigate]);

  // Mobile layout: List of sections that open sheets
  if (isMobile) {
    return (
      <div className="h-[calc(100vh-2.75rem)] overflow-y-auto">
        <div className="divide-y divide-border/40">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setOpenSheet(tab.id)}
                className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-accent/50 active:bg-accent"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[15px] font-medium">{tab.label}</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground/60" />
              </button>
            );
          })}
        </div>

        {/* Settings Sheet */}
        <Sheet
          open={openSheet !== null}
          onOpenChange={(open) => !open && setOpenSheet(null)}
        >
          <SheetContent
            side="right"
            className="w-full sm:max-w-md overflow-y-auto"
          >
            <SheetHeader className="mb-4">
              <SheetTitle>
                {TABS.find((t) => t.id === openSheet)?.label}
              </SheetTitle>
            </SheetHeader>
            {openSheet && <SettingsContent tab={openSheet} />}
          </SheetContent>
        </Sheet>
      </div>
    );
  }

  // Desktop layout: Sidebar + content
  return (
    <div className="flex h-[calc(100vh-2.75rem)] overflow-hidden">
      {/* Left Navigation - Linear style */}
      <nav className="w-48 flex-shrink-0 border-r border-border/40 bg-background/50 p-2">
        <div className="space-y-0.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex w-full items-center gap-2 rounded px-2 py-1.5 text-[13px] font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-xl px-6 py-4">
          <SettingsContent tab={activeTab} />
        </div>
      </main>
    </div>
  );
}
