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
  Lock,
  Unlock,
  Server,
  Code2,
  Focus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { Breadcrumbs, FAQSchema } from "@/components/seo";

/**
 * Reclaim AI Alternative Landing Page
 * High-converting Google Ads landing page targeting "reclaim ai alternative" searches
 */

function PriceComparisonCard() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const plans = [
    { name: "Starter", reclaim: "$10/month", us: "Free", savings: "$120/year" },
    { name: "Pro", reclaim: "$18/month", us: "Free", savings: "$216/year" },
    { name: "Team", reclaim: "$22/month", us: "Free", savings: "$264/year" },
    { name: "Self-hosted", reclaim: "Not available", us: "Free", highlight: true },
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
            <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
            <th className="px-4 py-3 font-medium text-muted-foreground text-center">Reclaim AI</th>
            <th className="px-4 py-3 font-medium text-primary text-center">Open Sunsama</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan, i) => (
            <tr key={i} className={cn(
              "border-b border-border/40 last:border-0",
              plan.highlight && "bg-primary/5"
            )}>
              <td className="px-4 py-3 text-muted-foreground">{plan.name}</td>
              <td className="px-4 py-3 text-center">
                <span className="text-muted-foreground">{plan.reclaim}</span>
              </td>
              <td className="px-4 py-3 text-center">
                <span className="font-medium text-primary">{plan.us}</span>
                {plan.savings && (
                  <span className="ml-2 text-[10px] text-primary/70">Save {plan.savings}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BenefitCard({
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
        "p-5 rounded-xl border border-border/40 bg-card/50 transition-all duration-300 hover:border-border/60",
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

function ComparisonTable() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    { name: "Time blocking", reclaim: "AI-managed", us: "Manual control", highlight: true },
    { name: "Calendar sync", reclaim: true, us: true },
    { name: "Smart scheduling", reclaim: "AI-only", us: "Manual + AI tools", highlight: true },
    { name: "Focus time protection", reclaim: true, us: "Focus Mode" },
    { name: "Habits/Routines", reclaim: true, us: "Coming soon" },
    { name: "Task prioritization", reclaim: true, us: true },
    { name: "Open source", reclaim: false, us: true, highlight: true },
    { name: "Self-hosted option", reclaim: false, us: true, highlight: true },
    { name: "Full API access", reclaim: "Limited", us: "Full MCP/REST" },
    { name: "Price", reclaim: "$10-18/mo", us: "Free", highlight: true },
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
            <th className="px-4 py-3 font-medium text-muted-foreground text-center">Reclaim</th>
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
                {typeof feature.reclaim === "boolean" ? (
                  feature.reclaim ? (
                    <Check className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                  )
                ) : (
                  <span className="text-muted-foreground">{feature.reclaim}</span>
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
          <span className="ml-2 text-[10px] text-muted-foreground">Your Schedule - No AI Surprises</span>
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
                      <p className="text-xs font-medium">Deep work: API development</p>
                      <p className="text-[10px] text-muted-foreground">9:00 - 11:00 AM</p>
                    </div>
                    <MousePointer className="h-3.5 w-3.5 text-primary animate-pulse" />
                  </div>
                </div>

                {/* Block 2 */}
                <div className="group p-3 rounded-lg border border-border/40 bg-card/50 cursor-move hover:border-border/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Review PRs</p>
                      <p className="text-[10px] text-muted-foreground">11:00 AM - 12:00 PM</p>
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
                      <p className="text-xs font-medium">Weekly planning</p>
                      <p className="text-[10px] text-muted-foreground">1:00 - 1:30 PM</p>
                    </div>
                  </div>
                </div>

                {/* Block 4 - Focus mode highlight */}
                <div className="group p-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 cursor-move hover:border-emerald-500/60 transition-colors">
                  <div className="flex items-center gap-2">
                    <Focus className="h-3.5 w-3.5 text-emerald-500/50" />
                    <div className="flex-1">
                      <p className="text-xs font-medium">Focus Mode: Write documentation</p>
                      <p className="text-[10px] text-muted-foreground">1:30 - 3:00 PM</p>
                    </div>
                    <Timer className="h-3.5 w-3.5 text-emerald-500" />
                  </div>
                </div>
              </div>

              {/* Manual control indicator */}
              <div className="mt-4 flex items-center justify-center gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
                <Hand className="h-4 w-4 text-primary" />
                <span className="text-xs font-medium text-primary">Drag to reschedule - no AI rescheduling</span>
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

export default function ReclaimAlternativePage() {
  useSEO(SEO_CONFIGS.alternatives.reclaim);

  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  const faqItems = [
    {
      question: "Is Open Sunsama as powerful as Reclaim?",
      answer: "For manual time blocking, yes. You get drag-and-drop scheduling, calendar sync, focus mode, and priority management. The key difference: Reclaim auto-schedules using AI, while Open Sunsama puts you in control. You can still use AI tools via MCP integration when you want them.",
    },
    {
      question: "Can I still auto-schedule if I want to?",
      answer: "Open Sunsama doesn't auto-schedule by default, which many users prefer. However, you can build your own automations using our full API and 24+ MCP tools. This gives you AI scheduling on YOUR terms, not the app's.",
    },
    {
      question: "Does it sync both ways with my calendar?",
      answer: "Yes! Bidirectional sync with Google Calendar, Microsoft Outlook, and iCloud. Your existing events show in Open Sunsama, and time blocks you create sync back to your calendar.",
    },
    {
      question: "What about habits and routines?",
      answer: "Habits and recurring tasks are coming soon. In the meantime, you can create recurring time blocks manually or via the API. Many users find this gives them more flexibility than Reclaim's automated habits.",
    },
    {
      question: "Is it really free forever?",
      answer: "Yes. Open Sunsama is free for individuals, forever. We're open source with an optional paid tier for teams. No trial that expires, no credit card required, no feature gates that suddenly appear.",
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
              <Link to="/blog">Blog</Link>
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
              { label: "Reclaim AI" },
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
              <Unlock className="h-3 w-3 text-primary" />
              <span className="text-primary">No AI Surprises</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              The <span className="text-primary">Free</span> Reclaim Alternative
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-[15px] text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed transition-all duration-300 delay-100",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Get powerful time blocking without the $18/month AI subscription. 
              You control your schedule. Open source and{" "}
              <span className="text-primary font-medium">free forever.</span>
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
                  Start Free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="h-9 px-4 text-[13px]" asChild>
                <a href="#comparison">
                  Compare Features
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

        {/* Price Comparison Section */}
        <section className="py-16 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Stop Paying for Time Blocking
              </h2>
              <p className="text-sm text-muted-foreground">
                Reclaim charges $10-18/month. Open Sunsama is free.
              </p>
            </div>

            <PriceComparisonCard />
          </div>
        </section>

        {/* What You Get Section */}
        <section className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                What You Get Without AI Lock-in
              </h2>
              <p className="text-sm text-muted-foreground">
                All the time-blocking power, none of the AI rescheduling surprises.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <BenefitCard
                icon={Hand}
                title="Manual Time Blocking"
                description="You're in control. Drag tasks to your calendar, resize blocks for duration. No AI moving your schedule around."
                delay={0}
              />
              <BenefitCard
                icon={RefreshCw}
                title="Calendar Sync"
                description="Bidirectional sync with Google Calendar, Outlook, and iCloud. Events and blocks stay in harmony."
                delay={50}
              />
              <BenefitCard
                icon={Focus}
                title="Focus Mode"
                description="Deep work made simple. Work on one task at a time with a built-in timer. Track actual vs estimated time."
                delay={100}
              />
              <BenefitCard
                icon={Code2}
                title="Full API/MCP Access"
                description="24+ MCP tools for YOUR automations. Build your own integrations. No locked ecosystem."
                delay={150}
              />
              <BenefitCard
                icon={Unlock}
                title="No AI Rescheduling"
                description="Reclaim auto-reschedules your day. Open Sunsama respects your decisions. AI assists when YOU ask."
                delay={200}
              />
              <BenefitCard
                icon={Server}
                title="Self-Hosted Option"
                description="Run on your own infrastructure. Full data ownership. No vendor lock-in ever."
                delay={250}
              />
            </div>
          </div>
        </section>

        {/* Visual Demo Section */}
        <section className="py-16 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Clean Time Blocking Interface
              </h2>
              <p className="text-sm text-muted-foreground">
                Drag and drop your tasks. Resize blocks. Enter focus mode for deep work.
              </p>
            </div>

            <VisualDemo />
          </div>
        </section>

        {/* Comparison Table Section */}
        <section id="comparison" className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Reclaim vs Open Sunsama
              </h2>
              <p className="text-sm text-muted-foreground">
                See how they compare feature by feature.
              </p>
            </div>

            <ComparisonTable />
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
                question="Is Open Sunsama as powerful as Reclaim?"
                answer="For manual time blocking, yes. You get drag-and-drop scheduling, calendar sync, focus mode, and priority management. The key difference: Reclaim auto-schedules using AI, while Open Sunsama puts you in control. You can still use AI tools via MCP integration when you want them."
                defaultOpen={true}
              />
              <FAQItem
                question="Can I still auto-schedule if I want to?"
                answer="Open Sunsama doesn't auto-schedule by default, which many users prefer. However, you can build your own automations using our full API and 24+ MCP tools. This gives you AI scheduling on YOUR terms, not the app's."
              />
              <FAQItem
                question="Does it sync both ways with my calendar?"
                answer="Yes! Bidirectional sync with Google Calendar, Microsoft Outlook, and iCloud. Your existing events show in Open Sunsama, and time blocks you create sync back to your calendar."
              />
              <FAQItem
                question="What about habits and routines?"
                answer="Habits and recurring tasks are coming soon. In the meantime, you can create recurring time blocks manually or via the API. Many users find this gives them more flexibility than Reclaim's automated habits."
              />
              <FAQItem
                question="Is it really free forever?"
                answer="Yes. Open Sunsama is free for individuals, forever. We're open source with an optional paid tier for teams. No trial that expires, no credit card required, no feature gates that suddenly appear."
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-xl text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-6">
              <DollarSign className="h-7 w-7" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
              Stop Paying for Time Blocking
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              Free forever. No AI required. Your schedule, your control.
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
