import { Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  ArrowRight,
  Github,
  Check,
  X,
  ChevronDown,
  Timer,
  Layout,
  Brain,
  Eye,
  Focus,
  ListTodo,
  Sparkles,
  Heart,
  Zap,
  Target,
  Pause,
  MousePointerClick,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { FAQSchema, SoftwareApplicationSchema } from "@/components/seo";
import { useState } from "react";

/**
 * "We Understand" Section - Pain points and empathy
 */
function WeUnderstandSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const painPoints = [
    {
      icon: ListTodo,
      pain: "Too many lists, too much overwhelm",
      description: "Traditional planners pile on tasks until your brain shuts down. You end up paralyzed, not productive.",
      solution: "Visual kanban with P0-P3 priorities. See only what matters. Everything else fades away.",
    },
    {
      icon: Clock,
      pain: "Time blindness makes planning feel impossible",
      description: "Hours slip by unnoticed. You think you have 'plenty of time' until suddenly you don't.",
      solution: "Visual time blocking shows exactly how long things take. Your schedule becomes tangible, not abstract.",
    },
    {
      icon: Zap,
      pain: "Context switching kills your momentum",
      description: "Every notification, every new task destroys your focus. Getting back takes forever—if you can at all.",
      solution: "Focus mode shows ONE task with a timer. No distractions. When hyperfocus hits, ride the wave.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 rounded-full border border-amber-500/30 bg-amber-500/10 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <Heart className="h-3 w-3" />
            We get it
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Planning apps fail ADHD minds because...
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            You're not lazy or broken. Your brain just works differently. 
            Most tools are built for neurotypical brains.
          </p>
        </div>

        <div
          ref={ref}
          className="space-y-4"
        >
          {painPoints.map((point, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border border-border/40 bg-card overflow-hidden transition-all duration-500",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Pain side */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10">
                        <point.icon className="h-4 w-4 text-red-500" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-red-600 dark:text-red-400">
                        {point.pain}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-12">
                      {point.description}
                    </p>
                  </div>

                  {/* Arrow */}
                  <div className="hidden md:flex items-center justify-center px-4">
                    <ArrowRight className="h-5 w-5 text-primary" />
                  </div>

                  {/* Solution side */}
                  <div className="flex-1 md:pl-0 pl-12 md:border-l md:border-border/40 md:pl-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="h-4 w-4 text-primary" />
                      <span className="text-[13px] font-medium text-primary">How we help</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {point.solution}
                    </p>
                  </div>
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
 * Visual Demo - ADHD-Optimized Features
 */
function VisualDemoSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Designed for How Your Brain Works
          </h2>
          <p className="text-sm text-muted-foreground">
            Clean. Visual. One thing at a time.
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
                <span className="ml-3 text-[10px] text-muted-foreground">Open Sunsama - Focus Mode</span>
              </div>

              {/* Focus Mode Demo */}
              <div className="p-6 md:p-10">
                <div className="max-w-md mx-auto text-center">
                  {/* Focus indicator */}
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/10 text-[11px] font-medium text-primary">
                    <Focus className="h-3 w-3" />
                    Focus Mode Active
                  </div>

                  {/* Current task */}
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-6 mb-6">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <div className="h-3 w-3 rounded-full bg-primary animate-pulse" />
                      <span className="text-[11px] font-medium text-primary uppercase tracking-wider">
                        Current Task
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Write API documentation</h3>
                    <p className="text-xs text-muted-foreground mb-4">
                      Focus on the authentication section first
                    </p>
                    
                    {/* Timer */}
                    <div className="inline-flex items-center gap-3 px-4 py-2 rounded-lg bg-background border border-border/40">
                      <Timer className="h-4 w-4 text-primary" />
                      <span className="text-2xl font-mono font-bold">23:45</span>
                      <Button size="sm" variant="ghost" className="h-7 px-2">
                        <Pause className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Check className="h-3.5 w-3.5 text-green-500" />
                      <span>2 tasks done</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Target className="h-3.5 w-3.5 text-primary" />
                      <span>3 remaining</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature callouts */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {[
            { icon: Eye, label: "One task at a time" },
            { icon: Timer, label: "Built-in timer" },
            { icon: Brain, label: "Reduces overwhelm" },
            { icon: Focus, label: "Harness hyperfocus" },
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
 * Features That Help Section
 */
function FeaturesSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    {
      icon: Eye,
      title: "Visual Time Blocking",
      description: "See your day as colored blocks on a timeline. Time blindness becomes time awareness. Know exactly when things start, end, and how long you actually have.",
    },
    {
      icon: Focus,
      title: "One-Task Focus Mode",
      description: "Work on ONE task with a timer. No sidebar. No notifications. Just you and the work. When hyperfocus kicks in, everything else disappears.",
    },
    {
      icon: Target,
      title: "P0-P3 Priority System",
      description: "Cut through decision paralysis. P0 is do-or-die, P3 can wait. Four levels. That's it. No complex matrices or endless categories.",
    },
    {
      icon: Calendar,
      title: "Daily Planning Ritual",
      description: "Start each day with a 5-minute planning session. Drag tasks to time blocks. Set realistic goals. Close the loop with an evening review.",
    },
    {
      icon: MousePointerClick,
      title: "Drag-and-Drop Everything",
      description: "No menus to navigate. No forms to fill. Just drag tasks to schedule them. Resize to adjust time. Your brain stays in flow, not in settings.",
    },
    {
      icon: Layout,
      title: "Clean, Calm Interface",
      description: "No visual clutter. No gamification tricks. No 47 features fighting for attention. Just a clean canvas that lets your brain breathe.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Features That Actually Help
          </h2>
          <p className="text-sm text-muted-foreground">
            Every feature is designed to reduce friction, not add complexity.
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
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
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <feature.icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-[15px] font-semibold mb-1.5">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {feature.description}
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
 * Comparison Table - vs ADHD Apps
 */
function ComparisonSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    { name: "Price", tiimo: "$15/month", structured: "$12/month", openSunsama: "Free forever", highlight: true },
    { name: "Visual time blocking", tiimo: true, structured: true, openSunsama: true },
    { name: "Focus mode with timer", tiimo: false, structured: false, openSunsama: true, highlight: true },
    { name: "Full task management", tiimo: false, structured: false, openSunsama: true },
    { name: "Calendar sync (Google, Outlook)", tiimo: false, structured: "Limited", openSunsama: true },
    { name: "Kanban board", tiimo: false, structured: false, openSunsama: true },
    { name: "Desktop app", tiimo: false, structured: true, openSunsama: true },
    { name: "Keyboard shortcuts", tiimo: false, structured: false, openSunsama: true },
    { name: "Open source", tiimo: false, structured: false, openSunsama: true },
  ];

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            How We Compare to ADHD Apps
          </h2>
          <p className="text-sm text-muted-foreground">
            Same visual approach. More features. Zero cost.
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
                <th className="px-3 py-3 font-medium text-muted-foreground text-center">Tiimo</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-center">Structured</th>
                <th className="px-3 py-3 font-medium text-center">
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
                  <td className="px-3 py-3 text-center">
                    {typeof feature.tiimo === "boolean" ? (
                      feature.tiimo ? (
                        <Check className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className={cn(
                        feature.highlight ? "text-muted-foreground line-through" : "text-muted-foreground"
                      )}>
                        {feature.tiimo}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {typeof feature.structured === "boolean" ? (
                      feature.structured ? (
                        <Check className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className="text-muted-foreground text-[11px]">{feature.structured}</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
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
          Pricing as of February 2026. All trademarks belong to their respective owners.
        </p>
      </div>
    </section>
  );
}

/**
 * Testimonial Section
 */
function TestimonialSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-2xl">
        <div
          ref={ref}
          className={cn(
            "text-center transition-all duration-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-6">
            From the ADHD Community
          </div>

          <div className="rounded-xl border border-border/40 bg-card p-6 md:p-8">
            <div className="flex items-center justify-center gap-1 mb-4">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="h-4 w-4 text-amber-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
              ))}
            </div>

            <blockquote className="text-base md:text-lg font-medium mb-4 leading-relaxed">
              "As someone with ADHD, I've tried dozens of apps. This is the first one that doesn't overwhelm me. The focus mode is a game-changer—when I'm in the zone, nothing else exists."
            </blockquote>

            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <span>Developer with ADHD</span>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap justify-center gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">5+ min</div>
              <div className="text-xs text-muted-foreground">Avg. focus session</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Calm</div>
              <div className="text-xs text-muted-foreground">Interface design</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">Zero</div>
              <div className="text-xs text-muted-foreground">Distracting features</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * FAQ Section - ADHD Specific
 */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Is it good for time blindness?",
      answer: "Yes! Visual time blocking is at the core of Open Sunsama. Your day becomes colored blocks on a timeline, not abstract hours in your head. You can literally see when tasks overlap, how much time you actually have, and when you're overcommitting. Many users say it's the first time they truly 'see' their day.",
    },
    {
      question: "Can it help with task initiation?",
      answer: "The Focus Mode is specifically designed for this. Instead of staring at a massive task list, you see ONE task with a timer. Start the timer, and the task begins. It removes the paralysis of 'where do I start?' because the answer is always: just this one thing, just this one timer.",
    },
    {
      question: "Is the interface overwhelming?",
      answer: "No—we designed it to be the opposite. No cluttered sidebars, no gamification points, no social features, no badges to collect. Just a clean canvas with your tasks and your calendar. Every pixel has a purpose. If something doesn't help you focus, it doesn't exist.",
    },
    {
      question: "Can I use it with ADHD medication reminders?",
      answer: "While we don't have built-in medication tracking (yet), you can schedule recurring time blocks for medication times. Many users create a morning 'Meds + Planning' block that starts their day consistently.",
    },
    {
      question: "What if I hyperfocus and lose track of everything else?",
      answer: "Focus Mode includes a timer that helps you stay aware of passing time. You can set it to gently remind you when a session ends. It's not about limiting your hyperfocus—it's about giving you awareness so you can decide whether to continue or switch.",
    },
    {
      question: "Is it free? What's the catch?",
      answer: "Completely free, no catch. Open Sunsama is open-source software built by people who understand ADHD struggles. No credit card required, no premium tiers, no 'unlock this feature for $9.99' walls. The code is public on GitHub.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Questions from ADHD Minds
          </h2>
          <p className="text-sm text-muted-foreground">
            Real concerns, honest answers.
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
        <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/10 text-[11px] font-medium text-primary">
          <Brain className="h-3 w-3" />
          Built for ADHD minds
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
          Your ADHD brain deserves better tools
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          Stop fighting against apps designed for neurotypical brains.
          Start working with a planner that gets how you think.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="h-11 px-6 text-sm" asChild>
            <Link to="/register">
              Start Free Now
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
          No credit card required • No overwhelm • Free forever
        </p>
      </div>
    </section>
  );
}

/**
 * Best Daily Planner for ADHD Landing Page
 * High-conversion page targeting ADHD-specific searches
 */
export default function ForADHDPage() {
  useSEO(SEO_CONFIGS.forAudiences.adhd);
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  const faqItems = [
    {
      question: "Is it good for time blindness?",
      answer: "Yes! Visual time blocking is at the core of Open Sunsama. Your day becomes colored blocks on a timeline, not abstract hours in your head. You can literally see when tasks overlap, how much time you actually have, and when you're overcommitting. Many users say it's the first time they truly 'see' their day.",
    },
    {
      question: "Can it help with task initiation?",
      answer: "The Focus Mode is specifically designed for this. Instead of staring at a massive task list, you see ONE task with a timer. Start the timer, and the task begins. It removes the paralysis of 'where do I start?' because the answer is always: just this one thing, just this one timer.",
    },
    {
      question: "Is the interface overwhelming?",
      answer: "No—we designed it to be the opposite. No cluttered sidebars, no gamification points, no social features, no badges to collect. Just a clean canvas with your tasks and your calendar. Every pixel has a purpose. If something doesn't help you focus, it doesn't exist.",
    },
    {
      question: "Can I use it with ADHD medication reminders?",
      answer: "While we don't have built-in medication tracking (yet), you can schedule recurring time blocks for medication times. Many users create a morning 'Meds + Planning' block that starts their day consistently.",
    },
    {
      question: "What if I hyperfocus and lose track of everything else?",
      answer: "Focus Mode includes a timer that helps you stay aware of passing time. You can set it to gently remind you when a session ends. It's not about limiting your hyperfocus—it's about giving you awareness so you can decide whether to continue or switch.",
    },
    {
      question: "Is it free? What's the catch?",
      answer: "Completely free, no catch. Open Sunsama is open-source software built by people who understand ADHD struggles. No credit card required, no premium tiers, no 'unlock this feature for $9.99' walls. The code is public on GitHub.",
    },
  ];

  return (
    <>
      <FAQSchema items={faqItems} />
      <SoftwareApplicationSchema
        name="Open Sunsama"
        description="Daily planner designed for ADHD minds. Visual time blocking for time blindness, one-task focus mode to reduce overwhelm, and clean interface that doesn't overstimulate. Free and open source."
        applicationCategory="ProductivityApplication"
        operatingSystem="Web, Windows, macOS, Linux"
        price="0"
        priceCurrency="USD"
        featureList={[
          "Visual time blocking for time blindness",
          "One-task focus mode with timer",
          "Clean, calm interface design",
          "P0-P3 priority system (no overwhelm)",
          "Drag-and-drop task scheduling",
          "Daily planning ritual",
          "Harness hyperfocus sessions",
          "Task time estimates",
          "Calendar sync",
          "Free forever (no premium tiers)",
        ]}
        url="https://opensunsama.com/for/adhd"
      />
      <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-amber-500/[0.02] blur-[100px] rounded-full" />
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
              <Link to="/register">Try Free</Link>
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
                "inline-flex items-center gap-1.5 px-3 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/10 text-[11px] font-semibold transition-all duration-300",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <Brain className="h-3 w-3 text-primary" />
              <span className="text-primary">Built for ADHD minds</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              The Daily Planner That{" "}
              <span className="text-primary">Actually Works</span> for ADHD
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed transition-all duration-300 delay-100",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Visual time blocking to fight time blindness. One task at a time to reduce overwhelm. 
              Focus mode to harness hyperfocus. And it's completely free.
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
                  Try Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6 text-sm" asChild>
                <a href="#features">
                  Learn How It Helps
                  <ChevronDown className="h-4 w-4" />
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
                <span>No credit card</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Free forever</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>No overwhelm</span>
              </div>
            </div>
          </div>
        </section>

        {/* We Understand Section */}
        <WeUnderstandSection />

        {/* Visual Demo */}
        <VisualDemoSection />

        {/* Features Section */}
        <div id="features">
          <FeaturesSection />
        </div>

        {/* Comparison */}
        <ComparisonSection />

        {/* Testimonial */}
        <TestimonialSection />

        {/* FAQ */}
        <FAQSection />

        {/* Final CTA */}
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
