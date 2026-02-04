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
  Home,
  Eye,
  Focus,
  Wifi,
  Sparkles,
  Shield,
  Sun,
  Moon,
  Target,
  Globe,
  Bell,
  BellOff,
  Monitor,
  CalendarCheck,
  Laptop,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { FAQSchema, SoftwareApplicationSchema } from "@/components/seo";
import { useState } from "react";

/**
 * Remote Work Challenges Section - Pain points and solutions
 */
function ChallengesSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const challenges = [
    {
      icon: Clock,
      pain: "Working all hours with no boundaries",
      description: "Without commute or office cues, work bleeds into evenings and weekends. You're always 'on' but never productive.",
      solution: "Visual time blocks show exactly when work ends. Set a clear end-of-day boundary that your calendar enforces.",
    },
    {
      icon: Bell,
      pain: "Constant Slack and meeting interruptions",
      description: "Every ping destroys your focus. You spend all day in reactive mode, never getting to deep work.",
      solution: "Focus mode blocks distractions with a visual timer. Time block 'Deep Work' sessions that signal you're unavailable.",
    },
    {
      icon: Eye,
      pain: "No visibility into where time actually goes",
      description: "Days fly by in a blur of calls and messages. You feel busy but can't point to what you accomplished.",
      solution: "See your actual work time on a timeline. Track focus sessions, review what got done, adjust tomorrow.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 rounded-full border border-amber-500/30 bg-amber-500/10 text-[11px] font-medium text-amber-600 dark:text-amber-400">
            <Home className="h-3 w-3" />
            Sound familiar?
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Remote work without structure leads to...
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            The freedom of remote work becomes a trap when you don't have systems in place.
          </p>
        </div>

        <div
          ref={ref}
          className="space-y-4"
        >
          {challenges.map((challenge, i) => (
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
                        <challenge.icon className="h-4 w-4 text-red-500" />
                      </div>
                      <h3 className="text-[15px] font-semibold text-red-600 dark:text-red-400">
                        {challenge.pain}
                      </h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed pl-12">
                      {challenge.description}
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
                      {challenge.solution}
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
 * Visual Demo - Remote Work Day
 */
function VisualDemoSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            A Well-Structured Remote Workday
          </h2>
          <p className="text-sm text-muted-foreground">
            Protected focus time. Clear boundaries. Intentional scheduling.
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
                <span className="ml-3 text-[10px] text-muted-foreground">Open Sunsama - Calendar View</span>
              </div>

              {/* Calendar Timeline Demo */}
              <div className="p-4 md:p-6">
                <div className="flex gap-4">
                  {/* Time labels */}
                  <div className="flex flex-col text-[10px] text-muted-foreground w-12 shrink-0">
                    <div className="h-10 flex items-center">8:00</div>
                    <div className="h-10 flex items-center">9:00</div>
                    <div className="h-10 flex items-center">10:00</div>
                    <div className="h-10 flex items-center">11:00</div>
                    <div className="h-10 flex items-center">12:00</div>
                    <div className="h-10 flex items-center">1:00</div>
                    <div className="h-10 flex items-center">2:00</div>
                    <div className="h-10 flex items-center">3:00</div>
                    <div className="h-10 flex items-center">4:00</div>
                    <div className="h-10 flex items-center">5:00</div>
                  </div>

                  {/* Timeline */}
                  <div className="flex-1 relative">
                    {/* Grid lines */}
                    {[...Array(10)].map((_, i) => (
                      <div key={i} className="h-10 border-t border-border/20" />
                    ))}

                    {/* Time blocks */}
                    <div className="absolute inset-0">
                      {/* Morning planning */}
                      <div
                        className="absolute left-0 right-0 rounded-md border-l-2 border-primary bg-primary/10 p-2"
                        style={{ top: "0px", height: "40px" }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Sun className="h-3 w-3 text-primary" />
                          <span className="text-[11px] font-medium text-primary">Morning Planning</span>
                        </div>
                      </div>

                      {/* Deep work block */}
                      <div
                        className="absolute left-0 right-0 rounded-md border-l-2 border-emerald-500 bg-emerald-500/10 p-2"
                        style={{ top: "40px", height: "120px" }}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Focus className="h-3 w-3 text-emerald-500" />
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Deep Work - API Integration</span>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <BellOff className="h-2.5 w-2.5" />
                          <span>Focus mode active</span>
                        </div>
                      </div>

                      {/* Team standup */}
                      <div
                        className="absolute left-0 right-0 rounded-md border-l-2 border-blue-500 bg-blue-500/10 p-2"
                        style={{ top: "160px", height: "40px" }}
                      >
                        <div className="flex items-center gap-1.5">
                          <Globe className="h-3 w-3 text-blue-500" />
                          <span className="text-[11px] font-medium text-blue-600 dark:text-blue-400">Team Standup</span>
                        </div>
                      </div>

                      {/* Lunch break */}
                      <div
                        className="absolute left-0 right-0 rounded-md border-l-2 border-gray-400 bg-gray-400/10 p-2"
                        style={{ top: "200px", height: "40px" }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-muted-foreground">Lunch Break</span>
                        </div>
                      </div>

                      {/* Afternoon deep work */}
                      <div
                        className="absolute left-0 right-0 rounded-md border-l-2 border-emerald-500 bg-emerald-500/10 p-2"
                        style={{ top: "240px", height: "80px" }}
                      >
                        <div className="flex items-center gap-1.5 mb-1">
                          <Focus className="h-3 w-3 text-emerald-500" />
                          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Deep Work - Documentation</span>
                        </div>
                      </div>

                      {/* Admin/emails */}
                      <div
                        className="absolute left-0 right-0 rounded-md border-l-2 border-orange-500 bg-orange-500/10 p-2"
                        style={{ top: "320px", height: "40px" }}
                      >
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-medium text-orange-600 dark:text-orange-400">Admin & Emails</span>
                        </div>
                      </div>

                      {/* End of day line */}
                      <div
                        className="absolute left-0 right-0 flex items-center gap-2"
                        style={{ top: "360px" }}
                      >
                        <div className="flex-1 border-t-2 border-dashed border-red-400" />
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 text-[10px] font-medium text-red-500">
                          <Moon className="h-2.5 w-2.5" />
                          End of Day
                        </div>
                        <div className="flex-1 border-t-2 border-dashed border-red-400" />
                      </div>
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
            { icon: Shield, label: "Protected focus time" },
            { icon: Moon, label: "Clear end-of-day" },
            { icon: CalendarCheck, label: "Meetings visible" },
            { icon: Target, label: "Intentional scheduling" },
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
 * Features for Remote Workers Section
 */
function FeaturesSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    {
      icon: Layout,
      title: "Visual Time Blocking",
      description: "Protect focus time by blocking it on your calendar. See exactly when you're available and when you're in deep work mode. Coworkers can see you're busy.",
    },
    {
      icon: CalendarCheck,
      title: "Calendar Sync",
      description: "See meetings from Google Calendar, Outlook, or iCloud alongside your tasks. No double-booking, no surprises. Your whole day in one view.",
    },
    {
      icon: Focus,
      title: "Focus Mode",
      description: "Dedicated time for deep work with a built-in timer. One task, no distractions, maximum productivity. Perfect for creative work and coding.",
    },
    {
      icon: Sun,
      title: "Daily Planning Ritual",
      description: "Start each day with a 5-minute planning session. Review yesterday, plan today, set realistic goals. Close the loop with an evening shutdown.",
    },
    {
      icon: Timer,
      title: "Task Time Estimates",
      description: "Estimate how long tasks take and see if they fit in your day. No more overcommitting. Know when to say 'that'll have to wait until tomorrow.'",
    },
    {
      icon: Laptop,
      title: "Desktop App",
      description: "Native app for macOS, Windows, and Linux. Works offline, syncs when connected. Global hotkeys to quick-add tasks without breaking flow.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Built for Remote Work Productivity
          </h2>
          <p className="text-sm text-muted-foreground">
            Every feature helps you work smarter, not longer.
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
 * Work-Life Balance Section
 */
function WorkLifeBalanceSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <Shield className="h-3 w-3" />
            Work-life balance
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Set Boundaries Your Calendar Enforces
          </h2>
          <p className="text-sm text-muted-foreground">
            Remote work doesn't mean always-available work.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "grid grid-cols-1 md:grid-cols-3 gap-4 transition-all duration-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {[
            {
              icon: Moon,
              title: "Clear End-of-Day",
              description: "Set your work hours. Tasks after 5pm? They roll to tomorrow automatically.",
            },
            {
              icon: BellOff,
              title: "Protected Personal Time",
              description: "Block personal time just like meetings. Exercise, family, rest—it all counts.",
            },
            {
              icon: Sun,
              title: "Shutdown Ritual",
              description: "End each day with a quick review. Know what got done. Plan tomorrow. Close the laptop.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-xl border border-border/40 bg-card p-5 text-center"
            >
              <div className="flex h-10 w-10 mx-auto mb-3 items-center justify-center rounded-lg bg-emerald-500/10">
                <item.icon className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="text-sm font-semibold mb-1.5">{item.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Comparison Table - vs Enterprise Tools
 */
function ComparisonSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    { name: "Price", slack: "$8.75/user/mo", asana: "$11/user/mo", openSunsama: "Free forever", highlight: true },
    { name: "Personal time blocking", slack: false, asana: false, openSunsama: true, highlight: true },
    { name: "Focus mode", slack: false, asana: false, openSunsama: true },
    { name: "Daily planning ritual", slack: false, asana: false, openSunsama: true },
    { name: "Calendar sync", slack: "Limited", asana: "Limited", openSunsama: true },
    { name: "Desktop app", slack: true, asana: true, openSunsama: true },
    { name: "Works offline", slack: false, asana: false, openSunsama: true },
    { name: "Task time estimates", slack: false, asana: true, openSunsama: true },
    { name: "Open source", slack: false, asana: false, openSunsama: true },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Not Just Another Enterprise Tool
          </h2>
          <p className="text-sm text-muted-foreground">
            Designed for individual productivity, not team management.
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
                <th className="px-3 py-3 font-medium text-muted-foreground text-center">Slack/Teams</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-center">Asana</th>
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
                    {typeof feature.slack === "boolean" ? (
                      feature.slack ? (
                        <Check className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className={cn(
                        feature.highlight ? "text-muted-foreground line-through" : "text-muted-foreground"
                      )}>
                        {feature.slack}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {typeof feature.asana === "boolean" ? (
                      feature.asana ? (
                        <Check className="h-4 w-4 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className="text-muted-foreground text-[11px]">{feature.asana}</span>
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
          Enterprise tools are great for team coordination. Open Sunsama is for your personal productivity.
        </p>
      </div>
    </section>
  );
}

/**
 * FAQ Section - Remote Work Specific
 */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does it help with work-life balance?",
      answer: "Visual time blocking makes your boundaries visible. Set your work hours, block personal time, and see immediately when you're overcommitting. The daily planning ritual helps you be intentional about what gets done each day, and the shutdown routine signals your brain that work is over. No more 'just one more email' at 10pm.",
    },
    {
      question: "Can my team see my schedule?",
      answer: "Open Sunsama is designed for personal productivity, not team management. Your schedule is private by default. However, if you sync with Google Calendar or Outlook, time blocks appear as 'Busy' on your work calendar—so coworkers know when you're in focus mode without seeing the details.",
    },
    {
      question: "Does it work offline?",
      answer: "Yes! The desktop app (macOS, Windows, Linux) works fully offline. Create tasks, schedule time blocks, use focus mode—all without internet. Changes sync when you're back online. Perfect for working from coffee shops, flights, or anywhere with spotty WiFi.",
    },
    {
      question: "How do I protect focus time from interruptions?",
      answer: "Create time blocks labeled 'Deep Work' or 'Focus Time' and they'll show as busy on your synced calendars. During these blocks, use Focus Mode to work on one task with a timer. The visual commitment makes it easier to defend your time against 'quick calls' and 'can you just...' requests.",
    },
    {
      question: "Does it handle time zones?",
      answer: "Time blocks are stored in your local time zone. When you travel or change zones, your schedule adjusts. If you work with a distributed team, you can see your meetings in your time zone while blocking focus time around them.",
    },
    {
      question: "Is it really free?",
      answer: "Completely free, no catch. Open Sunsama is open-source software. No credit card required, no premium tiers, no 'upgrade for time blocking' walls. The code is public on GitHub. You can even self-host it if you want full control.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Remote Work Questions, Answered
          </h2>
          <p className="text-sm text-muted-foreground">
            Common questions from remote workers like you.
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
          <Home className="h-3 w-3" />
          Built for remote work
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
          Take Control of Your Remote Workday
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          Stop letting remote work blur into everything else.
          Start each day with intention, end with satisfaction.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="h-11 px-6 text-sm" asChild>
            <Link to="/register">
              Create Free Account
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
          No credit card required • Works across time zones • Free forever
        </p>
      </div>
    </section>
  );
}

/**
 * Daily Planner for Remote Workers Landing Page
 * High-conversion page targeting remote work productivity searches
 */
export default function ForRemoteWorkersPage() {
  useSEO(SEO_CONFIGS.forAudiences.remoteWorkers);
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  const faqItems = [
    {
      question: "How does it help with work-life balance?",
      answer: "Visual time blocking makes your boundaries visible. Set your work hours, block personal time, and see immediately when you're overcommitting. The daily planning ritual helps you be intentional about what gets done each day, and the shutdown routine signals your brain that work is over. No more 'just one more email' at 10pm.",
    },
    {
      question: "Can my team see my schedule?",
      answer: "Open Sunsama is designed for personal productivity, not team management. Your schedule is private by default. However, if you sync with Google Calendar or Outlook, time blocks appear as 'Busy' on your work calendar—so coworkers know when you're in focus mode without seeing the details.",
    },
    {
      question: "Does it work offline?",
      answer: "Yes! The desktop app (macOS, Windows, Linux) works fully offline. Create tasks, schedule time blocks, use focus mode—all without internet. Changes sync when you're back online. Perfect for working from coffee shops, flights, or anywhere with spotty WiFi.",
    },
    {
      question: "How do I protect focus time from interruptions?",
      answer: "Create time blocks labeled 'Deep Work' or 'Focus Time' and they'll show as busy on your synced calendars. During these blocks, use Focus Mode to work on one task with a timer. The visual commitment makes it easier to defend your time against 'quick calls' and 'can you just...' requests.",
    },
    {
      question: "Does it handle time zones?",
      answer: "Time blocks are stored in your local time zone. When you travel or change zones, your schedule adjusts. If you work with a distributed team, you can see your meetings in your time zone while blocking focus time around them.",
    },
    {
      question: "Is it really free?",
      answer: "Completely free, no catch. Open Sunsama is open-source software. No credit card required, no premium tiers, no 'upgrade for time blocking' walls. The code is public on GitHub. You can even self-host it if you want full control.",
    },
  ];

  return (
    <>
      <FAQSchema items={faqItems} />
      <SoftwareApplicationSchema
        name="Open Sunsama"
        description="Daily planner for remote workers. Time block your day, protect focus time, set work-life boundaries, and sync across time zones. Desktop app works offline. Free forever."
        applicationCategory="ProductivityApplication"
        operatingSystem="Web, Windows, macOS, Linux"
        price="0"
        priceCurrency="USD"
        featureList={[
          "Visual time blocking",
          "Focus mode for deep work",
          "Clear end-of-day boundaries",
          "Calendar sync (Google, Outlook, iCloud)",
          "Daily planning ritual",
          "Works across time zones",
          "Desktop app (works offline)",
          "Task time estimates",
          "Protected personal time blocks",
          "Evening shutdown routine",
        ]}
        url="https://opensunsama.com/for/remote-workers"
      />
      <div className="min-h-screen bg-background text-foreground font-sans antialiased">
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] bg-emerald-500/[0.02] blur-[100px] rounded-full" />
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
              <Home className="h-3 w-3 text-primary" />
              <span className="text-primary">Built for Remote Work</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              The Daily Planner for{" "}
              <span className="text-primary">Remote Workers</span>
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed transition-all duration-300 delay-100",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Time block your day. Protect your focus time. Set clear boundaries between work and life.
              Free and works across time zones.
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
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6 text-sm" asChild>
                <a href="#features">
                  See How It Works
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
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>All time zones</span>
              </div>
            </div>
          </div>
        </section>

        {/* Challenges Section */}
        <ChallengesSection />

        {/* Visual Demo */}
        <VisualDemoSection />

        {/* Features Section */}
        <div id="features">
          <FeaturesSection />
        </div>

        {/* Work-Life Balance */}
        <WorkLifeBalanceSection />

        {/* Comparison */}
        <ComparisonSection />

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
