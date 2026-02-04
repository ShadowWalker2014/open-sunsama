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
  Play,
  ChevronLeft,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";

/**
 * App Preview Component - Shows a realistic view of the main interface
 */
function AppPreview({ inView }: { inView: boolean }) {
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);

  const formatDay = (date: Date) => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days[date.getDay()];
  };

  const formatDate = (date: Date) => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${months[date.getMonth()]} ${date.getDate()}`;
  };

  const tasks = {
    today: [
      {
        id: 1,
        title: "Review Q1 roadmap with team",
        priority: "P0",
        duration: "2h",
        completed: false,
        subtasks: ["Prepare slides", "Send agenda"],
        startTime: "9:00 AM",
      },
      {
        id: 2,
        title: "Write API documentation",
        priority: "P1",
        duration: "1h 30m",
        completed: false,
        subtasks: ["Auth endpoints", "Task endpoints"],
        inFocus: true,
      },
      {
        id: 3,
        title: "Code review: PR #247",
        priority: "P2",
        duration: "45m",
        completed: true,
      },
      {
        id: 4,
        title: "Team standup",
        priority: "P2",
        duration: "15m",
        completed: true,
        startTime: "10:00 AM",
      },
    ],
    tomorrow: [
      {
        id: 5,
        title: "Design system updates",
        priority: "P1",
        duration: "3h",
        completed: false,
      },
      {
        id: 6,
        title: "Client presentation prep",
        priority: "P0",
        duration: "2h",
        completed: false,
      },
      {
        id: 7,
        title: "1:1 with Sarah",
        priority: "P2",
        duration: "30m",
        completed: false,
      },
    ],
    dayAfter: [
      {
        id: 8,
        title: "Sprint retrospective",
        priority: "P1",
        duration: "1h",
        completed: false,
      },
      {
        id: 9,
        title: "Bug fixes: mobile layout",
        priority: "P2",
        duration: "2h",
        completed: false,
      },
    ],
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case "P0":
        return "bg-red-500/15 text-red-600 dark:text-red-400";
      case "P1":
        return "bg-amber-500/15 text-amber-600 dark:text-amber-400";
      case "P2":
        return "bg-blue-500/10 text-blue-500 dark:text-blue-400";
      default:
        return "bg-slate-500/10 text-slate-500";
    }
  };

  return (
    <div
      className={cn(
        "mt-12 md:mt-16 transition-all duration-700 delay-200",
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}
    >
      {/* Outer glow container */}
      <div className="relative">
        <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-primary/10 to-primary/20 blur-3xl opacity-50 rounded-3xl" />

        {/* Main preview container */}
        <div className="relative rounded-2xl border border-border/60 bg-card/80 backdrop-blur-sm p-1.5 shadow-2xl">
          <div className="rounded-xl border border-border/40 bg-background overflow-hidden">
            {/* Window chrome - macOS style */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-muted/30">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57] hover:bg-[#ff5f57]/80 transition-colors" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e] hover:bg-[#febc2e]/80 transition-colors" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840] hover:bg-[#28c840]/80 transition-colors" />
                </div>
                <div className="hidden sm:flex items-center gap-1.5 ml-4 px-2 py-1 rounded-md bg-muted/50">
                  <Calendar className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-medium text-muted-foreground">
                    Open Sunsama
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex items-center gap-1 px-2 py-1 rounded-md bg-muted/30 text-[10px] text-muted-foreground">
                  <Command className="h-2.5 w-2.5" />
                  <span>K</span>
                </div>
              </div>
            </div>

            {/* App content */}
            <div className="flex h-[320px] sm:h-[380px] md:h-[420px]">
              {/* Sidebar - Backlog (hidden on mobile) */}
              <div className="hidden md:flex flex-col w-[180px] border-r border-border/40 bg-muted/10">
                <div className="p-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Backlog
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                      3
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-2 space-y-1.5 overflow-hidden">
                  {[
                    { title: "Research new framework", priority: "P3" },
                    { title: "Update dependencies", priority: "P3" },
                    { title: "Write blog post", priority: "P2" },
                  ].map((task, i) => (
                    <div
                      key={i}
                      className="group rounded-lg border border-border/30 bg-card/50 p-2 hover:bg-card/80 hover:border-border/50 transition-all cursor-grab"
                    >
                      <div className="flex items-start gap-2">
                        <div className="mt-0.5 h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
                        <span className="text-[11px] text-muted-foreground leading-tight line-clamp-2">
                          {task.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main content - Day columns */}
              <div className="flex-1 flex flex-col min-w-0">
                {/* Toolbar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-border/40 bg-muted/5">
                  <div className="flex items-center gap-1">
                    <button className="p-1 rounded hover:bg-muted/50 transition-colors">
                      <ChevronLeft className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                    <button className="px-2 py-1 rounded text-[11px] font-medium hover:bg-muted/50 transition-colors">
                      Today
                    </button>
                    <button className="p-1 rounded hover:bg-muted/50 transition-colors">
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>

                {/* Day columns container */}
                <div className="flex-1 flex overflow-hidden">
                  {/* Today column */}
                  <div className="flex-1 min-w-[160px] border-r border-border/40 flex flex-col">
                    <div className="p-3 border-b border-border/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold text-primary">
                          Today
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(today)}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="h-1 rounded-full bg-muted overflow-hidden">
                        <div className="h-full w-1/2 bg-primary rounded-full transition-all" />
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          4h 30m planned
                        </span>
                        <span className="text-[10px] text-primary">50%</span>
                      </div>
                    </div>
                    <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                      {tasks.today.map((task) => (
                        <div
                          key={task.id}
                          className={cn(
                            "group rounded-lg border bg-card p-2.5 transition-all cursor-pointer",
                            task.inFocus
                              ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                              : "border-border/40 hover:border-border/60 hover:bg-card/80"
                          )}
                        >
                          {task.startTime && (
                            <div className="text-[10px] text-muted-foreground mb-1">
                              {task.startTime}
                            </div>
                          )}
                          <div className="flex items-start gap-2">
                            <div
                              className={cn(
                                "mt-0.5 h-4 w-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors",
                                task.completed
                                  ? "border-primary bg-primary"
                                  : "border-muted-foreground/40 group-hover:border-muted-foreground/60"
                              )}
                            >
                              {task.completed && (
                                <Check className="h-2.5 w-2.5 text-primary-foreground" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span
                                className={cn(
                                  "text-[12px] leading-tight block",
                                  task.completed &&
                                    "line-through text-muted-foreground"
                                )}
                              >
                                {task.title}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                <span
                                  className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded font-medium",
                                    getPriorityStyles(task.priority)
                                  )}
                                >
                                  {task.priority}
                                </span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                  {task.duration}
                                </span>
                                {task.inFocus && (
                                  <span className="flex items-center gap-0.5 text-[9px] text-primary font-medium">
                                    <Timer className="h-2.5 w-2.5" />
                                    Focus
                                  </span>
                                )}
                              </div>
                              {task.subtasks && !task.completed && (
                                <div className="mt-2 space-y-1">
                                  {task.subtasks
                                    .slice(0, 2)
                                    .map((subtask, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center gap-1.5"
                                      >
                                        <div className="h-2.5 w-2.5 rounded-sm border border-muted-foreground/30" />
                                        <span className="text-[10px] text-muted-foreground">
                                          {subtask}
                                        </span>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      <button className="w-full flex items-center justify-center gap-1 p-2 rounded-lg border border-dashed border-border/40 text-[11px] text-muted-foreground hover:bg-muted/30 hover:border-border/60 transition-colors">
                        <Plus className="h-3 w-3" />
                        Add task
                      </button>
                    </div>
                  </div>

                  {/* Tomorrow column */}
                  <div className="flex-1 min-w-[160px] border-r border-border/40 flex flex-col hidden sm:flex">
                    <div className="p-3 border-b border-border/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold">
                          Tomorrow
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(tomorrow)}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        5h 30m planned
                      </span>
                    </div>
                    <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                      {tasks.tomorrow.map((task) => (
                        <div
                          key={task.id}
                          className="group rounded-lg border border-border/40 bg-card p-2.5 hover:border-border/60 hover:bg-card/80 transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-[12px] leading-tight block">
                                {task.title}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span
                                  className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded font-medium",
                                    getPriorityStyles(task.priority)
                                  )}
                                >
                                  {task.priority}
                                </span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                  {task.duration}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Day after column (hidden on smaller screens) */}
                  <div className="flex-1 min-w-[160px] flex-col hidden lg:flex">
                    <div className="p-3 border-b border-border/40">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[13px] font-semibold">
                          {formatDay(dayAfter)}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatDate(dayAfter)}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        3h planned
                      </span>
                    </div>
                    <div className="flex-1 p-2 space-y-1.5 overflow-y-auto">
                      {tasks.dayAfter.map((task) => (
                        <div
                          key={task.id}
                          className="group rounded-lg border border-border/40 bg-card p-2.5 hover:border-border/60 hover:bg-card/80 transition-all cursor-pointer"
                        >
                          <div className="flex items-start gap-2">
                            <div className="mt-0.5 h-4 w-4 rounded-full border-2 border-muted-foreground/40 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-[12px] leading-tight block">
                                {task.title}
                              </span>
                              <div className="flex items-center gap-1.5 mt-1.5">
                                <span
                                  className={cn(
                                    "text-[9px] px-1.5 py-0.5 rounded font-medium",
                                    getPriorityStyles(task.priority)
                                  )}
                                >
                                  {task.priority}
                                </span>
                                <span className="text-[10px] text-muted-foreground tabular-nums">
                                  {task.duration}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Right sidebar - Timeline (hidden on mobile) */}
              <div className="hidden lg:flex flex-col w-[200px] border-l border-border/40 bg-muted/5">
                <div className="p-3 border-b border-border/40">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Timeline
                    </span>
                  </div>
                </div>
                <div className="flex-1 p-2 overflow-hidden relative">
                  {/* Time markers */}
                  <div className="absolute left-2 top-0 bottom-0 w-10 text-[9px] text-muted-foreground space-y-[40px] pt-1">
                    <div>9:00</div>
                    <div>10:00</div>
                    <div>11:00</div>
                    <div>12:00</div>
                    <div>1:00</div>
                  </div>
                  {/* Time blocks */}
                  <div className="ml-11 space-y-1.5 relative">
                    <div className="h-10 rounded-lg bg-red-500/10 border-l-[3px] border-red-500 p-2">
                      <span className="text-[10px] font-medium block truncate">
                        Q1 Roadmap
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        9:00 - 11:00
                      </span>
                    </div>
                    <div className="h-6 rounded-lg bg-blue-500/10 border-l-[3px] border-blue-500 p-1.5">
                      <span className="text-[10px] font-medium truncate">
                        Standup
                      </span>
                    </div>
                    <div className="h-14 rounded-lg bg-primary/10 border-l-[3px] border-primary p-2">
                      <span className="text-[10px] font-medium block truncate">
                        API Docs
                      </span>
                      <span className="text-[9px] text-primary">In focus</span>
                    </div>
                    {/* Current time indicator */}
                    <div
                      className="absolute left-0 right-0 flex items-center gap-1"
                      style={{ top: "85px" }}
                    >
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      <div className="flex-1 h-[1px] bg-red-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature indicators below preview */}
      <div className="flex flex-wrap justify-center gap-2 mt-6">
        {[
          { icon: Layout, label: "Kanban Board" },
          { icon: Clock, label: "Time Blocking" },
          { icon: Timer, label: "Focus Mode" },
          { icon: Command, label: "Command Palette" },
        ].map((item, i) => (
          <div
            key={i}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/40 bg-card/50 text-[11px] transition-all duration-300",
              inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
            )}
            style={{ transitionDelay: `${300 + i * 50}ms` }}
          >
            <item.icon className="h-3 w-3 text-primary" />
            <span className="text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

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
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  Feature
                </th>
                <th className="px-4 py-3 font-medium text-primary text-center">
                  Open Sunsama
                </th>
                <th className="px-4 py-3 font-medium text-muted-foreground text-center">
                  Others
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => (
                <tr key={i} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {feature.name}
                  </td>
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
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <Link to="/blog">Blog</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <Link to="/download">Download</Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
              <a
                href="https://github.com/ShadowWalker2014/open-sunsama"
                target="_blank"
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </Button>
          </nav>

          <div className="flex items-center gap-1.5">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs"
              asChild
            >
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
          <div className="container px-4 mx-auto max-w-5xl text-center">
            {/* Badge */}
            <div
              className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 mb-6 rounded-md border border-border/40 bg-card/50 text-[11px] font-medium transition-all duration-300",
                heroInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              )}
            >
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-muted-foreground">v1.0 now available</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-2xl md:text-3xl lg:text-4xl font-semibold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              )}
            >
              Daily planning, <span className="text-primary">done right.</span>
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-[15px] text-muted-foreground max-w-lg mx-auto mb-8 leading-relaxed transition-all duration-300 delay-100",
                heroInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              )}
            >
              The open-source daily planner for time-blocking, focused work, and
              seamless AI integration.
            </p>

            {/* CTA */}
            <div
              className={cn(
                "flex flex-col sm:flex-row gap-2 justify-center transition-all duration-300 delay-150",
                heroInView
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              )}
            >
              <Button size="sm" className="h-9 px-4 text-[13px]" asChild>
                <Link to="/register">
                  Start for free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-[13px]"
                asChild
              >
                <Link to="/download">
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Link>
              </Button>
            </div>

            {/* App preview - realistic app interface */}
            <AppPreview inView={heroInView} />
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
                  <div className="text-lg md:text-xl font-semibold tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {stat.label}
                  </div>
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
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-4 text-[13px]"
                asChild
              >
                <a
                  href="https://github.com/ShadowWalker2014/open-sunsama"
                  target="_blank"
                  rel="noopener noreferrer"
                >
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
              <Link
                to="/blog"
                className="hover:text-foreground transition-colors"
              >
                Blog
              </Link>
              <Link
                to="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacy
              </Link>
              <Link
                to="/terms"
                className="hover:text-foreground transition-colors"
              >
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
