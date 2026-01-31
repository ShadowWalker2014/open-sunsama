import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Calendar, ArrowRight, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Layout wrapper for feature-specific landing pages
 * Compact style matching the app
 */
export function FeatureLayout({ 
  children, 
  title, 
  subtitle,
  badge 
}: { 
  children: ReactNode; 
  title: string; 
  subtitle: string;
  badge?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-12 items-center justify-between px-4 mx-auto max-w-5xl">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <span className="text-[13px] font-semibold">Open Sunsama</span>
          </Link>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Feature Hero */}
        <section className="pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="container px-4 mx-auto max-w-3xl text-center">
            {badge && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-6 rounded-md border border-border/40 bg-card/50 text-[11px] font-medium">
                <span className="text-primary">{badge}</span>
              </div>
            )}
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight mb-4">
              {title}
            </h1>
            <p className="text-sm md:text-[15px] text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed">
              {subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button size="sm" className="h-9 px-4 text-[13px]" asChild>
                <Link to="/register">
                  Try for free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="h-9 px-4 text-[13px]" asChild>
                <Link to="/download">Download App</Link>
              </Button>
            </div>
          </div>
        </section>

        {children}

        {/* Final CTA */}
        <section className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-xl text-center">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight mb-2">
              Ready to try it?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Open source, AI-native, and fast.
            </p>
            <Button size="sm" className="h-9 px-4 text-[13px]" asChild>
              <Link to="/register">
                Create Your Account
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6">
        <div className="container px-4 mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-5 w-5 rounded bg-primary/10">
                <Calendar className="h-2.5 w-2.5 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground">© 2026 Open Sunsama</span>
            </div>
            <nav className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
                <Github className="h-3.5 w-3.5" />
              </a>
            </nav>
          </div>
        </div>
      </footer>
    </div>
  );
}
