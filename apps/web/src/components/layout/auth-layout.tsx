import * as React from "react";

import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Layout wrapper for authentication pages (login/register)
 * Compact, minimal style matching the app
 */
export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 relative">
      {/* Subtle background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        {/* Logo */}
        <Link to="/" className="mb-8 flex items-center gap-2">
          <img
            src="/open-sunsama-logo.png"
            alt="Open Sunsama"
            className="h-8 w-8 rounded-xl object-cover"
          />
          <span className="text-[15px] font-semibold">Open Sunsama</span>
        </Link>

        {/* Card */}
        <div
          className={cn(
            "w-full rounded-xl border border-border/40 bg-card/50 p-6 shadow-sm",
            className
          )}
        >
          {children}
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center gap-4 text-[11px] text-muted-foreground">
          <Link
            to="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <span className="text-border">•</span>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
        </div>
      </div>
    </div>
  );
}

interface AuthHeaderProps {
  title: string;
  description?: string;
}

/**
 * Header for auth pages
 */
export function AuthHeader({ title, description }: AuthHeaderProps) {
  return (
    <div className="flex flex-col space-y-1 text-center mb-6">
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

interface AuthFooterProps {
  children: React.ReactNode;
}

/**
 * Footer for auth pages
 */
export function AuthFooter({ children }: AuthFooterProps) {
  return (
    <p className="mt-6 text-center text-xs text-muted-foreground">{children}</p>
  );
}
