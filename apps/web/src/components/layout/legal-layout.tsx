import * as React from "react";
import { Link } from "@tanstack/react-router";
import { Calendar, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/landing/shimmer-button";

interface LegalLayoutProps {
  children: React.ReactNode;
}

/**
 * Header for legal pages - matches landing page style
 */
function LegalHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-6 mx-auto max-w-7xl">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:rotate-6">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold tracking-tight text-xl font-display">Open Sunsama</span>
        </Link>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild className="font-medium">
            <Link to="/login">Sign in</Link>
          </Button>
          <ShimmerButton 
            className="px-5 py-2 text-sm font-semibold"
            onClick={() => window.location.href = '/register'}
          >
            Get Started
          </ShimmerButton>
        </div>
      </div>
    </header>
  );
}

/**
 * Footer for legal pages - matches landing page style with legal links
 */
function LegalFooter() {
  return (
    <footer className="border-t py-12 bg-card/30 backdrop-blur-sm">
      <div className="container px-6 mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Calendar className="h-5 w-5 text-primary" />
          <span className="font-bold font-display text-foreground">Open Sunsama</span>
          <span className="mx-2 opacity-20">|</span>
          <span className="font-jetbrains text-[10px] uppercase tracking-widest">Free & Open Source</span>
        </div>
        <nav className="flex items-center gap-8 text-sm font-medium text-muted-foreground">
          <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
          <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
          <a
            href="https://github.com/ShadowWalker2014/open-sunsama"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 hover:text-foreground transition-colors"
          >
            <Github className="h-4 w-4" />
            <span>GitHub</span>
          </a>
        </nav>
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
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-secondary/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-grid opacity-[0.02]" />
      </div>

      <LegalHeader />
      
      <main className="flex-1 relative z-10 py-24 md:py-32">
        <div className="container px-6 mx-auto max-w-3xl">
          <article className="prose prose-neutral dark:prose-invert max-w-none 
            prose-headings:font-display prose-headings:font-bold prose-headings:tracking-tight
            prose-h1:text-5xl prose-h1:mb-12 prose-h1:text-balance
            prose-h2:text-2xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:border-b prose-h2:pb-2
            prose-p:text-muted-foreground prose-p:leading-relaxed prose-p:text-lg
            prose-li:text-muted-foreground prose-li:text-lg
            prose-strong:text-foreground prose-strong:font-bold
            prose-a:text-primary prose-a:font-medium prose-a:no-underline hover:prose-a:underline
            prose-code:font-jetbrains prose-code:bg-muted/50 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
            animate-fade-up">
            {children}
          </article>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
