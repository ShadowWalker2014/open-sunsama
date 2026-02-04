import { FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface BlogHeroProps {
  heroInView: boolean;
}

/**
 * Hero section for the blog listing page
 * Contains badge, headline, and subheadline with animation
 */
export function BlogHero({ heroInView }: BlogHeroProps) {
  return (
    <section className="pt-16 pb-12 md:pt-24 md:pb-16">
      <div className="container px-4 mx-auto max-w-3xl text-center">
        {/* Badge */}
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-2.5 py-1 mb-6 rounded-md border border-border/40 bg-card/50 text-[11px] font-medium transition-all duration-300",
            heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          <FileText className="h-3 w-3 text-primary" />
          <span className="text-muted-foreground">Blog</span>
        </div>

        {/* Headline */}
        <h1
          className={cn(
            "text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
            heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          Insights & Updates
        </h1>

        {/* Subheadline */}
        <p
          className={cn(
            "text-sm md:text-[15px] text-muted-foreground max-w-lg mx-auto leading-relaxed transition-all duration-300 delay-100",
            heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
          )}
        >
          Tips on productivity, time management, and building better daily
          habits.
        </p>
      </div>
    </section>
  );
}
