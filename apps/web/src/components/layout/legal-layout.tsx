import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LegalLayoutProps {
  children: React.ReactNode;
}

/**
 * Header for legal pages - matches app style
 */
function LegalHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between px-4 mx-auto max-w-5xl">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/open-sunsama-logo.png"
            alt="Open Sunsama"
            className="h-7 w-7 rounded-lg object-cover"
          />
          <span className="text-[13px] font-semibold">Open Sunsama</span>
        </Link>
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
 * Footer for legal pages - matches app style
 */
function LegalFooter() {
  return (
    <footer className="border-t border-border/40 py-6">
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
 * Layout component for legal pages (Privacy Policy, Terms of Service)
 * Provides consistent header/footer and prose styling for MDX content
 */
export function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans antialiased">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[400px] h-[300px] bg-primary/[0.03] blur-[100px] rounded-full" />
      </div>

      <LegalHeader />

      <main className="flex-1 relative z-10 py-12 md:py-16">
        <div className="container px-4 mx-auto max-w-2xl">
          <article
            className="prose prose-neutral dark:prose-invert max-w-none 
            prose-headings:font-semibold prose-headings:tracking-tight
            prose-h1:text-2xl prose-h1:mb-6
            prose-h2:text-lg prose-h2:mt-8 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border/40 prose-h2:pb-2
            prose-h3:text-[15px] prose-h3:mt-6 prose-h3:mb-3
            prose-p:text-sm prose-p:text-muted-foreground prose-p:leading-relaxed
            prose-li:text-sm prose-li:text-muted-foreground
            prose-strong:text-foreground prose-strong:font-medium
            prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
            prose-code:text-xs prose-code:font-mono prose-code:bg-muted/50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            prose-ul:my-4 prose-ol:my-4
            prose-li:my-1"
          >
            {children}
          </article>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
