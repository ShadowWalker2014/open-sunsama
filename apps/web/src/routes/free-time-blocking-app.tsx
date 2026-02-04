import { Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  ArrowRight,
  Github,
  Check,
  X,
  DollarSign,
  ChevronDown,
  Timer,
  Layout,
  Bot,
  Code,
  Server,
  Command,
  Sparkles,
  Play,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { FAQSchema, SoftwareApplicationSchema } from "@/components/seo";
import { useState } from "react";

/**
 * "Why Pay?" Section - Price comparison with competitors
 */
function WhyPaySection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const competitors = [
    { name: "Sunsama", price: "$20", period: "/month", annual: "$240/year" },
    { name: "Motion", price: "$19", period: "/month", annual: "$228/year" },
    { name: "Reclaim", price: "$18", period: "/month", annual: "$216/year" },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Why Pay for Time Blocking?
          </h2>
          <p className="text-sm text-muted-foreground">
            Premium apps charge a premium. We charge nothing.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "grid grid-cols-1 md:grid-cols-4 gap-4 transition-all duration-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Competitor cards */}
          {competitors.map((comp, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/40 bg-card p-5 text-center"
              style={{ transitionDelay: `${i * 75}ms` }}
            >
              <div className="text-sm text-muted-foreground mb-2">{comp.name}</div>
              <div className="text-2xl font-bold text-muted-foreground/70 line-through mb-1">
                {comp.price}<span className="text-sm font-normal">{comp.period}</span>
              </div>
              <div className="text-xs text-muted-foreground">{comp.annual}</div>
            </div>
          ))}

          {/* Open Sunsama card */}
          <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] font-bold px-2 py-0.5 rounded-bl-lg">
              FREE
            </div>
            <div className="text-sm text-primary font-medium mb-2">Open Sunsama</div>
            <div className="text-2xl font-bold text-primary mb-1">
              $0<span className="text-sm font-normal">/forever</span>
            </div>
            <div className="text-xs text-primary/80">Save $216+/year</div>
          </div>
        </div>

        {/* Trust signals */}
        <div className="flex flex-wrap justify-center gap-6 mt-8 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>No trial period</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>No credit card</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>No catch</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Feature Showcase Section
 */
function FeaturesSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    {
      icon: Clock,
      title: "Visual Time Blocking",
      description: "Drag tasks onto your calendar to create time blocks. See your entire day at a glance. Resize blocks to adjust duration.",
    },
    {
      icon: Calendar,
      title: "Calendar Sync",
      description: "Bidirectional sync with Google Calendar, Outlook, and iCloud. Your events and time blocks stay perfectly in sync.",
    },
    {
      icon: Layout,
      title: "Kanban Task Management",
      description: "Organize tasks across Backlog, Today, and Completed columns. Drag-and-drop prioritization with P0-P3 levels.",
    },
    {
      icon: Timer,
      title: "Focus Mode with Timer",
      description: "Work on one task at a time with a built-in timer. Track actual time vs estimates. Complete focused deep work.",
    },
    {
      icon: Command,
      title: "Command Palette",
      description: "Access everything with Cmd+K. Search tasks, run commands, navigate views. Power user productivity.",
    },
    {
      icon: Bot,
      title: "24+ MCP Tools",
      description: "Let AI agents manage your schedule. Create tasks, schedule blocks, and automate workflows programmatically.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Every Feature You Need
          </h2>
          <p className="text-sm text-muted-foreground">
            Premium features. Zero premium pricing.
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((feature, i) => (
            <div
              key={i}
              className={cn(
                "group rounded-xl border border-border/40 bg-card p-5 hover:border-border/60 hover:bg-card/80 transition-all duration-300",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 75}ms` }}
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-semibold mb-2">{feature.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Visual Demo Section - Time blocking in action
 */
function VisualDemoSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            See Time Blocking in Action
          </h2>
          <p className="text-sm text-muted-foreground">
            Drag tasks to your calendar. Resize to adjust time. That's it.
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

              {/* App content */}
              <div className="p-4 md:p-6">
                <div className="flex gap-6">
                  {/* Task list side */}
                  <div className="w-1/3 space-y-3">
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                      Today's Tasks
                    </div>
                    
                    {/* Draggable task indicator */}
                    <div className="rounded-lg border border-dashed border-primary/50 bg-primary/5 p-3 space-y-2 relative">
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2">
                        <GripVertical className="h-4 w-4 text-primary/50" />
                      </div>
                      <div className="flex items-center gap-2 ml-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-xs font-medium">Write blog post</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground ml-3">
                        <Clock className="h-3 w-3" />
                        <span>1h 30m estimated</span>
                      </div>
                      <div className="text-[9px] text-primary ml-3">Drag to schedule</div>
                    </div>

                    <div className="rounded-lg border border-border/40 bg-card p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-xs font-medium">Team standup</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>15m</span>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border/40 bg-card p-3 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-green-500" />
                        <span className="text-xs font-medium">Review PRs</span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>45m</span>
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
                      <div className="w-10 shrink-0 space-y-[44px] text-[10px] text-muted-foreground pt-1">
                        <div>9:00</div>
                        <div>10:00</div>
                        <div>11:00</div>
                        <div>12:00</div>
                        <div>1:00</div>
                      </div>
                      {/* Time blocks */}
                      <div className="flex-1 space-y-2 relative">
                        <div className="h-8 rounded-lg bg-muted/50 border border-border/40 p-2 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                          <span className="text-xs text-muted-foreground">Morning planning</span>
                        </div>
                        
                        {/* Drop zone indicator */}
                        <div className="h-14 rounded-lg border-2 border-dashed border-primary/50 bg-primary/5 p-2 flex flex-col justify-between relative">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                            <span className="text-xs font-medium text-primary">Drop here to schedule</span>
                          </div>
                          <span className="text-[10px] text-primary">9:30 - 11:00</span>
                          <ArrowRight className="absolute -left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-pulse" />
                        </div>

                        <div className="h-6 rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-1.5 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                          <span className="text-[10px] font-medium">Team standup</span>
                        </div>
                        
                        <div className="h-10 rounded-lg bg-green-500/10 border border-green-500/20 p-2 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500" />
                          <span className="text-xs font-medium">Review PRs</span>
                        </div>

                        <div className="h-6 rounded-lg bg-muted/30 border border-border/40 p-1.5 flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                          <span className="text-[10px] text-muted-foreground">Lunch</span>
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
            { icon: GripVertical, label: "Drag & Drop" },
            { icon: Clock, label: "Time Blocking" },
            { icon: Calendar, label: "Calendar Sync" },
            { icon: Timer, label: "Focus Mode" },
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
 * Why It's Free Section
 */
function WhyFreeSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const reasons = [
    {
      icon: Code,
      title: "Open Source",
      description: "Community-supported development. Anyone can contribute, audit, or fork the code.",
    },
    {
      icon: DollarSign,
      title: "No VC Pressure",
      description: "We're not chasing growth metrics or trying to maximize revenue extraction.",
    },
    {
      icon: Github,
      title: "Built by Developers",
      description: "Made by developers who were tired of paying for basic productivity features.",
    },
    {
      icon: Server,
      title: "Self-Hostable",
      description: "Deploy on your own infrastructure for complete control over your data.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Why Is It Free?
          </h2>
          <p className="text-sm text-muted-foreground">
            No catch. No hidden fees. Here's how we make it work.
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
                "group rounded-xl border border-border/40 bg-card p-5 hover:border-border/60 transition-all duration-300",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <reason.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
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
 * Comparison Table Section
 */
function ComparisonSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    { name: "Monthly cost", sunsama: "$20", motion: "$19", reclaim: "$18", openSunsama: "$0", highlight: true },
    { name: "Annual cost", sunsama: "$240", motion: "$228", reclaim: "$216", openSunsama: "$0", highlight: true },
    { name: "Time blocking", sunsama: true, motion: true, reclaim: true, openSunsama: true },
    { name: "Calendar sync", sunsama: true, motion: true, reclaim: true, openSunsama: true },
    { name: "Focus mode", sunsama: true, motion: false, reclaim: false, openSunsama: true },
    { name: "Kanban board", sunsama: true, motion: false, reclaim: false, openSunsama: true },
    { name: "Open source", sunsama: false, motion: false, reclaim: false, openSunsama: true },
    { name: "Self-hostable", sunsama: false, motion: false, reclaim: false, openSunsama: true },
    { name: "API access", sunsama: "Enterprise", motion: false, reclaim: "Paid", openSunsama: "Free" },
    { name: "MCP/AI tools", sunsama: false, motion: false, reclaim: false, openSunsama: "24+ tools" },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            See How We Compare
          </h2>
          <p className="text-sm text-muted-foreground">
            Same features (and more). Fraction of the cost.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "rounded-xl border border-border/40 overflow-hidden shadow-lg transition-all duration-500 overflow-x-auto",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <table className="w-full text-[12px] min-w-[600px]">
            <thead>
              <tr className="border-b border-border/40 bg-muted/30">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Feature</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-center">Sunsama</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-center">Motion</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-center">Reclaim</th>
                <th className="px-3 py-3 font-medium text-center bg-primary/5">
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
                  <td className="px-4 py-2.5 text-muted-foreground">{feature.name}</td>
                  <td className="px-3 py-2.5 text-center">
                    {typeof feature.sunsama === "boolean" ? (
                      feature.sunsama ? (
                        <Check className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className={cn(feature.highlight && "line-through text-muted-foreground/70")}>
                        {feature.sunsama}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {typeof feature.motion === "boolean" ? (
                      feature.motion ? (
                        <Check className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className={cn(feature.highlight && "line-through text-muted-foreground/70")}>
                        {feature.motion}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {typeof feature.reclaim === "boolean" ? (
                      feature.reclaim ? (
                        <Check className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className={cn(feature.highlight && "line-through text-muted-foreground/70")}>
                        {feature.reclaim}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center bg-primary/5">
                    {typeof feature.openSunsama === "boolean" ? (
                      feature.openSunsama ? (
                        <Check className="h-3.5 w-3.5 text-primary mx-auto" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
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
          Pricing as of February 2026. All trademarks belong to their respective owners.
        </p>
      </div>
    </section>
  );
}

/**
 * FAQ Section
 */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Why is Open Sunsama free?",
      answer: "Open Sunsama is open-source software built by developers who believe basic productivity tools shouldn't cost $20/month. It's community-supported, not VC-funded, so we're not pressured to maximize revenue. The code is public on GitHub.",
    },
    {
      question: "Is there a catch?",
      answer: "No catch. No credit card required. No trial period that auto-converts to paid. No premium tier with the 'real' features. You get everything, forever, for free. If you want, you can self-host it on your own servers for complete control.",
    },
    {
      question: "How does it compare to Sunsama, Motion, and Reclaim?",
      answer: "You get the same core features: visual time blocking, calendar sync, task management. Plus extras like focus mode with a timer, 24+ MCP tools for AI automation, and the ability to self-host. The main difference? They charge $18-20/month. We charge $0.",
    },
    {
      question: "Can I upgrade later?",
      answer: "There's nothing to upgrade to—you already have access to everything. We're not holding features hostage behind a paywall. If you want to support the project, star us on GitHub or contribute to the codebase.",
    },
    {
      question: "Is my data safe?",
      answer: "Your data is encrypted and stored securely. We don't sell your data or use it for advertising. For maximum control, you can self-host Open Sunsama on your own infrastructure—you'll own 100% of your data.",
    },
    {
      question: "What calendars does it sync with?",
      answer: "Google Calendar, Microsoft Outlook, and iCloud. Bidirectional sync keeps your events and time blocks in perfect harmony. Changes in Open Sunsama appear in your calendar, and vice versa.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything you need to know about the free time blocking app.
          </p>
        </div>

        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/40 overflow-hidden bg-card"
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
 * Final CTA Section
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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-green-500/30 bg-green-500/10 text-[11px] font-medium text-green-600 dark:text-green-400">
          <DollarSign className="h-3 w-3" />
          Save $216+/year
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
          Stop Paying for Time Blocking
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          Create your free account in 30 seconds. 
          No credit card. No trial. Just free, forever.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="h-11 px-6 text-sm" asChild>
            <Link to="/register">
              Start Free Now
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-11 px-6 text-sm" asChild>
            <Link to="/">
              <Play className="h-4 w-4" />
              Watch Demo
            </Link>
          </Button>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          No credit card required • Free forever • Open source
        </p>
      </div>
    </section>
  );
}

/**
 * Free Time Blocking App Landing Page
 * High-conversion page targeting "free time blocking app" searches
 */
export default function FreeTimeBlockingAppPage() {
  useSEO(SEO_CONFIGS.freeTimeBlockingApp);
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  const faqItems = [
    {
      question: "Why is Open Sunsama free?",
      answer: "Open Sunsama is open-source software built by developers who believe basic productivity tools shouldn't cost $20/month. It's community-supported, not VC-funded, so we're not pressured to maximize revenue. The code is public on GitHub.",
    },
    {
      question: "Is there a catch?",
      answer: "No catch. No credit card required. No trial period that auto-converts to paid. No premium tier with the 'real' features. You get everything, forever, for free. If you want, you can self-host it on your own servers for complete control.",
    },
    {
      question: "How does it compare to Sunsama, Motion, and Reclaim?",
      answer: "You get the same core features: visual time blocking, calendar sync, task management. Plus extras like focus mode with a timer, 24+ MCP tools for AI automation, and the ability to self-host. The main difference? They charge $18-20/month. We charge $0.",
    },
    {
      question: "Can I upgrade later?",
      answer: "There's nothing to upgrade to—you already have access to everything. We're not holding features hostage behind a paywall. If you want to support the project, star us on GitHub or contribute to the codebase.",
    },
    {
      question: "Is my data safe?",
      answer: "Your data is encrypted and stored securely. We don't sell your data or use it for advertising. For maximum control, you can self-host Open Sunsama on your own infrastructure—you'll own 100% of your data.",
    },
    {
      question: "What calendars does it sync with?",
      answer: "Google Calendar, Microsoft Outlook, and iCloud. Bidirectional sync keeps your events and time blocks in perfect harmony. Changes in Open Sunsama appear in your calendar, and vice versa.",
    },
  ];

  return (
    <>
      <FAQSchema items={faqItems} />
      <SoftwareApplicationSchema
        name="Open Sunsama"
        description="Free time blocking app with visual calendar scheduling, focus mode, and task management. Alternative to Sunsama, Motion, and Reclaim. No subscription required."
        applicationCategory="ProductivityApplication"
        operatingSystem="Web, Windows, macOS, Linux"
        price="0"
        priceCurrency="USD"
        featureList={[
          "Visual time blocking",
          "Drag-and-drop scheduling",
          "Calendar sync (Google, Outlook, iCloud)",
          "Focus mode with timer",
          "Kanban task management",
          "Priority levels (P0-P3)",
          "Command palette (Cmd+K)",
          "24+ MCP tools for AI automation",
          "Desktop app with global hotkeys",
          "Open source and self-hostable",
        ]}
        url="https://opensunsama.com/free-time-blocking-app"
      />
      <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-green-500/[0.02] blur-[100px] rounded-full" />
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
              <Link to="/register">Start Free</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="relative">
        {/* Hero Section */}
        <section ref={heroRef} className="pt-16 pb-12 md:pt-24 md:pb-16">
          <div className="container px-4 mx-auto max-w-3xl text-center">
            {/* Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 mb-6 rounded-full border border-green-500/30 bg-green-500/10 text-[11px] font-semibold transition-all duration-300",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <Sparkles className="h-3 w-3 text-green-500" />
              <span className="text-green-600 dark:text-green-400">Free Forever</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              The Free{" "}
              <span className="text-primary">Time Blocking App</span>{" "}
              You've Been Looking For
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed transition-all duration-300 delay-100",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Sunsama costs <span className="line-through">$20/month</span>. 
              Motion costs <span className="line-through">$19/month</span>. 
              Reclaim costs <span className="line-through">$18/month</span>.{" "}
              <span className="text-primary font-semibold">Open Sunsama costs $0. Forever.</span>
            </p>

            {/* Trust stat */}
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-lg border border-green-500/20 bg-green-500/5 text-sm transition-all duration-300 delay-125",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-muted-foreground">
                Saves you <span className="font-semibold text-green-600 dark:text-green-400">$216+/year</span> vs paid alternatives
              </span>
            </div>

            {/* CTAs */}
            <div
              className={cn(
                "flex flex-col sm:flex-row gap-3 justify-center transition-all duration-300 delay-150",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <Button size="lg" className="h-11 px-6 text-sm" asChild>
                <Link to="/register">
                  Start Free Now
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6 text-sm" asChild>
                <Link to="/">
                  <Play className="h-4 w-4" />
                  Watch Demo
                </Link>
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
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>No trial period</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Open source</span>
              </div>
            </div>
          </div>
        </section>

        {/* Why Pay Section */}
        <WhyPaySection />

        {/* Features Section */}
        <FeaturesSection />

        {/* Visual Demo Section */}
        <VisualDemoSection />

        {/* Why Free Section */}
        <WhyFreeSection />

        {/* Comparison Section */}
        <ComparisonSection />

        {/* FAQ Section */}
        <FAQSection />

        {/* Final CTA Section */}
        <FinalCTASection />
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
              <Link to="/" className="hover:text-foreground transition-colors">
                Home
              </Link>
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
