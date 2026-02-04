import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar,
  ArrowRight,
  Github,
  Check,
  X,
  DollarSign,
  Timer,
  Command,
  GripVertical,
  RefreshCw,
  ChevronDown,
  Clock,
  Keyboard,
  Layout,
  Inbox,
  Sparkles,
  Code,
  Server,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { FAQSchema } from "@/components/seo";

/**
 * Akiflow Alternative Landing Page
 * High-converting landing page targeting "akiflow alternative" searches
 * Emphasizes: same manual time-blocking philosophy, but free
 */

function LoveCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: any;
  title: string;
  description: string;
  delay?: number;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={cn(
        "p-5 rounded-xl border border-border/40 bg-card/50 transition-all duration-300 hover:border-primary/40",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold mb-2">{title}</h3>
      <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function PriceComparison() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-500",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      {/* Akiflow Card */}
      <div className="p-6 rounded-xl border border-border/40 bg-card/30">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-muted/50 flex items-center justify-center">
            <span className="text-sm font-bold text-muted-foreground">A</span>
          </div>
          <span className="text-sm font-medium text-muted-foreground">Akiflow</span>
        </div>
        <div className="mb-3">
          <span className="text-3xl font-bold">$19</span>
          <span className="text-muted-foreground text-sm">/month</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          = $228/year (no free tier)
        </p>
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span>Manual time blocking</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span>Command palette</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-muted-foreground/50" />
            <span>Calendar sync</span>
          </div>
        </div>
      </div>

      {/* Open Sunsama Card */}
      <div className="p-6 rounded-xl border-2 border-primary/50 bg-primary/5 relative">
        <div className="absolute -top-3 right-4 px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-medium">
          SAVE $228/YEAR
        </div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Calendar className="h-4 w-4 text-primary" />
          </div>
          <span className="text-sm font-medium">Open Sunsama</span>
        </div>
        <div className="mb-3">
          <span className="text-3xl font-bold text-primary">$0</span>
          <span className="text-muted-foreground text-sm">/forever</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Same features. Zero cost.
        </p>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-primary" />
            <span>Manual time blocking</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-primary" />
            <span>Command palette (⌘K)</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-primary" />
            <span>Calendar sync</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium">+ Focus mode, open source, self-hosted</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonTable() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    { name: "Price", akiflow: "$19/month", us: "Free", highlight: true },
    { name: "Manual time blocking", akiflow: true, us: true },
    { name: "Calendar sync", akiflow: true, us: true },
    { name: "Command palette", akiflow: true, us: true },
    { name: "Task inbox", akiflow: true, us: "Kanban board" },
    { name: "Keyboard-first design", akiflow: true, us: true },
    { name: "Focus mode", akiflow: false, us: true, highlight: true },
    { name: "Open source", akiflow: false, us: true, highlight: true },
    { name: "Self-hosted option", akiflow: false, us: true, highlight: true },
    { name: "MCP/API access", akiflow: "Limited", us: "24+ tools" },
  ];

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-border/40 overflow-hidden transition-all duration-500",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      <table className="w-full text-[13px]">
        <thead>
          <tr className="border-b border-border/40 bg-muted/30">
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Feature</th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-center">Akiflow</th>
            <th className="px-4 py-3 font-medium text-primary text-center">Open Sunsama</th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, i) => (
            <tr key={i} className={cn(
              "border-b border-border/40 last:border-0",
              feature.highlight && "bg-primary/5"
            )}>
              <td className="px-4 py-3 text-muted-foreground">{feature.name}</td>
              <td className="px-4 py-3 text-center">
                {typeof feature.akiflow === "boolean" ? (
                  feature.akiflow ? (
                    <Check className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                  )
                ) : (
                  <span className="text-muted-foreground">{feature.akiflow}</span>
                )}
              </td>
              <td className="px-4 py-3 text-center">
                {typeof feature.us === "boolean" ? (
                  feature.us ? (
                    <Check className="h-4 w-4 text-primary mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                  )
                ) : (
                  <span className={cn(
                    "font-medium",
                    feature.highlight ? "text-primary" : "text-foreground"
                  )}>{feature.us}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function VisualDemo() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={cn(
        "space-y-6 transition-all duration-500",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      {/* Command Palette Demo */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-1 shadow-lg">
        <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-muted/20">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
            <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
            <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
            <span className="ml-2 text-[10px] text-muted-foreground">Command Palette - ⌘K</span>
          </div>

          <div className="p-4 md:p-6">
            {/* Command input */}
            <div className="max-w-md mx-auto">
              <div className="rounded-lg border border-primary/40 bg-background shadow-lg overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
                  <Command className="h-4 w-4 text-primary" />
                  <span className="text-sm text-muted-foreground">Type a command or search...</span>
                  <kbd className="ml-auto px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">ESC</kbd>
                </div>
                <div className="p-2 space-y-1">
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-primary/10 text-primary">
                    <Clock className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Schedule for today</span>
                    <kbd className="ml-auto px-1.5 py-0.5 rounded bg-primary/20 text-[10px]">T</kbd>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                    <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Start focus mode</span>
                    <kbd className="ml-auto px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">F</kbd>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50 transition-colors">
                    <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">Add to backlog</span>
                    <kbd className="ml-auto px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">B</kbd>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Time Blocking Demo */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-1 shadow-lg">
        <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-muted/20">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
            <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
            <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
            <span className="ml-2 text-[10px] text-muted-foreground">Manual Time Blocking</span>
          </div>

          <div className="p-4 md:p-6">
            <div className="flex gap-4">
              {/* Time column */}
              <div className="hidden sm:block w-12 shrink-0 space-y-6 pt-8">
                {["9 AM", "10 AM", "11 AM", "12 PM", "1 PM"].map((time, i) => (
                  <div key={i} className="text-[10px] text-muted-foreground/60 text-right">{time}</div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="flex-1 relative">
                <div className="space-y-2">
                  <div className="group relative p-3 rounded-lg border border-primary/40 bg-primary/5 cursor-move">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-primary/50 group-hover:text-primary transition-colors" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Deep work: API development</p>
                        <p className="text-[10px] text-muted-foreground">9:00 - 11:00 AM</p>
                      </div>
                    </div>
                  </div>

                  <div className="group p-3 rounded-lg border border-border/40 bg-card/50 cursor-move hover:border-border/60 transition-colors">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Code review</p>
                        <p className="text-[10px] text-muted-foreground">11:00 AM - 12:00 PM</p>
                      </div>
                    </div>
                  </div>

                  <div className="py-2 text-center">
                    <span className="text-[10px] text-muted-foreground/50">Lunch</span>
                  </div>

                  <div className="group p-3 rounded-lg border border-border/40 bg-card/50 cursor-move hover:border-border/60 transition-colors">
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                      <div className="flex-1">
                        <p className="text-xs font-medium">Team standup</p>
                        <p className="text-[10px] text-muted-foreground">1:00 - 1:30 PM</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <Keyboard className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-primary">Drag to schedule - you control your time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FAQItem({
  question,
  answer,
  defaultOpen = false,
}: {
  question: string;
  answer: string;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/40 last:border-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="text-sm font-medium">{question}</span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-200",
          isOpen ? "max-h-48 pb-4" : "max-h-0"
        )}
      >
        <p className="text-sm text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

export default function AkiflowAlternativePage() {
  useSEO(SEO_CONFIGS.alternatives.akiflow);

  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  const faqItems = [
    {
      question: "Is it as polished as Akiflow?",
      answer: "Yes. Open Sunsama has a clean, minimal interface with smooth animations and thoughtful design. We're built by people who care deeply about user experience—not just features.",
    },
    {
      question: "Does it have the same keyboard shortcuts?",
      answer: "We use the same standard shortcuts where possible. ⌘K opens the command palette, you can navigate with arrow keys, and most actions have keyboard shortcuts. Power users feel right at home.",
    },
    {
      question: "Can I migrate from Akiflow?",
      answer: "Currently we don't have a direct import, but since we use similar concepts (tasks, time blocks, calendar sync), you can set up Open Sunsama and run them side-by-side during transition. Your calendars sync automatically.",
    },
    {
      question: "What about team features?",
      answer: "Open Sunsama is currently focused on individual productivity. We're exploring team features for the future. If you need team scheduling now, Akiflow might still be a better fit.",
    },
    {
      question: "Why is it free?",
      answer: "We believe everyone deserves great productivity tools. Open Sunsama is open source with an optional paid tier for teams and enterprise. Individual use is free forever—no tricks, no trial that expires.",
    },
  ];

  return (
    <>
      <FAQSchema items={faqItems} />
      <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
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

          <nav className="hidden md:flex items-center gap-0.5">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" asChild>
              <Link to="/blog" search={{}}>Blog</Link>
            </Button>
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" asChild>
              <Link to="/download">Download</Link>
            </Button>
          </nav>

          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" className="h-8 px-3 text-xs" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="h-8 px-3 text-xs" asChild>
              <Link to="/register">Try Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Breadcrumb navigation */}
        <div className="container px-4 mx-auto max-w-3xl pt-6">
          <Breadcrumbs
            items={[
              { label: "Alternatives" },
              { label: "Akiflow" },
            ]}
          />
        </div>

        {/* Hero Section */}
        <section ref={heroRef} className="pt-8 pb-12 md:pt-12 md:pb-16">
          <div className="container px-4 mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 mb-6 rounded-md border border-primary/30 bg-primary/5 text-[11px] font-medium transition-all duration-300",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <DollarSign className="h-3 w-3 text-primary" />
              <span className="text-primary">Same Philosophy, Free Price</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              The Free{" "}
              <span className="text-primary">Akiflow</span> Alternative
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-[15px] text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed transition-all duration-300 delay-100",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Love Akiflow's manual time-blocking approach but not the $19/month price? 
              Open Sunsama gives you the same control for{" "}
              <span className="text-primary font-medium">free</span>.
            </p>

            {/* CTAs */}
            <div
              className={cn(
                "flex flex-col sm:flex-row gap-2 justify-center transition-all duration-300 delay-150",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <Button size="sm" className="h-9 px-4 text-[13px]" asChild>
                <Link to="/register">
                  Try Free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="h-9 px-4 text-[13px]" asChild>
                <a href="#comparison">
                  See Comparison
                </a>
              </Button>
            </div>

            {/* Trust indicators */}
            <div
              className={cn(
                "mt-6 flex flex-wrap items-center justify-center gap-4 text-[11px] text-muted-foreground transition-all duration-300 delay-200",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                No credit card required
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                Free forever
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                Open source
              </span>
            </div>
          </div>
        </section>

        {/* What Akiflow Users Love Section */}
        <section className="py-16 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                What Akiflow Users Love (And Get Here Too)
              </h2>
              <p className="text-sm text-muted-foreground">
                Everything you love about Akiflow's approach—included for free.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <LoveCard
                icon={GripVertical}
                title="Manual Time Blocking"
                description="You decide when tasks happen. No AI moving things around. Drag and drop to schedule your day."
                delay={0}
              />
              <LoveCard
                icon={Layout}
                title="Clean, Focused Interface"
                description="Minimal design that keeps you focused on what matters. No clutter, no distractions."
                delay={50}
              />
              <LoveCard
                icon={Keyboard}
                title="Keyboard-First Design"
                description="Power users love keyboard shortcuts. ⌘K opens everything. Navigate without touching your mouse."
                delay={100}
              />
              <LoveCard
                icon={RefreshCw}
                title="Calendar Integration"
                description="Bidirectional sync with Google Calendar, Outlook, and iCloud. Your events stay in harmony."
                delay={150}
              />
              <LoveCard
                icon={Inbox}
                title="Task Inbox Approach"
                description="Capture tasks first, schedule later. Our kanban board works just like Akiflow's inbox."
                delay={200}
              />
              <LoveCard
                icon={Timer}
                title="Focus Mode (Bonus!)"
                description="Something Akiflow doesn't have: a dedicated focus mode with timer for deep work."
                delay={250}
              />
            </div>
          </div>
        </section>

        {/* Price Comparison Section */}
        <section className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Same Features. Save $228/Year.
              </h2>
              <p className="text-sm text-muted-foreground">
                Why pay for something you can get for free?
              </p>
            </div>

            <PriceComparison />
          </div>
        </section>

        {/* Visual Demo Section */}
        <section className="py-16 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Same Keyboard-First Experience
              </h2>
              <p className="text-sm text-muted-foreground">
                Command palette, manual time blocking, clean interface—all the things you love.
              </p>
            </div>

            <VisualDemo />
          </div>
        </section>

        {/* Feature Comparison Section */}
        <section id="comparison" className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Akiflow vs Open Sunsama
              </h2>
              <p className="text-sm text-muted-foreground">
                Feature-by-feature comparison.
              </p>
            </div>

            <ComparisonTable />
          </div>
        </section>

        {/* Additional Benefits Section */}
        <section className="py-16 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Why Switch to Open Sunsama?
              </h2>
              <p className="text-sm text-muted-foreground">
                Beyond the free price tag, here's what you gain.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-5 rounded-xl border border-border/40 bg-card/50 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
                  <Code className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold mb-2">Open Source</h3>
                <p className="text-xs text-muted-foreground">
                  See exactly how it works. Contribute improvements. No vendor lock-in.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border/40 bg-card/50 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
                  <Server className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold mb-2">Self-Hosted Option</h3>
                <p className="text-xs text-muted-foreground">
                  Keep your data on your own servers. Full control over your privacy.
                </p>
              </div>
              <div className="p-5 rounded-xl border border-border/40 bg-card/50 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h3 className="text-sm font-semibold mb-2">AI When You Want It</h3>
                <p className="text-xs text-muted-foreground">
                  24+ MCP tools for AI assistance. Use it on demand, never forced.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/50 overflow-hidden px-5">
              <FAQItem
                question="Is it as polished as Akiflow?"
                answer="Yes. Open Sunsama has a clean, minimal interface with smooth animations and thoughtful design. We're built by people who care deeply about user experience—not just features."
                defaultOpen={true}
              />
              <FAQItem
                question="Does it have the same keyboard shortcuts?"
                answer="We use the same standard shortcuts where possible. ⌘K opens the command palette, you can navigate with arrow keys, and most actions have keyboard shortcuts. Power users feel right at home."
              />
              <FAQItem
                question="Can I migrate from Akiflow?"
                answer="Currently we don't have a direct import, but since we use similar concepts (tasks, time blocks, calendar sync), you can set up Open Sunsama and run them side-by-side during transition. Your calendars sync automatically."
              />
              <FAQItem
                question="What about team features?"
                answer="Open Sunsama is currently focused on individual productivity. We're exploring team features for the future. If you need team scheduling now, Akiflow might still be a better fit."
              />
              <FAQItem
                question="Why is it free?"
                answer="We believe everyone deserves great productivity tools. Open Sunsama is open source with an optional paid tier for teams and enterprise. Individual use is free forever—no tricks, no trial that expires."
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-xl text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-6">
              <Keyboard className="h-7 w-7" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
              Same Manual Control. Zero Cost.
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              Start free—keep your keyboard-first workflow. No surprises.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button size="sm" className="h-10 px-5 text-[13px]" asChild>
                <Link to="/register">
                  Create Free Account
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="h-10 px-5 text-[13px]" asChild>
                <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
                  <Github className="h-3.5 w-3.5" />
                  View Source
                </a>
              </Button>
            </div>
            <p className="mt-5 text-[11px] text-muted-foreground">
              No credit card required • Free forever • Open source
            </p>
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
              <span className="text-[11px] text-muted-foreground">
                © 2026 Open Sunsama
              </span>
            </div>
            <nav className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <Link to="/blog" className="hover:text-foreground transition-colors">
                Blog
              </Link>
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
    </>
  );
}
