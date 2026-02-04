import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Github, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { DocsSidebar } from "./docs-sidebar";
import type { DocSection } from "@/types/docs";

interface DocsLayoutHeaderProps {
  sections: DocSection[];
  currentSlug?: string;
}

/**
 * Header component for the docs layout
 * Contains logo, navigation, and mobile menu
 */
export function DocsLayoutHeader({
  sections,
  currentSlug,
}: DocsLayoutHeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-12 items-center justify-between px-4 mx-auto max-w-6xl">
        <div className="flex items-center gap-4">
          {/* Mobile menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="p-4 border-b border-border/40">
                <Link to="/" className="flex items-center gap-2">
                  <img
                    src="/open-sunsama-logo.png"
                    alt="Open Sunsama"
                    loading="lazy"
                    decoding="async"
                    className="h-7 w-7 rounded-lg object-cover"
                  />
                  <span className="text-[13px] font-semibold">
                    Open Sunsama
                  </span>
                </Link>
              </div>
              <DocsSidebar sections={sections} currentSlug={currentSlug} />
            </SheetContent>
          </Sheet>

          <Link to="/" className="flex items-center gap-2">
            <img
              src="/open-sunsama-logo.png"
              alt="Open Sunsama"
              loading="lazy"
              decoding="async"
              className="h-7 w-7 rounded-lg object-cover"
            />
            <span className="text-[13px] font-semibold hidden sm:block">
              Open Sunsama
            </span>
          </Link>

          <span className="text-muted-foreground/50">/</span>

          <Link
            to="/docs"
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Docs
          </Link>
        </div>

        <nav className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs hidden md:flex"
            asChild
          >
            <Link to="/blog" search={{}}>
              Blog
            </Link>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 text-xs hidden md:flex"
            asChild
          >
            <Link to="/download">Download</Link>
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
            <a
              href="https://github.com/ShadowWalker2014/open-sunsama"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-4 w-4" />
              <span className="sr-only">GitHub</span>
            </a>
          </Button>
          <Button size="sm" className="h-8 px-3 text-xs" asChild>
            <Link to="/register">Get Started</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
