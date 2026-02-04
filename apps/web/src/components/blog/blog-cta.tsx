import { Link } from "@tanstack/react-router";
import { Github, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Call to action section for the blog listing page
 */
export function BlogCTA() {
  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-xl text-center">
        <h2 className="text-lg md:text-xl font-semibold tracking-tight mb-2">
          Ready to take control of your day?
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Join thousands using Open Sunsama for better daily planning.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <Button size="sm" className="h-9 px-4 text-[13px]" asChild>
            <Link to="/register">
              Create free account
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-9 px-4 text-[13px]"
            asChild
          >
            <a
              href="https://github.com/ShadowWalker2014/open-sunsama"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Github className="h-3.5 w-3.5" />
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
