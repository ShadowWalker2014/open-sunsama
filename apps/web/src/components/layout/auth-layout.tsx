import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@tanstack/react-router";

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Layout wrapper for authentication pages (login/register)
 * Clean, minimal Linear-style aesthetic with mesh background
 */
export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 blur-[120px] rounded-full animate-pulse-subtle" />
        <div className="absolute inset-0 bg-grid opacity-[0.03] dark:opacity-[0.05]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Logo */}
        <Link to="/" className="mb-10 flex items-center gap-3 group">
          <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:rotate-6">
            <Calendar className="h-6 w-6 text-primary" />
          </div>
          <span className="text-2xl font-bold font-display tracking-tight">Open Sunsama</span>
        </Link>

        {/* Card */}
        <div
          className={cn(
            "w-full glass p-8 rounded-[32px] shadow-2xl animate-fade-up",
            className
          )}
        >
          {children}
        </div>

        {/* Footer */}
        <div className="mt-10 flex flex-col items-center gap-4 animate-fade-up animate-delay-300">
           <p className="text-sm font-jetbrains text-muted-foreground uppercase tracking-widest">
            Free and open source
          </p>
          <div className="flex items-center gap-6 text-muted-foreground/50">
            <Link to="/privacy" className="text-xs hover:text-foreground transition-colors">Privacy</Link>
            <Link to="/terms" className="text-xs hover:text-foreground transition-colors">Terms</Link>
          </div>
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
    <div className="flex flex-col space-y-2 text-center mb-8">
      <h1 className="text-3xl font-bold font-display tracking-tight">{title}</h1>
      {description && (
        <p className="text-muted-foreground">{description}</p>
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
    <p className="mt-8 text-center text-sm text-muted-foreground">{children}</p>
  );
}
