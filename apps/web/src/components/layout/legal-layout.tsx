import { Link } from "@tanstack/react-router";
import { Calendar, Github } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LegalLayoutProps {
  children: React.ReactNode;
}

/**
 * Header for legal pages - matches landing page style
 */
function LegalHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between px-4 mx-auto max-w-6xl">
        <Link to="/" className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          <span className="font-semibold">Open Sunsama</span>
        </Link>
        <nav className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}

/**
 * Footer for legal pages - matches landing page style with legal links
 */
function LegalFooter() {
  return (
    <footer className="border-t py-8">
      <div className="container px-4 mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Open Sunsama</span>
          <span className="mx-2">·</span>
          <span>Free and open source</span>
        </div>
        <nav className="flex items-center gap-4 text-sm text-muted-foreground">
          <Link
            to="/privacy"
            className="hover:text-foreground transition-colors"
          >
            Privacy
          </Link>
          <Link to="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
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
    <div className="min-h-screen bg-background flex flex-col">
      <LegalHeader />
      <main className="flex-1 container px-4 mx-auto max-w-3xl py-12">
        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-p:text-muted-foreground prose-p:leading-relaxed prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-a:no-underline hover:prose-a:underline">
          {children}
        </article>
      </main>
      <LegalFooter />
    </div>
  );
}
