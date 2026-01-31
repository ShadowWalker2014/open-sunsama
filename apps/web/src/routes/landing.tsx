import { Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  Bot,
  ArrowRight,
  Github,
  Zap,
  Shield,
  Download,
  Command,
  Layout,
  Check,
  X,
  Timer,
  Sparkles,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";

/**
 * Feature card - matches app's card style
 */
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
  href,
}: {
  icon: any;
  title: string;
  description: string;
  delay?: number;
  href?: string;
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const Content = (
    <div className="group rounded-xl border border-border/40 bg-card p-4 hover:border-border/60 hover:bg-card/80 transition-all duration-200">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-[13px] font-semibold tracking-tight">{title}</h3>
          <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        {href && (
          <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors shrink-0" />
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link
        to={href}
        ref={ref}
        className={cn(
          "block transition-all duration-200",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
        style={{ transitionDelay: `${delay}ms` }}
      >
        {Content}
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-200",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {Content}
    </div>
  );
}

/**
 * Comparison table - compact style
 */
function ComparisonSection() {
  const features = [
    { name: "Calendar sync", us: true, others: true },
    { name: "Time blocking", us: true, others: true },
    { name: "Focus mode", us: true, others: false },
    { name: "AI/MCP native", us: true, others: false },
    { name: "Open source", us: true, others: false },
    { name: "Self-hostable", us: true, others: false },
  ];

  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-8">
          <h2 className="text-lg font-semibold tracking-tight">
            Why Open Sunsama?
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The features you need, none of the lock-in.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "rounded-xl border border-border/40 overflow-hidden transition-all duration-300",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Feature</th>
                <th className="px-4 py-3 font-medium text-primary text-center">Open Sunsama</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Others</th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5 text-muted-foreground">{feature.name}</td>
                  <td className="px-4 py-2.5 text-center">
                    {feature.us ? (
                      <Check className="h-3.5 w-3.5 text-primary mx-auto" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {feature.others ? (
                      <Check className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" />
                    ) : (
                      <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  useSEO(SEO_CONFIGS.landing);
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
      </div>

      {/* Header - matches app header style */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-12 items-center justify-between px-4 mx-auto max-w-5xl">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground">
              <Calendar className="h-3.5 w-3.5" />
            </div>
            <span className="text-[13px] font-semibold">Open Sunsama</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" asChild>
              <Link to="/download">Download</Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" asChild>
              <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </Button>
          </nav>

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
        {/* Hero - compact */}
        <section ref={heroRef} className="pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="container px-4 mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 mb-6 rounded-md border border-border/40 bg-card/50 text-[11px] font-medium transition-all duration-300",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">v1.0 now available</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Daily planning,{" "}
              <span className="text-primary">done right.</span>
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-[15px] text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed transition-all duration-300 delay-100",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              The open-source daily planner for time-blocking, focused work, 
              and seamless AI integration.
            </p>

            {/* CTA */}
            <div
              className={cn(
                "flex flex-col sm:flex-row gap-2 justify-center transition-all duration-300 delay-150",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <Button size="sm" className="h-9 px-4 text-[13px]" asChild>
                <Link to="/register">
                  Start for free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="h-9 px-4 text-[13px]" asChild>
                <Link to="/download">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Link>
              </Button>
            </div>

            {/* App preview - matches app card style */}
            <div
              className={cn(
                "mt-12 md:mt-16 transition-all duration-500 delay-200",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
            >
              <div className="rounded-xl border border-border/40 bg-card/50 p-1 shadow-lg">
                <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
                  {/* Window chrome */}
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-muted/20">
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
                    <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
                  </div>
                  {/* Mock content */}
                  <div className="p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="h-2.5 w-24 rounded bg-muted" />
                        <div className="h-2 w-16 rounded bg-muted/50 mt-1.5" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="rounded-lg border border-border/40 bg-card/50 p-3">
                          <div className="h-2 w-12 rounded bg-primary/20 mb-2" />
                          <div className="h-2 w-full rounded bg-muted mb-1.5" />
                          <div className="h-2 w-2/3 rounded bg-muted/50" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features grid - compact cards */}
        <section className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-8">
              <h2 className="text-lg font-semibold tracking-tight">
                Built for focus
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Everything you need to plan your day.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FeatureCard
                icon={Clock}
                title="Time blocking"
                description="Drag tasks onto your calendar to create a realistic daily plan."
                delay={0}
                href="/features/time-blocking"
              />
              <FeatureCard
                icon={Layout}
                title="Kanban board"
                description="Organize tasks visually with drag-and-drop prioritization."
                delay={50}
                href="/features/kanban"
              />
              <FeatureCard
                icon={Timer}
                title="Focus mode"
                description="Work on one task at a time with built-in timer."
                delay={100}
                href="/features/focus-mode"
              />
              <FeatureCard
                icon={Bot}
                title="AI native"
                description="Full MCP support. Let AI agents manage your schedule."
                delay={150}
                href="/features/ai-integration"
              />
              <FeatureCard
                icon={Command}
                title="Command palette"
                description="Access everything with ⌘K. Search tasks, run commands, navigate fast."
                delay={200}
                href="/features/command-palette"
              />
              <FeatureCard
                icon={RefreshCw}
                title="Calendar sync"
                description="Bidirectional sync with Google, Outlook, and iCloud calendars."
                delay={250}
                href="/features/calendar-sync"
              />
            </div>
          </div>
        </section>

        {/* Comparison */}
        <ComparisonSection />

        {/* Stats - compact */}
        <section className="py-16 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-3xl">
            <div className="grid grid-cols-4 gap-4 text-center">
              {[
                { value: "100%", label: "Open source", icon: Github },
                { value: "24+", label: "MCP tools", icon: Bot },
                { value: "<50ms", label: "Latency", icon: Zap },
                { value: "∞", label: "Self-host", icon: Shield },
              ].map((stat, i) => (
                <div key={i} className="space-y-1">
                  <stat.icon className="h-4 w-4 mx-auto text-muted-foreground/50" />
                  <div className="text-lg md:text-xl font-semibold tracking-tight">{stat.value}</div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA - compact */}
        <section className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-xl text-center">
            <h2 className="text-lg md:text-xl font-semibold tracking-tight mb-2">
              Ready to take control?
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Join the open-source movement for better daily planning.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button size="sm" className="h-9 px-4 text-[13px]" asChild>
                <Link to="/register">
                  Create free account
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="h-9 px-4 text-[13px]" asChild>
                <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
                  <Github className="h-3.5 w-3.5" />
                  GitHub
                </a>
              </Button>
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">
              No credit card required • Free for individuals
            </p>
          </div>
        </section>
      </main>

      {/* Footer - minimal */}
      <footer className="border-t border-border/40 py-6">
        <div className="container px-4 mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-5 w-5 rounded bg-primary/10">
                <Calendar className="h-2.5 w-2.5 text-primary" />
              </div>
              <span className="text-[11px] text-muted-foreground">
                © 2026 Open Sunsama
              </span>
            </div>
            <nav className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">
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
    </div>
  );
}
