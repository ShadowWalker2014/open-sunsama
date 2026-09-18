import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo";
import { SiteFooter, SiteHeader } from "@/components/landing/sections";

/**
 * Layout wrapper for feature-specific landing pages
 * Compact style matching the app
 */
export function FeatureLayout({
  children,
  title,
  subtitle,
  badge,
  visual,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
  badge?: string;
  /** Hero visual under the CTAs, e.g. a real product screenshot. */
  visual?: ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
      </div>

      <SiteHeader />

      <main className="relative">
        {/* Breadcrumb navigation */}
        <div className="container px-4 mx-auto max-w-3xl pt-6">
          <Breadcrumbs
            items={[{ label: "Features", href: "/" }, { label: title }]}
          />
        </div>

        {/* Feature Hero */}
        <section className="pt-8 pb-12 md:pt-12 md:pb-16">
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
                  Get started
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-[13px]"
                asChild
              >
                <Link to="/download">Download App</Link>
              </Button>
            </div>
          </div>
        </section>

        {visual && <section className="px-4 pb-16 md:pb-20">{visual}</section>}

        {children}

        {/* Final CTA */}
        <section className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-xl text-center">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight mb-2">
              Ready to try it?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Open source, built for focus, and controllable from any AI agent.
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

      <SiteFooter />
    </div>
  );
}
