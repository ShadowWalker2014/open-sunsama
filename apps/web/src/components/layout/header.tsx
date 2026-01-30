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

export function Header({ className }: HeaderProps) {
  const { user, logout } = useAuth();
  const { openSearch } = useSearch();
  const { themeMode, setThemeMode } = useTheme();

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
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="flex h-14 w-full items-center px-4 sm:px-6">
        {/* Logo */}
        <div className="mr-4 flex">
          <a href="/app" className="mr-6 flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Calendar className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="hidden font-bold sm:inline-block">Open Sunsama</span>
          </a>
        </div>

        {/* Navigation - Hidden on mobile (using bottom nav instead) */}
        <nav className="hidden lg:flex items-center gap-1">
          <NavLink href="/app" icon={<LayoutGrid className="h-4 w-4" />}>
            Board
          </NavLink>
          <NavLink href="/app/tasks" icon={<List className="h-4 w-4" />}>
            Tasks
          </NavLink>
          <NavLink href="/app/calendar" icon={<Calendar className="h-4 w-4" />}>
            Calendar
          </NavLink>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search Button */}
        <button
          onClick={openSearch}
          className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-md border border-border/50 bg-muted/30 hover:bg-muted transition-colors text-sm text-muted-foreground mr-2"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search...</span>
          <ShortcutHint shortcutKey="search" />
        </button>

        {/* Global Shortcut Hint - Hidden on mobile */}
        <div className="hidden lg:flex items-center mr-4 text-xs text-muted-foreground/50">
          Press <kbd className="mx-1 rounded border border-border/50 bg-muted/50 px-1.5 py-0.5 text-[10px] font-medium">?</kbd> for shortcuts
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Theme Toggle - Icon-only segmented control */}
          <div className="inline-flex items-center rounded-lg border border-border/50 bg-muted/30 p-0.5">
            <button
              onClick={() => setThemeMode("system")}
              className={cn(
                "inline-flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-md transition-all",
                themeMode === "system"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="System theme"
            >
              <Monitor className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
            <button
              onClick={() => setThemeMode("light")}
              className={cn(
                "inline-flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-md transition-all",
                themeMode === "light"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Light theme"
            >
              <Sun className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
            <button
              onClick={() => setThemeMode("dark")}
              className={cn(
                "inline-flex h-8 w-8 sm:h-7 sm:w-7 items-center justify-center rounded-md transition-all",
                themeMode === "dark"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="Dark theme"
            >
              <Moon className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
            </button>
          </div>

          {/* User Menu - Touch-friendly */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-10 w-10 sm:h-9 sm:w-9 rounded-full"
              >
                <Avatar className="h-9 w-9 sm:h-8 sm:w-8">
                  <AvatarImage src={getAvatarUrl(user?.avatarUrl)} alt={user?.name ?? "User"} />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.name ?? "User"}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <a href="/app/settings" className="w-full cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="/app/settings" className="w-full cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </a>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-destructive focus:text-destructive"
                onClick={logout}
              >
                <LogOut className="mr-2 h-4 w-4" />
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
  const isActive = typeof window !== "undefined" && (
    (href === "/app" && window.location.pathname === "/app") ||
    (href !== "/app" && window.location.pathname.startsWith(href))
  );
  
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </a>
  );
}
