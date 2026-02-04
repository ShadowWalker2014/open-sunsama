import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar,
  ArrowRight,
  Github,
  Check,
  X,
  Hand,
  DollarSign,
  Zap,
  Timer,
  Command,
  GripVertical,
  RefreshCw,
  Bot,
  ChevronDown,
  Clock,
  MousePointer,
  Sparkles,
  Shield,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { Breadcrumbs, FAQSchema, ProductComparisonSchema } from "@/components/seo";

/**
 * Motion Alternative Landing Page
 * High-converting Google Ads landing page targeting "motion app alternative" searches
 */

function PainPointCard({
  icon: Icon,
  pain,
  solution,
  delay = 0,
}: {
  icon: any;
  pain: string;
  solution: string;
  delay?: number;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <div
      ref={ref}
      className={cn(
        "p-5 rounded-xl border border-border/40 bg-card/50 transition-all duration-300 hover:border-border/60",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10 text-destructive mb-4">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-sm font-medium text-destructive/90 mb-3">"{pain}"</p>
      <div className="flex items-start gap-2">
        <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
        <p className="text-sm text-muted-foreground">{solution}</p>
      </div>
    </div>
  );
}

function ComparisonTable() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    { name: "Price", motion: "$19-34/month", us: "Free", highlight: true },
    { name: "Scheduling approach", motion: "AI auto-schedules", us: "Manual (you decide)", highlight: true },
    { name: "Override control", motion: "Limited", us: "Full control", highlight: true },
    { name: "Time blocking", motion: true, us: true },
    { name: "Calendar sync", motion: true, us: true },
    { name: "Focus mode", motion: false, us: true },
    { name: "Open source", motion: false, us: true },
    { name: "Self-hosted option", motion: false, us: true },
    { name: "MCP/API access", motion: "Limited", us: "Full" },
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
            <th className="px-4 py-3 font-medium text-muted-foreground text-center">Motion</th>
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
                {typeof feature.motion === "boolean" ? (
                  feature.motion ? (
                    <Check className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                  )
                ) : (
                  <span className="text-muted-foreground">{feature.motion}</span>
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
        "rounded-xl border border-border/40 bg-card/50 p-1 shadow-lg transition-all duration-500",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
        {/* Window chrome */}
        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/40 bg-muted/20">
          <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
          <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
          <span className="ml-2 text-[10px] text-muted-foreground">Your Schedule - You're in Control</span>
        </div>

        {/* Mock calendar with time blocking */}
        <div className="p-4 md:p-6">
          <div className="flex gap-4">
            {/* Time column */}
            <div className="hidden sm:block w-12 shrink-0 space-y-6 pt-8">
              {["9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM"].map((time, i) => (
                <div key={i} className="text-[10px] text-muted-foreground/60 text-right">{time}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="flex-1 relative">
              {/* Time blocks */}
              <div className="space-y-2">
                {/* Block 1 - being dragged */}
                <div className="group relative p-3 rounded-lg border border-primary/40 bg-primary/5 cursor-move">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-primary/50 group-hover:text-primary transition-colors" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Review project specs</p>
                      <p className="text-[10px] text-muted-foreground">9:00 - 10:30 AM</p>
                    </div>
                    <MousePointer className="h-3.5 w-3.5 text-primary animate-pulse" />
                  </div>
                </div>

                {/* Block 2 */}
                <div className="group p-3 rounded-lg border border-border/40 bg-card/50 cursor-move hover:border-border/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Deep work: API integration</p>
                      <p className="text-[10px] text-muted-foreground">10:30 AM - 12:00 PM</p>
                    </div>
                  </div>
                </div>

                {/* Lunch break indicator */}
                <div className="py-2 text-center">
                  <span className="text-[10px] text-muted-foreground/50">Lunch break</span>
                </div>

                {/* Block 3 */}
                <div className="group p-3 rounded-lg border border-border/40 bg-card/50 cursor-move hover:border-border/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Team sync call</p>
                      <p className="text-[10px] text-muted-foreground">1:00 - 1:30 PM</p>
                    </div>
                  </div>
                </div>

                {/* Block 4 */}
                <div className="group p-3 rounded-lg border border-border/40 bg-card/50 cursor-move hover:border-border/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Write documentation</p>
                      <p className="text-[10px] text-muted-foreground">1:30 - 3:00 PM</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual control indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Hand className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">Drag to reschedule - you're in control</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeatureItem({
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
        "flex items-start gap-3 transition-all duration-300",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <h4 className="text-[13px] font-semibold">{title}</h4>
        <p className="text-xs text-muted-foreground">{description}</p>
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

export default function MotionAlternativePage() {
  useSEO(SEO_CONFIGS.alternatives.motion);

  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  const faqItems = [
    {
      question: "Is Open Sunsama as powerful as Motion?",
      answer: "Yes, and in many ways more so. You get time blocking, calendar sync, priority management, and focus mode. Plus features Motion lacks: open source code, self-hosting option, full API access, and no AI forced on you.",
    },
    {
      question: "Can I still use AI features if I want them?",
      answer: "Absolutely. Open Sunsama supports 24+ MCP tools for AI integration. The difference is YOU choose when to use AI assistance. It's available on demand, not forced by default.",
    },
    {
      question: "How does calendar sync work?",
      answer: "Bidirectional sync with Google Calendar, Microsoft Outlook, and iCloud Calendar. Your events appear in Open Sunsama, and time blocks you create sync back to your calendar.",
    },
    {
      question: "What about task prioritization?",
      answer: "Full P0-P3 priority system. Sort tasks by priority, drag them to reorder, and see priority badges at a glance. You decide what's important, not an algorithm.",
    },
    {
      question: "Is it really free?",
      answer: "Yes. Open Sunsama is free for individuals, forever. We're open source with an optional paid tier for teams. No trial that expires, no credit card required.",
    },
  ];

  return (
    <>
      <FAQSchema items={faqItems} />
      <ProductComparisonSchema
        mainProduct={{
          name: "Open Sunsama",
          description: "Free, open-source daily planner with manual time blocking and full user control. No forced AI scheduling.",
          url: "https://opensunsama.com",
          price: "0",
          priceCurrency: "USD",
        }}
        comparedProducts={[
          {
            name: "Motion",
            description: "AI-powered calendar and project management app that automatically schedules tasks.",
            url: "https://usemotion.com",
            price: "19",
            priceCurrency: "USD",
          },
        ]}
        articleTitle="Open Sunsama vs Motion: Manual Control Alternative"
        articleUrl="https://opensunsama.com/alternative/motion"
      />
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
              { label: "Motion" },
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
              <Hand className="h-3 w-3 text-primary" />
              <span className="text-primary">Manual Control</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              The Motion Alternative That Lets{" "}
              <span className="text-primary">YOU</span> Control Your Schedule
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-[15px] text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed transition-all duration-300 delay-100",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Love Motion's time-blocking concept but hate the rigid AI? 
              Open Sunsama gives you the same power with complete manual control. 
              <span className="text-primary font-medium"> And it's free.</span>
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
                <a href="#features">
                  See Features
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
                Free forever tier
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-3 w-3 text-primary" />
                Open source
              </span>
            </div>
          </div>
        </section>

        {/* Why Users Switch Section */}
        <section className="py-16 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Why Users Switch from Motion
              </h2>
              <p className="text-sm text-muted-foreground">
                Real frustrations from Motion users that Open Sunsama solves.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PainPointCard
                icon={Bot}
                pain="Motion's AI schedules meetings I didn't want"
                solution="With Open Sunsama, you schedule tasks manually. The AI assists when you ask, not when it decides."
                delay={0}
              />
              <PainPointCard
                icon={DollarSign}
                pain="$19/month with no free tier is too expensive"
                solution="Open Sunsama is completely free for individuals. No hidden costs, no trial that expires."
                delay={100}
              />
              <PainPointCard
                icon={Zap}
                pain="Can't easily override AI decisions"
                solution="Full manual control by default. Drag, drop, resize - your schedule responds to you."
                delay={200}
              />
            </div>
          </div>
        </section>

        {/* Comparison Table Section */}
        <section className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Motion vs Open Sunsama
              </h2>
              <p className="text-sm text-muted-foreground">
                See how they compare side by side.
              </p>
            </div>

            <ComparisonTable />
          </div>
        </section>

        {/* Visual Demo Section */}
        <section className="py-16 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Time Blocking That Respects Your Autonomy
              </h2>
              <p className="text-sm text-muted-foreground">
                Drag and drop your tasks. Resize blocks. No AI overriding your decisions.
              </p>
            </div>

            <VisualDemo />
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                What You Get
              </h2>
              <p className="text-sm text-muted-foreground">
                All the productivity tools, none of the AI surprises.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FeatureItem
                icon={Clock}
                title="Manual Time Blocking"
                description="Create time blocks by dragging tasks to your calendar. Resize them to adjust duration."
                delay={0}
              />
              <FeatureItem
                icon={GripVertical}
                title="Drag-and-Drop Scheduling"
                description="Intuitive kanban board and calendar. Move tasks across days with a single drag."
                delay={50}
              />
              <FeatureItem
                icon={Timer}
                title="Focus Mode with Timer"
                description="Work on one task at a time. Built-in timer tracks actual vs estimated time."
                delay={100}
              />
              <FeatureItem
                icon={RefreshCw}
                title="Full Calendar Sync"
                description="Bidirectional sync with Google Calendar, Outlook, and iCloud."
                delay={150}
              />
              <FeatureItem
                icon={Command}
                title="Command Palette (⌘K)"
                description="Access everything from the keyboard. Search tasks, run commands, navigate fast."
                delay={200}
              />
              <FeatureItem
                icon={Sparkles}
                title="AI Tools When YOU Want Them"
                description="Optional AI features via MCP integration. Use them on demand, not by default."
                delay={250}
              />
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-2xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Frequently Asked Questions
              </h2>
            </div>

            <div className="rounded-xl border border-border/40 bg-card/50 overflow-hidden px-5">
              <FAQItem
                question="Is Open Sunsama as powerful as Motion?"
                answer="Yes, and in many ways more so. You get time blocking, calendar sync, priority management, and focus mode. Plus features Motion lacks: open source code, self-hosting option, full API access, and no AI forced on you."
                defaultOpen={true}
              />
              <FAQItem
                question="Can I still use AI features if I want them?"
                answer="Absolutely. Open Sunsama supports 24+ MCP tools for AI integration. The difference is YOU choose when to use AI assistance. It's available on demand, not forced by default."
              />
              <FAQItem
                question="How does calendar sync work?"
                answer="Bidirectional sync with Google Calendar, Microsoft Outlook, and iCloud Calendar. Your events appear in Open Sunsama, and time blocks you create sync back to your calendar."
              />
              <FAQItem
                question="What about task prioritization?"
                answer="Full P0-P3 priority system. Sort tasks by priority, drag them to reorder, and see priority badges at a glance. You decide what's important, not an algorithm."
              />
              <FAQItem
                question="Is it really free?"
                answer="Yes. Open Sunsama is free for individuals, forever. We're open source with an optional paid tier for teams. No trial that expires, no credit card required."
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-xl text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-6">
              <Shield className="h-7 w-7" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
              Take Back Control of Your Schedule
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              Start free—no AI surprises. Your time, your decisions.
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
