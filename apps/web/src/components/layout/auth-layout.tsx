import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Layout wrapper for authentication pages (login/register)
 * Clean, minimal Linear-style aesthetic
 */
export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4">
      {/* Logo */}
      <div className="mb-8 flex items-center gap-2">
        <Calendar className="h-6 w-6" />
        <span className="text-xl font-semibold">Open Sunsama</span>
      </div>

      {/* Card */}
      <div
        className={cn(
          "w-full max-w-sm rounded-lg border bg-card p-6",
          className
        )}
      >
        {children}
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-muted-foreground">
        Free and open source
      </p>
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
    <div className="flex flex-col space-y-1.5 text-center mb-6">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
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
    <p className="mt-6 text-center text-sm text-muted-foreground">{children}</p>
  );
}
