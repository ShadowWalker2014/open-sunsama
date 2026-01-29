import * as React from "react";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Layout wrapper for authentication pages (login/register)
 */
export function AuthLayout({ children, className }: AuthLayoutProps) {
  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      {/* Left side - Branding */}
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div className="absolute inset-0 bg-zinc-900" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
            <Calendar className="h-4 w-4" />
          </div>
          Chronoflow
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              &ldquo;Time blocking has transformed how I work. Chronoflow makes
              it effortless to visualize my day and stay focused on what
              matters.&rdquo;
            </p>
            <footer className="text-sm text-zinc-400">Sofia Davis</footer>
          </blockquote>
        </div>
      </div>

      {/* Right side - Auth form */}
      <div className="lg:p-8">
        <div className={cn("mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]", className)}>
          {children}
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
    <div className="flex flex-col space-y-2 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
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
    <p className="px-8 text-center text-sm text-muted-foreground">{children}</p>
  );
}
