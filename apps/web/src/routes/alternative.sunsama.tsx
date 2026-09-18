import { Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  ArrowRight,
  Github,
  Check,
  X,
  Shield,
  Users,
  Sparkles,
  ChevronDown,
  Timer,
  Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { Breadcrumbs, FAQSchema, ProductComparisonSchema } from "@/components/seo";
import { useState } from "react";
import { SiteFooter, SiteHeader } from "@/components/landing/sections";

/**
 * Feature comparison table
 */
function FeatureComparisonSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    { name: "Time blocking", sunsama: true, openSunsama: true },
    { name: "Calendar sync", sunsama: true, openSunsama: true },
    { name: "Focus mode with timer", sunsama: true, openSunsama: true },
    { name: "Kanban board", sunsama: true, openSunsama: true },
    { name: "Daily planning workflow", sunsama: true, openSunsama: true },
    { name: "Open source", sunsama: false, openSunsama: true, highlight: true },
    { name: "Self-hosted option", sunsama: false, openSunsama: true, highlight: true },
    { name: "AI/MCP native", sunsama: "Limited", openSunsama: "Any MCP client", highlight: true },
    { name: "API access", sunsama: "Enterprise only", openSunsama: "Full REST API" },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            See the Difference
          </h2>
          <p className="text-sm text-muted-foreground">
            The same daily-planning features. Plus open source code and an AI connector.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "rounded-xl border border-border/40 overflow-hidden shadow-lg transition-all duration-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Feature</th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">Sunsama</th>
                <th className="px-4 py-3 font-medium text-center">
                  <span className="text-primary">Open Sunsama</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-border/40 last:border-0",
                    feature.highlight && "bg-primary/5"
                  )}
                >
                  <td className="px-4 py-3 text-muted-foreground">{feature.name}</td>
                  <td className="px-4 py-3 text-center">
                    {typeof feature.sunsama === "boolean" ? (
                      feature.sunsama ? (
                        <Check className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className="text-muted-foreground">
                        {feature.sunsama}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {typeof feature.openSunsama === "boolean" ? (
                      feature.openSunsama ? (
                        <Check className="h-4 w-4 text-primary mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className={cn(
                        "font-medium",
                        feature.highlight ? "text-primary" : "text-foreground"
                      )}>
                        {feature.openSunsama}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Comparison as of January 2026. Sunsama features from their website.
        </p>
      </div>
    </section>
  );
}

/**
 * Visual demo section showing the app interface
 */
function VisualDemoSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Everything You Love About Sunsama
          </h2>
          <p className="text-sm text-muted-foreground">
            Familiar interface. All the features you need.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "transition-all duration-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <div className="rounded-xl border border-border/40 bg-card/50 p-1 shadow-xl">
            <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
              {/* Window chrome */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-muted/20">
                <div className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-yellow-400/60" />
                <div className="h-2.5 w-2.5 rounded-full bg-green-400/60" />
                <span className="ml-3 text-[10px] text-muted-foreground">Open Sunsama</span>
              </div>

              {/* Mock app content */}
              <div className="p-4 md:p-6">
                <div className="flex gap-6">
                  {/* Task list side */}
                  <div className="w-1/3 space-y-3">
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Today
                    </div>
                    {/* Task cards */}
                    <div className="rounded-lg border border-border/40 bg-card p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-xs font-medium">Review Q1 roadmap</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>2h estimated</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-xs font-medium">Write API docs</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Timer className="h-3 w-3 text-primary" />
                        <span className="text-primary">In focus mode</span>
                      </div>
                    </div>
                    <div className="rounded-lg border border-border/40 bg-card p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-xs font-medium">Team sync meeting</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>30m</span>
                      </div>
                    </div>
                  </div>

                  {/* Timeline side */}
                  <div className="flex-1 space-y-2">
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Timeline
                    </div>
                    <div className="flex gap-3">
                      {/* Time labels */}
                      <div className="w-10 shrink-0 space-y-[52px] text-[10px] text-muted-foreground pt-1">
                        <div>9:00</div>
                        <div>10:00</div>
                        <div>11:00</div>
                        <div>12:00</div>
                      </div>
                      {/* Time blocks */}
                      <div className="flex-1 space-y-2 relative">
                        <div className="h-10 rounded-lg bg-blue-500/10 border border-blue-500/20 p-2 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-blue-500" />
                          <span className="text-xs font-medium">Morning planning</span>
                        </div>
                        <div className="h-16 rounded-lg bg-primary/10 border border-primary/30 p-2 flex flex-col justify-between">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary" />
                            <span className="text-xs font-medium">Deep work: API docs</span>
                          </div>
                          <span className="text-[10px] text-primary">1h 30m</span>
                        </div>
                        <div className="h-10 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-2 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                          <span className="text-xs font-medium">Team sync</span>
                        </div>
                        <div className="h-8 rounded-lg bg-muted/30 border border-border/40 p-2 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                          <span className="text-xs text-muted-foreground">Lunch break</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature badges */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {[
            { icon: Layout, label: "Kanban Board" },
            { icon: Clock, label: "Time Blocking" },
            { icon: Timer, label: "Focus Mode" },
            { icon: Calendar, label: "Calendar Sync" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-card/50 text-[11px]"
            >
              <item.icon className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Why switch section with 4 compelling reasons
 */
function WhySwitchSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const reasons = [
    {
      icon: Sparkles,
      title: "Works With Any AI Agent",
      description: "Connect Claude, ChatGPT, Cursor, or any MCP client with one URL. Sign in with OAuth. No API key.",
      highlight: "1 URL",
    },
    {
      icon: Shield,
      title: "Full Data Ownership",
      description: "Your data stays yours. Self-host or use our cloud—you're always in control.",
      highlight: "100%",
    },
    {
      icon: Layout,
      title: "Keyboard-First Planning",
      description: "Kanban board, time blocking, focus mode, and rollover. Open anything with the ⌘K command palette.",
      highlight: "⌘K",
    },
    {
      icon: Users,
      title: "Open Source Community",
      description: "Join thousands of contributors. Request features, report bugs, or build your own.",
      highlight: "1000+",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Why Switch to Open Sunsama?
          </h2>
          <p className="text-sm text-muted-foreground">
            Four reasons you'll never look back.
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {reasons.map((reason, i) => (
            <div
              key={i}
              className={cn(
                "group rounded-xl border border-border/40 bg-card p-5 hover:border-border/60 hover:bg-card/80 transition-all duration-300",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <reason.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg font-bold text-primary">{reason.highlight}</span>
                  </div>
                  <h3 className="text-[15px] font-semibold mb-1">{reason.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {reason.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Social proof section
 */
function SocialProofSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-16 border-t border-border/40 bg-muted/10">
      <div className="container px-4 mx-auto max-w-3xl">
        <div
          ref={ref}
          className={cn(
            "text-center transition-all duration-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-4">
            Trusted by the community
          </div>

          <div className="flex flex-wrap justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">1,000+</div>
              <div className="text-xs text-muted-foreground">Daily Planners</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">100%</div>
              <div className="text-xs text-muted-foreground">Open Source</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">23</div>
              <div className="text-xs text-muted-foreground">MCP Tools</div>
            </div>
          </div>

          {/* GitHub badge */}
          <a
            href="https://github.com/ShadowWalker2014/open-sunsama"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border/40 bg-card hover:bg-card/80 transition-colors"
          >
            <Github className="h-4 w-4" />
            <span className="text-sm font-medium">Star on GitHub</span>
            <span className="text-xs text-muted-foreground">Source on GitHub</span>
          </a>

          <p className="mt-6 text-sm text-muted-foreground max-w-md mx-auto">
            Connect Claude, ChatGPT, Cursor, or any MCP client with one URL. Sign in with OAuth. No API key.
          </p>
          <p className="text-[11px] text-muted-foreground mt-2">
            <code>https://api.opensunsama.com/mcp</code>
          </p>
        </div>
      </div>
    </section>
  );
}

/**
 * FAQ section
 */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Can I control Open Sunsama from Claude or ChatGPT?",
      answer: "Yes. Paste https://api.opensunsama.com/mcp into Claude, ChatGPT, Cursor, Claude Code, VS Code, or any MCP client, then sign in with OAuth. You don't need an API key. Your agent can then read your schedule, create tasks, and time-block your day.",
    },
    {
      question: "Can I import my data from Sunsama?",
      answer: "We're working on a direct import tool. In the meantime, you can export your data from Sunsama and manually recreate your tasks. Our interface is familiar enough that the transition is smooth.",
    },
    {
      question: "What features does Open Sunsama have?",
      answer: "All the core features you love: time blocking with two-way calendar sync (Google, Outlook, iCloud), focus mode with a built-in timer, a kanban board for daily planning, rollover of unfinished tasks, a ⌘K command palette, and full keyboard navigation. It runs on the web, on desktop, and on mobile.",
    },
    {
      question: "Is my data private and secure?",
      answer: "Absolutely. Your data is encrypted and stored securely. Unlike some alternatives, we don't sell your data or use it for advertising. For maximum control, you can self-host Open Sunsama on your own infrastructure.",
    },
    {
      question: "Can I self-host Open Sunsama?",
      answer: "Yes! Open Sunsama is fully open-source. Clone the repo, set up a PostgreSQL database, and deploy anywhere—your own server, Docker, Railway, Vercel, or any cloud provider. Full documentation is available on GitHub.",
    },
    {
      question: "How does the AI/MCP integration work?",
      answer: "Open Sunsama's MCP (Model Context Protocol) server gives your AI assistant 23 tools to read and update your tasks, subtasks, and time blocks. Tools that delete data are marked as destructive, so Claude and ChatGPT ask before running them. You can disconnect any assistant under Settings → MCP.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to know before switching.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/40 overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-muted/20 transition-colors"
              >
                <span className="text-sm font-medium pr-4">{faq.question}</span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
                    openIndex === i && "rotate-180"
                  )}
                />
              </button>
              {openIndex === i && (
                <div className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Final CTA section
 */
function FinalCTASection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-20 border-t border-border/40 bg-gradient-to-b from-primary/5 to-background">
      <div
        ref={ref}
        className={cn(
          "container px-4 mx-auto max-w-xl text-center transition-all duration-500",
          inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        )}
      >
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/10 text-[11px] font-medium text-primary">
          <Sparkles className="h-3 w-3" />
          Works with any AI agent
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
          Ready to switch?
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          Plan your day on a kanban board, time-block it on your calendar,
          and let Claude or ChatGPT help you run it.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="h-11 px-6 text-sm" asChild>
            <Link to="/register">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-11 px-6 text-sm" asChild>
            <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              View on GitHub
            </a>
          </Button>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          Open source • Works with any AI agent • Self-hostable
        </p>
      </div>
    </section>
  );
}

/**
 * Open-Source Sunsama Alternative Landing Page
 * High-conversion page targeting "sunsama alternative" searches
 */
export default function AlternativeSunsamaPage() {
  useSEO(SEO_CONFIGS.alternative.sunsama);
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  const faqItems = [
    {
      question: "Can I control Open Sunsama from Claude or ChatGPT?",
      answer: "Yes. Paste https://api.opensunsama.com/mcp into Claude, ChatGPT, Cursor, Claude Code, VS Code, or any MCP client, then sign in with OAuth. You don't need an API key. Your agent can then read your schedule, create tasks, and time-block your day.",
    },
    {
      question: "Can I import my data from Sunsama?",
      answer: "We're working on a direct import tool. In the meantime, you can export your data from Sunsama and manually recreate your tasks. Our interface is familiar enough that the transition is smooth.",
    },
    {
      question: "What features does Open Sunsama have?",
      answer: "All the core features you love: time blocking with two-way calendar sync (Google, Outlook, iCloud), focus mode with a built-in timer, a kanban board for daily planning, rollover of unfinished tasks, a ⌘K command palette, and full keyboard navigation. It runs on the web, on desktop, and on mobile.",
    },
    {
      question: "Is my data private and secure?",
      answer: "Absolutely. Your data is encrypted and stored securely. Unlike some alternatives, we don't sell your data or use it for advertising. For maximum control, you can self-host Open Sunsama on your own infrastructure.",
    },
    {
      question: "Can I self-host Open Sunsama?",
      answer: "Yes! Open Sunsama is fully open-source. Clone the repo, set up a PostgreSQL database, and deploy anywhere—your own server, Docker, Railway, Vercel, or any cloud provider. Full documentation is available on GitHub.",
    },
    {
      question: "How does the AI/MCP integration work?",
      answer: "Open Sunsama's MCP (Model Context Protocol) server gives your AI assistant 23 tools to read and update your tasks, subtasks, and time blocks. Tools that delete data are marked as destructive, so Claude and ChatGPT ask before running them. You can disconnect any assistant under Settings → MCP.",
    },
  ];

  return (
    <>
      <FAQSchema items={faqItems} />
      <ProductComparisonSchema
        mainProduct={{
          name: "Open Sunsama",
          description: "Open-source daily planner with time blocking, focus mode, and two-way calendar sync. Works with Claude, ChatGPT, and any MCP client.",
          url: "https://opensunsama.com",
        }}
        comparedProducts={[
          {
            name: "Sunsama",
            description: "Daily planner with time blocking and calendar integration for professionals.",
            url: "https://sunsama.com",
          },
        ]}
        articleTitle="Open Sunsama vs Sunsama: Open-Source Alternative Comparison"
        articleUrl="https://opensunsama.com/alternative/sunsama"
      />
      <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-green-500/[0.02] blur-[100px] rounded-full" />
      </div>

      <SiteHeader />

      <main className="relative">
        {/* Breadcrumb navigation */}
        <div className="container px-4 mx-auto max-w-3xl pt-6">
          <Breadcrumbs
            items={[
              { label: "Alternatives" },
              { label: "Sunsama" },
            ]}
          />
        </div>

        {/* Hero Section */}
        <section ref={heroRef} className="pt-8 pb-12 md:pt-12 md:pb-16">
          <div className="container px-4 mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 mb-6 rounded-full border border-green-500/30 bg-green-500/10 text-[11px] font-semibold transition-all duration-300",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <Sparkles className="h-3 w-3 text-green-500" />
              <span className="text-green-600 dark:text-green-400">Open Source & AI Native</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              The Open-Source{" "}
              <span className="text-primary">Sunsama Alternative</span>
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed transition-all duration-300 delay-100",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Everything you love about Sunsama—daily planning, time blocking,
              focus mode—in an open-source app. Connect Claude, ChatGPT, or any
              AI agent with one URL.
            </p>

            {/* CTAs */}
            <div
              className={cn(
                "flex flex-col sm:flex-row gap-3 justify-center transition-all duration-300 delay-150",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <Button size="lg" className="h-11 px-6 text-sm" asChild>
                <Link to="/register">
                  Get started
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6 text-sm" asChild>
                <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>

            {/* Trust signals */}
            <div
              className={cn(
                "flex flex-wrap items-center justify-center gap-4 mt-8 text-[11px] text-muted-foreground transition-all duration-300 delay-200",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Open source</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Works with any AI agent</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Self-hostable</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <FeatureComparisonSection />

        {/* Visual Demo */}
        <VisualDemoSection />

        {/* Why Switch */}
        <WhySwitchSection />

        {/* Social Proof */}
        <SocialProofSection />

        {/* FAQ */}
        <FAQSection />

        {/* Final CTA */}
        <FinalCTASection />
      </main>

      <SiteFooter />
      </div>
    </>
  );
}
