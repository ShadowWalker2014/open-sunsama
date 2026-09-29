import * as React from "react";
import {
  Calendar,
  LayoutGrid,
  List,
  Lightbulb,
  Search,
  Settings,
  LogOut,
  Monitor,
  Moon,
  Sun,
  User,
  Download,
  BookOpen,
  Check,
  Keyboard,
} from "lucide-react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/hooks/useAuth";
import { useSearch } from "@/hooks/useSearch";
import { useTheme } from "@/hooks/useTheme";
import { useShortcutsModal } from "@/hooks/useKeyboardShortcuts";
import { prefetchCommandPalette } from "@/components/command-palette/command-palette.lazy";
import { DesktopUpdateMenuItem } from "@/components/desktop-update-menu-item";
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
  const { setShowShortcutsModal } = useShortcutsModal();
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
        "hidden lg:block sticky top-0 z-50 w-full bg-chrome",
        className
      )}
    >
      <div className="flex h-11 w-full items-center px-3 sm:px-4">
        {/* Logo */}
        <div className="mr-3 flex">
          <Link to="/app" className="mr-4 flex items-center space-x-2">
            <img
              src="/open-sunsama-logo.png"
              alt="Open Sunsama"
              className="h-6 w-6 rounded-lg object-cover"
            />
            <span className="hidden text-[13px] font-semibold sm:inline-block">
              Open Sunsama
            </span>
          </Link>
        </div>

        {/* Navigation - Hidden on mobile (using bottom nav instead) */}
        <nav className="hidden lg:flex items-center gap-0.5">
          <NavLink href="/app/board" icon={<LayoutGrid className="h-3.5 w-3.5" />}>
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
          <NavLink href="/app/ideas" icon={<Lightbulb className="h-3.5 w-3.5" />}>
            Ideas
          </NavLink>
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Search Button */}
        <button
          onClick={() => {
            void prefetchCommandPalette();
            openSearch();
          }}
          onMouseEnter={() => {
            void prefetchCommandPalette();
          }}
          onFocus={() => {
            void prefetchCommandPalette();
          }}
          className="mr-1 hidden lg:flex h-7 items-center gap-1.5 rounded-md px-2 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Search className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Search</span>
          <ShortcutHint shortcutKey="search" />
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* Keeps shortcuts discoverable without a text hint */}
          <button
            type="button"
            onClick={() => setShowShortcutsModal(true)}
            title="Keyboard shortcuts · ?"
            aria-label="Keyboard shortcuts"
            className="mr-1 hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Keyboard className="h-3.5 w-3.5" />
          </button>
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
                <Link to="/app/settings" className="w-full cursor-pointer">
                  <User className="mr-2 h-3.5 w-3.5" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="text-[13px] py-1.5">
                <Link to="/app/settings" className="w-full cursor-pointer">
                  <Settings className="mr-2 h-3.5 w-3.5" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-[13px] py-1.5 cursor-pointer"
                onClick={() => setShowShortcutsModal(true)}
              >
                <Keyboard className="mr-2 h-3.5 w-3.5" />
                Keyboard shortcuts
                <span className="ml-auto text-[11px] text-muted-foreground">?</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="py-1 text-[11px] font-normal text-muted-foreground">
                Theme
              </DropdownMenuLabel>
              {(
                [
                  ["system", "System", Monitor],
                  ["light", "Light", Sun],
                  ["dark", "Dark", Moon],
                ] as const
              ).map(([mode, label, Icon]) => (
                <DropdownMenuItem
                  key={mode}
                  className="text-[13px] py-1.5 cursor-pointer"
                  onSelect={(e) => {
                    e.preventDefault();
                    setThemeMode(mode);
                  }}
                >
                  <Icon className="mr-2 h-3.5 w-3.5" />
                  {label}
                  {themeMode === mode && <Check className="ml-auto h-3.5 w-3.5" />}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild className="text-[13px] py-1.5">
                <a
                  href="/docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full cursor-pointer"
                >
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
              <DesktopUpdateMenuItem />
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
  href: "/app/board" | "/app/tasks" | "/app/calendar" | "/app/ideas";
  icon?: React.ReactNode;
  children: React.ReactNode;
}

function NavLink({ href, icon, children }: NavLinkProps) {
  // Reactive active state via the router — a plain <a> would hard-reload the
  // whole SPA on every tab switch (the flicker), so use a client-side <Link>.
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isActive =
    href === "/app/board"
      ? pathname === "/app/board" || pathname === "/app"
      : pathname.startsWith(href);

  return (
    <Link
      to={href}
      className={cn(
        "inline-flex items-center gap-1.5 rounded px-2 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground",
        isActive && "bg-accent text-accent-foreground"
      )}
    >
      {icon}
      <span className="hidden sm:inline">{children}</span>
    </Link>
  );
}
