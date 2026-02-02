import { Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Calendar,
  ArrowRight,
  Github,
  Check,
  X,
  Clock,
  ListTodo,
  CalendarClock,
  Timer,
  ChevronDown,
  AlertCircle,
  Target,
  Layout,
  Focus,
  Sparkles,
  GripVertical,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Breadcrumbs } from "@/components/seo";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { FAQSchema } from "@/components/seo";

/**
 * Todoist Alternative Landing Page
 * High-converting page targeting "todoist time blocking", "todoist calendar integration"
 * For users who outgrow Todoist's basic list approach
 */

function PainPointCard({
  icon: Icon,
  pain,
  solution,
  delay = 0,
}: {
  icon: React.ElementType;
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

function SideBySideVisual() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const tasks = [
    { title: "Review project specs", priority: "P1", estimate: "2h" },
    { title: "Write API documentation", priority: "P0", estimate: "3h" },
    { title: "Team sync meeting", priority: "P2", estimate: "30m" },
    { title: "Code review PRs", priority: "P1", estimate: "1h" },
  ];

  return (
    <div
      ref={ref}
      className={cn(
        "grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all duration-500",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      )}
    >
      {/* Todoist-style list */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-1 shadow-lg">
        <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-muted/20">
            <ListTodo className="h-4 w-4 text-red-500" />
            <span className="text-xs font-medium">Todoist-style List</span>
          </div>
          <div className="p-4 space-y-2">
            {tasks.map((task, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
              >
                <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                <span className="text-sm flex-1">{task.title}</span>
                <span className={cn(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded",
                  task.priority === "P0" && "bg-red-500/20 text-red-500",
                  task.priority === "P1" && "bg-orange-500/20 text-orange-500",
                  task.priority === "P2" && "bg-blue-500/20 text-blue-500"
                )}>
                  {task.priority}
                </span>
              </div>
            ))}
            <div className="pt-3 text-center">
              <div className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5" />
                <span>Tasks have no time slots</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Arrow between */}
      <div className="hidden lg:flex items-center justify-center absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground shadow-lg">
          <ChevronRight className="h-5 w-5" />
        </div>
      </div>

      {/* Open Sunsama calendar view */}
      <div className="rounded-xl border border-primary/40 bg-card/50 p-1 shadow-lg ring-2 ring-primary/20">
        <div className="rounded-lg border border-border/40 bg-background overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border/40 bg-primary/5">
            <CalendarClock className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-primary">Open Sunsama - Scheduled</span>
          </div>
          <div className="p-4">
            <div className="flex gap-3">
              {/* Time labels */}
              <div className="w-12 shrink-0 space-y-[34px] text-[10px] text-muted-foreground pt-1">
                <div>9:00</div>
                <div>11:00</div>
                <div>1:00</div>
                <div>2:00</div>
              </div>
              {/* Time blocks */}
              <div className="flex-1 space-y-2">
                <div className="h-12 rounded-lg bg-orange-500/10 border border-orange-500/30 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-orange-500/50" />
                    <span className="text-xs font-medium">Review project specs</span>
                  </div>
                  <span className="text-[10px] text-orange-500">9-11 AM</span>
                </div>
                <div className="h-14 rounded-lg bg-red-500/10 border border-red-500/30 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-red-500/50" />
                    <span className="text-xs font-medium">Write API documentation</span>
                  </div>
                  <span className="text-[10px] text-red-500">11 AM-2 PM</span>
                </div>
                <div className="h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-blue-500/50" />
                    <span className="text-xs font-medium">Team sync meeting</span>
                  </div>
                  <span className="text-[10px] text-blue-500">2-2:30 PM</span>
                </div>
                <div className="h-10 rounded-lg bg-orange-500/10 border border-orange-500/30 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GripVertical className="h-3 w-3 text-orange-500/50" />
                    <span className="text-xs font-medium">Code review PRs</span>
                  </div>
                  <span className="text-[10px] text-orange-500">2:30-3:30 PM</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ComparisonTable() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    { name: "Task lists", todoist: true, us: "Kanban board", highlight: false },
    { name: "Priorities", todoist: "P1-P4", us: "P0-P3", highlight: false },
    { name: "Time blocking", todoist: "Plugin required", us: "Native", highlight: true },
    { name: "Visual calendar", todoist: "Limited", us: true, highlight: true },
    { name: "Focus mode", todoist: false, us: true, highlight: true },
    { name: "Time tracking", todoist: false, us: "Built-in timer", highlight: true },
    { name: "Calendar sync", todoist: "Add-on", us: true },
    { name: "Price", todoist: "$0-6/month", us: "Free", highlight: true },
    { name: "Open source", todoist: false, us: true },
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
            <th className="px-4 py-3 font-medium text-muted-foreground text-center">Todoist</th>
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
                {typeof feature.todoist === "boolean" ? (
                  feature.todoist ? (
                    <Check className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                  ) : (
                    <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                  )
                ) : (
                  <span className="text-muted-foreground">{feature.todoist}</span>
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

function UpgradePathSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const steps = [
    {
      icon: ListTodo,
      title: "Task Lists",
      description: "Start with simple todos",
      status: "todoist",
    },
    {
      icon: Layout,
      title: "Prioritized Kanban",
      description: "Organize by importance",
      status: "upgrade",
    },
    {
      icon: CalendarClock,
      title: "Scheduled Blocks",
      description: "Give tasks a time slot",
      status: "upgrade",
    },
    {
      icon: Focus,
      title: "Focused Execution",
      description: "One task, full attention",
      status: "upgrade",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-lg font-semibold tracking-tight mb-2">
            The Natural Upgrade Path
          </h2>
          <p className="text-sm text-muted-foreground">
            From task lists to time-blocked productivity
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "relative transition-all duration-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Progress line */}
          <div className="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-muted-foreground/20 via-primary/50 to-primary" />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {steps.map((step, i) => (
              <div
                key={i}
                className={cn(
                  "relative text-center",
                  inView ? "opacity-100" : "opacity-0"
                )}
                style={{ transitionDelay: `${i * 150}ms` }}
              >
                <div className={cn(
                  "flex items-center justify-center h-12 w-12 rounded-xl mx-auto mb-3 transition-all",
                  step.status === "todoist" 
                    ? "bg-muted text-muted-foreground" 
                    : "bg-primary/10 text-primary ring-2 ring-primary/20"
                )}>
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-semibold mb-1">{step.title}</h3>
                <p className="text-[11px] text-muted-foreground">{step.description}</p>
                {step.status === "todoist" && (
                  <span className="inline-block mt-2 text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded">
                    Where you are
                  </span>
                )}
                {i === steps.length - 1 && (
                  <span className="inline-block mt-2 text-[10px] text-primary bg-primary/10 px-2 py-0.5 rounded">
                    Where you're going
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
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

export default function TodoistAlternativePage() {
  useSEO(SEO_CONFIGS.alternatives.todoist);

  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  const faqItems = [
    {
      question: "Is this like Todoist with a calendar?",
      answer: "Yes, but better integrated. Instead of a separate calendar view or plugin, Open Sunsama was designed from the ground up with time blocking as a core feature. Your kanban board and calendar timeline work together seamlessly.",
    },
    {
      question: "Can I import my tasks from Todoist?",
      answer: "We're working on a direct Todoist import tool. In the meantime, you can export your Todoist tasks to CSV and manually add them. The familiar interface makes the transition smooth.",
    },
    {
      question: "What's different about the time blocking?",
      answer: "Unlike Todoist's calendar integrations which are add-ons, Open Sunsama's time blocking is native. Drag any task to your timeline, resize to adjust duration, and the system tracks estimated vs actual time automatically.",
    },
    {
      question: "Is it really free like Todoist's free tier?",
      answer: "Yes, completely free for individuals. Unlike Todoist Pro, you get all features including calendar sync, time blocking, and focus mode at no cost. We're open source with an optional paid tier for teams.",
    },
    {
      question: "Does it have priorities like Todoist?",
      answer: "Yes! We use P0-P3 priorities (P0 being most urgent). You can filter and sort by priority, and priority badges are visible on both the kanban board and calendar timeline.",
    },
    {
      question: "What about recurring tasks?",
      answer: "Recurring task support is on our roadmap. For now, you can manually create repeating tasks or use our MCP integration to automate task creation through AI assistants.",
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
              { label: "Todoist" },
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
              <CalendarClock className="h-3 w-3 text-primary" />
              <span className="text-primary">Todoist + Time Blocking</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Todoist Lists, But With{" "}
              <span className="text-primary">Time Blocking</span> Built In
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-[15px] text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed transition-all duration-300 delay-100",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Love Todoist's simplicity but need time blocking? 
              Open Sunsama combines task lists with a visual calendar. 
              <span className="text-primary font-medium"> Upgrade your workflow for free.</span>
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
                <a href="#time-blocking">
                  See Time Blocking
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

        {/* When Todoist Isn't Enough Section */}
        <section className="py-16 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                When Todoist Isn't Enough
              </h2>
              <p className="text-sm text-muted-foreground">
                Sound familiar? Here's how Open Sunsama solves it.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PainPointCard
                icon={ListTodo}
                pain="Tasks pile up because nothing has a time slot"
                solution="Drag any task to your calendar and give it a scheduled time block. See your actual capacity."
                delay={0}
              />
              <PainPointCard
                icon={Calendar}
                pain="Calendar integrations are clunky add-ons"
                solution="Calendar is built-in, not bolted on. Bidirectional sync with Google, Outlook, and iCloud."
                delay={100}
              />
              <PainPointCard
                icon={Clock}
                pain="No way to see how long things actually take"
                solution="Built-in focus timer tracks actual vs estimated time. Learn your real capacity."
                delay={200}
              />
            </div>
          </div>
        </section>

        {/* Side-by-Side Visual Section */}
        <section id="time-blocking" className="py-16 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-4xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Same Tasks. Now Scheduled.
              </h2>
              <p className="text-sm text-muted-foreground">
                Your task list transforms into a time-blocked day.
              </p>
            </div>

            <div className="relative">
              <SideBySideVisual />
            </div>

            <p className="text-center text-[11px] text-muted-foreground mt-6">
              Drag tasks to your calendar to create time blocks. Resize to adjust duration.
            </p>
          </div>
        </section>

        {/* Feature Comparison Section */}
        <section className="py-16 border-t border-border/40 bg-muted/10">
          <div className="container px-4 mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <h2 className="text-lg font-semibold tracking-tight mb-2">
                Todoist vs Open Sunsama
              </h2>
              <p className="text-sm text-muted-foreground">
                See what you gain with native time blocking.
              </p>
            </div>

            <ComparisonTable />
          </div>
        </section>

        {/* Upgrade Path Section */}
        <UpgradePathSection />

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
                question="Is this like Todoist with a calendar?"
                answer="Yes, but better integrated. Instead of a separate calendar view or plugin, Open Sunsama was designed from the ground up with time blocking as a core feature. Your kanban board and calendar timeline work together seamlessly."
                defaultOpen={true}
              />
              <FAQItem
                question="Can I import my tasks from Todoist?"
                answer="We're working on a direct Todoist import tool. In the meantime, you can export your Todoist tasks to CSV and manually add them. The familiar interface makes the transition smooth."
              />
              <FAQItem
                question="What's different about the time blocking?"
                answer="Unlike Todoist's calendar integrations which are add-ons, Open Sunsama's time blocking is native. Drag any task to your timeline, resize to adjust duration, and the system tracks estimated vs actual time automatically."
              />
              <FAQItem
                question="Is it really free like Todoist's free tier?"
                answer="Yes, completely free for individuals. Unlike Todoist Pro, you get all features including calendar sync, time blocking, and focus mode at no cost. We're open source with an optional paid tier for teams."
              />
              <FAQItem
                question="Does it have priorities like Todoist?"
                answer="Yes! We use P0-P3 priorities (P0 being most urgent). You can filter and sort by priority, and priority badges are visible on both the kanban board and calendar timeline."
              />
              <FAQItem
                question="What about recurring tasks?"
                answer="Recurring task support is on our roadmap. For now, you can manually create repeating tasks or use our MCP integration to automate task creation through AI assistants."
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="py-20 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-xl text-center">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-6">
              <Target className="h-7 w-7" />
            </div>
            <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-3">
              Ready to Give Your Tasks a Time Slot?
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
              Upgrade from Todoist lists to scheduled time blocks. 
              <span className="text-primary font-medium"> Free forever. No credit card.</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <Button size="sm" className="h-10 px-5 text-[13px]" asChild>
                <Link to="/register">
                  Start Free
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
