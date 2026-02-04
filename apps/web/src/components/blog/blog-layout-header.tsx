import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

/**
 * Header component for the blog layout (individual post pages)
 * Contains logo, navigation, and auth buttons
 */
export function BlogLayoutHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between px-4 mx-auto max-w-5xl">
        <Link to="/" className="flex items-center gap-2">
          <img
            src="/open-sunsama-logo.png"
            alt="Open Sunsama"
            loading="lazy"
            decoding="async"
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
            <Link to="/docs">Docs</Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            asChild
          >
            <Link to="/blog" search={{}}>
              Blog
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs"
            asChild
          >
            <Link to="/download">Download</Link>
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
