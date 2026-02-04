import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";

/**
 * Footer component for docs layout
 */
export function DocsLayoutFooter() {
  return (
    <footer className="border-t border-border/40 py-6 mt-auto">
      <div className="container px-4 mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src="/open-sunsama-logo.png"
              alt="Open Sunsama"
              loading="lazy"
              decoding="async"
              className="h-5 w-5 rounded object-cover"
            />
            <span className="text-[11px] text-muted-foreground">
              &copy; 2026 Open Sunsama
            </span>
          </div>
          <nav className="flex items-center gap-4 text-[11px] text-muted-foreground">
            <Link
              to="/docs"
              className="hover:text-foreground transition-colors"
            >
              Docs
            </Link>
            <Link
              to="/blog"
              search={{}}
              className="hover:text-foreground transition-colors"
            >
              Blog
            </Link>
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
