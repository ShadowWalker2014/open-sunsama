import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Shared header component for all public pages
 * Compact, consistent style matching the app
 */
export function PublicHeader({ className }: { className?: string }) {
  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}
    >
      <div className="container flex h-12 items-center justify-between px-4 mx-auto max-w-5xl">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/open-sunsama-logo.png"
            alt="Open Sunsama"
            className="h-7 w-7 rounded-lg object-cover"
          />
          <span className="text-[13px] font-semibold">Open Sunsama</span>
        </Link>

        <nav className="hidden md:flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            asChild
          >
            <Link to="/download">Download</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            asChild
          >
            <a
              href="https://github.com/ShadowWalker2014/open-sunsama"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub
            </a>
          </Button>
        </nav>

        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            asChild
          >
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="h-8 px-3 text-xs" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/**
 * Shared footer component for all public pages
 * Minimal, consistent style
 */
export function PublicFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("border-t border-border/40 py-6", className)}>
      <div className="container px-4 mx-auto max-w-5xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/open-sunsama-logo.png"
              alt="Open Sunsama"
              className="h-5 w-5 rounded object-cover"
            />
            <span className="text-[11px] text-muted-foreground">
              © 2026 Open Sunsama
            </span>
          </div>
          <nav className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <Link
              to="/privacy"
              className="hover:text-foreground transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="hover:text-foreground transition-colors"
            >
              Terms
            </Link>
            <a
              href="https://github.com/ShadowWalker2014/open-sunsama"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}

/**
 * Subtle background decoration for public pages
 */
export function PublicBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
    </div>
  );
}

interface PublicLayoutProps {
  children: React.ReactNode;
  /** Hide the default nav links in header */
  hideNav?: boolean;
  /** Custom max-width for content */
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl";
  /** Additional className for main content */
  className?: string;
}

/**
 * Base layout component for all public (non-authenticated) pages
 * Provides consistent header, footer, and background styling
 *
 * Usage:
 * ```tsx
 * <PublicLayout maxWidth="3xl">
 *   <YourContent />
 * </PublicLayout>
 * ```
 */
export function PublicLayout({
  children,
  maxWidth = "5xl",
  className,
}: PublicLayoutProps) {
  const maxWidthClasses = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      <PublicBackground />
      <PublicHeader />
      <main className={cn("relative", className)}>
        <div
          className={cn("container px-4 mx-auto", maxWidthClasses[maxWidth])}
        >
          {children}
        </div>
      </main>
      <PublicFooter />
    </div>
  );
}

/**
 * Design tokens and style constants for public pages
 * Use these for consistency across all layouts
 */
export const publicLayoutTokens = {
  // Header
  headerHeight: "h-12",

  // Spacing
  sectionPaddingY: "py-12 md:py-16",
  sectionPaddingYLarge: "py-16 md:py-24",

  // Typography
  headingLarge: "text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight",
  headingMedium: "text-lg md:text-xl font-semibold tracking-tight",
  headingSmall: "text-[15px] font-semibold",
  bodyText: "text-sm text-muted-foreground",
  smallText: "text-xs text-muted-foreground",
  tinyText: "text-[11px] text-muted-foreground",

  // Buttons
  buttonHeight: "h-8 h-9",
  buttonPadding: "px-3 px-4",
  buttonText: "text-xs text-[13px]",

  // Cards/Containers
  cardBorder: "border border-border/40",
  cardBackground: "bg-card/50",
  cardRadius: "rounded-xl",
  cardPadding: "p-4 p-6",

  // Transitions
  transition: "transition-all duration-200",

  // Hover states
  hoverBorder: "hover:border-border/60",
  hoverBackground: "hover:bg-card/80",
} as const;
