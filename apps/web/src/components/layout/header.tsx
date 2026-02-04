import * as React from "react";
import {
  Calendar,
  LayoutGrid,
  List,
  Search,
  Settings,
  LogOut,
  Monitor,
  Moon,
  Sun,
  User,
  Download,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSearch } from "@/hooks/useSearch";
import { useTheme } from "@/hooks/useTheme";
import { cn, getAvatarUrl } from "@/lib/utils";
import {
  Button,
  Avatar,
  AvatarFallback,
  AvatarImage,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  ShortcutHint,
} from "@/components/ui";

interface HeaderProps {
  className?: string;
}

// Check if running in Tauri desktop app
function isTauriApp(): boolean {
  return typeof window !== "undefined" && "__TAURI__" in window;
}

export function Header({ className }: HeaderProps) {
  const { user, logout } = useAuth();
  const { openSearch } = useSearch();
  const { themeMode, setThemeMode } = useTheme();
  const isDesktopApp = React.useMemo(() => isTauriApp(), []);

  const userInitials = React.useMemo(() => {
    if (!user?.name) return user?.email?.charAt(0).toUpperCase() ?? "U";
    return user.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, [user]);

  return (
    <header
      className={cn(
        "hidden lg:block sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-11 w-full items-center px-3 sm:px-4">
        {/* Logo */}
        <div className="mr-3 flex">
          <a href="/app" className="mr-4 flex items-center space-x-2">
            <img
              src="/open-sunsama-logo.png"
              alt="Open Sunsama"
              className="h-6 w-6 rounded-lg object-cover"
            />
            <span className="hidden text-[13px] font-semibold sm:inline-block">
              Open Sunsama
            </span>
          </a>
        </div>

        {/* Navigation - Hidden on mobile (using bottom nav instead) */}
        <nav className="hidden lg:flex items-center gap-0.5">
          <NavLink href="/app" icon={<LayoutGrid className="h-3.5 w-3.5" />}>
            Board
          </NavLink>
          <NavLink href="/app/tasks" icon={<List className="h-3.5 w-3.5" />}>
            Tasks
          </NavLink>
          <NavLink
            href="/app/calendar"
            icon={<Calendar className="h-3.5 w-3.5" />}
          >
            Calendar
          </NavLink>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search Button */}
        <button
          onClick={openSearch}
          className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded border border-border/40 bg-muted/30 hover:bg-muted transition-colors text-xs text-muted-foreground mr-2"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search...</span>
          <ShortcutHint shortcutKey="search" />
        </button>

        {/* Global Shortcut Hint - Hidden on mobile */}
        <div className="hidden lg:flex items-center mr-3 text-[10px] text-muted-foreground/50">
          Press{" "}
          <kbd className="mx-1 rounded border border-border/40 bg-muted/50 px-1 py-0.5 text-[9px] font-medium">
            ?
          </kbd>{" "}
          for shortcuts
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle - Icon-only segmented control (hidden on mobile) */}
          <div className="hidden lg:inline-flex items-center rounded border border-border/40 bg-muted/30 p-0.5">
            <button
              onClick={() => setThemeMode("system")}
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded transition-all",
                themeMode === "system"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="System theme"
            >
              <Monitor className="h-3 w-3" />
            </button>
            <button
              onClick={() => setThemeMode("light")}
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded transition-all",
                themeMode === "light"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Light theme"
            >
              <Sun className="h-3 w-3" />
            </button>
            <button
              onClick={() => setThemeMode("dark")}
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded transition-all",
                themeMode === "dark"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Dark theme"
            >
              <Moon className="h-3 w-3" />
            </button>
          </div>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-7 w-7 rounded-full p-0"
              >
                <Avatar className="h-6 w-6">
                  <AvatarImage
                    src={getAvatarUrl(user?.avatarUrl)}
                    alt={user?.name ?? "User"}
                  />
                  <AvatarFallback className="text-[10px]">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48" align="end" forceMount>
              <DropdownMenuLabel className="font-normal py-1.5">
                <div className="flex flex-col space-y-0.5">
                  <p className="text-[13px] font-medium leading-none">
                    {user?.name ?? "User"}
                  </p>
                  <p className="text-[11px] leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-[13px] py-1.5">
                <a href="/app/settings" className="w-full cursor-pointer">
                  <User className="mr-2 h-3.5 w-3.5" />
                  Profile
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-[13px] py-1.5">
                <a href="/app/settings" className="w-full cursor-pointer">
                  <Settings className="mr-2 h-3.5 w-3.5" />
                  Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-[13px] py-1.5">
                <a href="/docs" className="w-full cursor-pointer">
                  <BookOpen className="mr-2 h-3.5 w-3.5" />
                  Documentation
                </a>
              </DropdownMenuItem>
              {!isDesktopApp && (
                <DropdownMenuItem asChild className="text-[13px] py-1.5">
                  <a href="/download" className="w-full cursor-pointer">
                    <Download className="mr-2 h-3.5 w-3.5" />
                    Get Desktop App
                  </a>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive text-[13px] py-1.5"
                onClick={logout}
              >
                <LogOut className="mr-2 h-3.5 w-3.5" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  href: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function NavLink({ href, icon, children }: NavLinkProps) {
  // Check if current path matches for active state
  const isActive =
    typeof window !== "undefined" &&
    ((href === "/app" && window.location.pathname === "/app") ||
      (href !== "/app" && window.location.pathname.startsWith(href)));

  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </a>
  );
}
