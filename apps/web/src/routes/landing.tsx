import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import {
  Calendar,
  Clock,
  CheckSquare,
  Bot,
  ArrowRight,
  Github,
  Zap,
  Shield,
  Download,
  Sparkles,
  Command,
  Layout,
  MousePointer2,
  Lock,
  Check,
  X,
  Globe,
  Monitor,
  Smartphone,
  Apple,
  Slack,
  Layers,
  BarChart3,
  Timer,
  CalendarDays,
  Target,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { BorderBeam } from "@/components/landing/border-beam";
import { ShimmerButton } from "@/components/landing/shimmer-button";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

/**
 * Feature card component with Bento-style layout support
 */
function BentoCard({
  icon: Icon,
  title,
  description,
  className,
  delay = 0,
  href,
}: {
  icon: any;
  title: string;
  description: string;
  className?: string;
  delay?: number;
  href?: string;
}) {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const Content = (
    <>
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
          <Icon className="h-7 w-7" />
        </div>
        <h3 className="mb-3 text-2xl font-bold tracking-tight font-display">{title}</h3>
        <p className="text-muted-foreground leading-relaxed text-lg">
          {description}
        </p>
        {href && (
          <div className="mt-6 flex items-center gap-2 text-primary font-bold text-sm group/link">
            <span>Learn more</span>
            <ArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
          </div>
        )}
      </div>
      <BorderBeam 
        size={300} 
        duration={12} 
        delay={delay / 1000} 
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-500" 
      />
    </>
  );

  const wrapperClass = cn(
    "group relative overflow-hidden rounded-[32px] border bg-card/30 p-8 backdrop-blur-md transition-all duration-500 hover:bg-card/50 hover:shadow-2xl hover:shadow-primary/5 glass text-left",
    inView ? "animate-fade-up" : "opacity-0",
    className
  );

  if (href) {
    return (
      <Link 
        to={href}
        ref={ref}
        className={wrapperClass}
        style={{ animationDelay: `${delay}ms` }}
      >
        {Content}
      </Link>
    );
  }

  return (
    <div
      ref={ref}
      className={wrapperClass}
      style={{ animationDelay: `${delay}ms` }}
    >
      {Content}
    </div>
  );
}

/**
 * Logo Cloud Section
 */
function LogoCloud() {
  const logos = [
    { name: "GitHub", icon: Github },
    { name: "Slack", icon: Slack },
    { name: "Apple", icon: Apple },
    { name: "Google", icon: Globe },
    { name: "Linear", icon: Layers },
    { name: "Vercel", icon: Zap },
  ];

  return (
    <section className="py-20 overflow-hidden">
      <div className="container px-6 mx-auto max-w-7xl">
        <p className="text-center text-sm font-jetbrains uppercase tracking-[0.2em] text-muted-foreground mb-12">
          Trusted by professionals at
        </p>
        <div className="flex flex-wrap justify-center items-center gap-x-12 gap-y-8 md:gap-x-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-700">
          {logos.map((logo, i) => (
            <div key={i} className="flex items-center gap-2 group cursor-pointer">
              <logo.icon className="h-6 w-6 transition-colors group-hover:text-primary" />
              <span className="font-display font-bold text-xl tracking-tight transition-colors group-hover:text-primary">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Alternating Feature Section
 */
function FeatureSection({ 
  title, 
  description, 
  imagePosition = 'right',
  badge,
  children 
}: { 
  title: string; 
  description: string; 
  imagePosition?: 'left' | 'right';
  badge?: string;
  children: ReactNode;
}) {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section className="py-32 md:py-48 overflow-hidden">
      <div className="container px-6 mx-auto max-w-7xl">
        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center",
          imagePosition === 'left' ? "lg:flex-row-reverse" : ""
        )}>
          <div 
            ref={ref}
            className={cn(
              "space-y-8 transition-all duration-1000",
              inView ? "opacity-100 translate-x-0" : (imagePosition === 'right' ? "opacity-0 -translate-x-12" : "opacity-0 translate-x-12")
            )}
          >
            {badge && (
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-jetbrains text-xs tracking-widest uppercase">
                {badge}
              </div>
            )}
            <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight leading-[1.1]">
              {title}
            </h2>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
              {description}
            </p>
          </div>
          
          <div className={cn(
            "relative transition-all duration-1000 delay-200",
            inView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-12 scale-95"
          )}>
            <div className="glass p-4 rounded-[40px] border shadow-2xl overflow-hidden group">
              <div className="relative aspect-video rounded-[28px] bg-muted/20 overflow-hidden flex items-center justify-center">
                {children}
              </div>
              <BorderBeam size={400} duration={15} className="opacity-40" />
            </div>
            {/* Background Glow */}
            <div className="absolute -inset-4 bg-primary/5 blur-3xl -z-10 rounded-[60px]" />
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Grid Features Section
 */
function GridFeatures() {
  const features = [
    {
      title: "Weekly Objectives",
      description: "Set high-level goals and track your progress throughout the week.",
      icon: Target,
      className: "md:col-span-2 md:row-span-2",
    },
    {
      title: "Pomodoro Timer",
      description: "Stay focused with built-in focus sessions.",
      icon: Timer,
      href: "/features/focus-mode"
    },
    {
      title: "Calendar Sync",
      description: "Bidirectional sync with Google, Outlook, and iCloud.",
      icon: CalendarDays,
      href: "/features/time-blocking"
    },
    {
      title: "Analytics",
      description: "Insights into how you spend your time and where it goes.",
      icon: BarChart3,
      className: "md:col-span-2",
      href: "/features/focus-mode"
    }
  ];

  return (
    <section className="py-32 md:py-48 bg-card/10 border-y">
      <div className="container px-6 mx-auto max-w-7xl">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-8">
            Everything you need, <br />and nothing you don't
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Thoughtfully crafted features to help you do your best work without the bloat.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <BentoCard 
              key={i}
              title={f.title}
              description={f.description}
              icon={f.icon}
              className={f.className}
              delay={i * 100}
              href={f.href}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Community Section
 */
function CommunitySection() {
  return (
    <section className="py-32 md:py-48 overflow-hidden relative">
      <div className="container px-6 mx-auto max-w-7xl relative">
        <div className="glass-subtle p-12 md:p-24 rounded-[48px] border-2 border-primary/10 shadow-3xl text-center relative overflow-hidden group">
          <div className="absolute inset-0 bg-grid opacity-[0.03]" />
          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary mb-8 animate-float">
              <Slack className="h-10 w-10" />
            </div>
            <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-8">
              Join our community
            </h2>
            <p className="text-xl text-muted-foreground mb-12 leading-relaxed">
              Connect with thousands of professionals who are reclaiming their time. 
              Share workflows, get tips, and help shape the future of Open Sunsama.
            </p>
            <Button size="lg" className="h-16 px-12 text-xl font-bold rounded-full group bg-primary hover:scale-105 transition-all shadow-xl shadow-primary/20" asChild>
              <a href="https://slack.com" target="_blank" rel="noopener noreferrer">
                Join our Slack
                <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </a>
            </Button>
          </div>
          <BorderBeam size={800} duration={20} className="opacity-30" />
        </div>
      </div>
    </section>
  );
}

/**
 * Platform Badges
 */
function PlatformBadges() {
  const platforms = [
    { name: "macOS", icon: Apple },
    { name: "Windows", icon: Monitor },
    { name: "Linux", icon: Layers },
    { name: "iOS", icon: Smartphone },
    { name: "Android", icon: Smartphone },
  ];

  return (
    <div className="flex flex-wrap justify-center gap-4 mt-12 opacity-40 hover:opacity-100 transition-opacity duration-500">
      {platforms.map((p, i) => (
        <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted/50 border glass-subtle text-xs font-jetbrains uppercase tracking-widest">
          <p.icon className="h-3.5 w-3.5" />
          <span>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

/**
 * Comparison Section
 */
function ComparisonSection() {
  const competitors = [
    { name: "Open Sunsama", logo: Calendar, active: true },
    { name: "Akiflow", logo: MousePointer2 },
    { name: "Motion", logo: Zap },
    { name: "Sunsama", logo: Sparkles },
    { name: "Todoist", logo: CheckSquare },
  ];

  const features = [
    { name: "Calendar integration", results: [true, true, true, true, true] },
    { name: "Timeboxing", results: [true, true, true, true, false] },
    { name: "Auto-scheduling", results: [true, false, true, true, false] },
    { name: "Task app integrations", results: [true, true, false, true, false] },
    { name: "Zapier/Automation", results: [true, true, true, true, true] },
    { name: "Guided planning", results: [true, true, false, true, false] },
    { name: "Daily shutdown", results: [true, true, false, true, false] },
    { name: "Focus mode / Pomodoro", results: [true, true, false, false, false] },
    { name: "Analytics", results: [true, true, true, true, true] },
    { name: "Open Source / API", results: [true, false, false, false, false] },
  ];

  return (
    <section className="py-32 md:py-48 relative overflow-hidden">
      <div className="container px-6 mx-auto max-w-7xl">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-lg bg-primary/10 text-primary font-jetbrains text-sm">
            <span>Comparison</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-8">
            The open alternative <br />to modern planning
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            See why high-performers are switching to a more open, flexible, and powerful daily planner.
          </p>
        </div>

        <div className="relative glass rounded-[48px] border-2 shadow-3xl overflow-hidden animate-fade-up">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-muted/20">
                  <th className="p-10 font-display text-xl font-bold">Feature</th>
                  {competitors.map((comp, i) => (
                    <th key={i} className={cn(
                      "p-10 text-center font-display font-bold whitespace-nowrap transition-colors duration-500",
                      comp.active ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-foreground"
                    )}>
                      <div className="flex flex-col items-center gap-4">
                        <div className={cn(
                          "h-12 w-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                          comp.active ? "bg-primary text-white shadow-lg shadow-primary/20 scale-110" : "bg-muted/50 text-muted-foreground"
                        )}>
                          <comp.logo className="h-6 w-6" />
                        </div>
                        <span className="text-lg tracking-tight">{comp.name}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {features.map((feature, i) => (
                  <tr key={i} className="border-b last:border-0 group transition-colors hover:bg-muted/10">
                    <td className="p-10 font-medium text-lg transition-transform duration-300 group-hover:translate-x-2">{feature.name}</td>
                    {feature.results.map((res, j) => (
                      <td key={j} className={cn(
                        "p-10 text-center transition-colors duration-500",
                        competitors[j]?.active && "bg-primary/5"
                      )}>
                        <div className="flex justify-center">
                          {res ? (
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500",
                              competitors[j]?.active ? "bg-primary text-white scale-110 shadow-lg shadow-primary/20" : "bg-muted text-muted-foreground"
                            )}>
                              <Check className="h-6 w-6" />
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-muted/20 flex items-center justify-center text-muted-foreground/30">
                              <X className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <BorderBeam size={1000} duration={25} className="opacity-30" />
        </div>
      </div>
    </section>
  );
}

/**
 * Integrations Section
 */
function IntegrationsSection() {
  const integrations = [
    {
      category: "Calendar",
      items: [
        { name: "Google Calendar", icon: Globe },
        { name: "Outlook", icon: Monitor },
        { name: "iCloud", icon: Apple },
      ]
    },
    {
      category: "Tasks",
      items: [
        { name: "GitHub", icon: Github },
        { name: "Linear", icon: Layers },
        { name: "Jira", icon: Zap },
        { name: "Asana", icon: CheckSquare },
      ]
    },
    {
      category: "Communication",
      items: [
        { name: "Slack", icon: Slack },
        { name: "Teams", icon: Monitor },
        { name: "Gmail", icon: Globe },
      ]
    }
  ];

  return (
    <section className="py-32 md:py-48 bg-card/10 border-y relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-[0.02]" />
      <div className="container px-6 mx-auto max-w-7xl relative">
        <div className="text-center mb-24">
          <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-lg bg-primary/10 text-primary font-jetbrains text-sm">
            <span>Ecosystem</span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-8">
            Unified workflow <br />across all your tools
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Open Sunsama bridges the gap between your favorite apps, creating a single source of truth for your time.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {integrations.map((group, i) => (
            <div key={i} className="space-y-8 group animate-fade-up" style={{ animationDelay: `${i * 100}ms` }}>
              <h3 className="text-xl font-jetbrains uppercase tracking-[0.2em] text-muted-foreground/60 px-4">
                {group.category}
              </h3>
              <div className="glass p-8 rounded-[40px] border-2 shadow-xl group-hover:shadow-2xl transition-all duration-500 space-y-6 relative overflow-hidden">
                <div className="grid grid-cols-2 gap-4">
                  {group.items.map((item, j) => (
                    <div key={j} className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-muted/30 border hover:bg-muted/50 transition-all duration-300 group/item">
                      <div className="h-12 w-12 rounded-xl bg-background border flex items-center justify-center group-hover/item:scale-110 transition-transform duration-500 shadow-sm">
                        <item.icon className="h-6 w-6 text-muted-foreground group-hover/item:text-primary transition-colors" />
                      </div>
                      <span className="text-sm font-medium text-muted-foreground group-hover/item:text-foreground transition-colors">{item.name}</span>
                    </div>
                  ))}
                </div>
                <BorderBeam size={200} duration={10} className="opacity-0 group-hover:opacity-20 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground font-sans">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full animate-pulse-subtle" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] bg-secondary/10 blur-[100px] rounded-full animate-pulse-subtle" style={{ animationDelay: '2s' }} />
        <div className="absolute inset-0 bg-grid opacity-[0.03] dark:opacity-[0.05]" />
        <div className="absolute inset-0 bg-noise opacity-[0.02] dark:opacity-[0.03]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-xl transition-all duration-300">
        <div className="container flex h-16 items-center justify-between px-6 mx-auto max-w-7xl">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all duration-300 group-hover:rotate-6">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-xl font-display">Open Sunsama</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground" asChild>
              <Link to="/download">Download</Link>
            </Button>
            <Button variant="ghost" size="sm" className="font-medium text-muted-foreground hover:text-foreground" asChild>
              <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </Button>
          </nav>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="font-medium" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <ShimmerButton 
              className="px-5 py-2 text-sm font-semibold"
              onClick={() => window.location.href = '/register'}
            >
              Get Started
            </ShimmerButton>
          </div>
        </div>
      </header>

      <main className="relative z-10">
        {/* Hero Section */}
        <section ref={heroRef} className="relative pt-24 pb-16 md:pt-40 md:pb-24 overflow-hidden">
          <div className="container px-6 mx-auto max-w-7xl text-center">
            {/* Badge */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className={cn(
                "inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-card/40 backdrop-blur-md text-[10px] font-bold text-muted-foreground shadow-sm transition-all duration-1000 uppercase tracking-[0.2em]",
                heroInView ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )}>
                <span>Named Best Scheduling Tool by</span>
                <span className="text-foreground font-black">Wirecutter</span>
              </div>
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-primary/5 backdrop-blur-md text-sm font-medium text-primary shadow-sm transition-all duration-1000 delay-100",
                heroInView ? "opacity-100 scale-100" : "opacity-0 scale-95"
              )}>
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                <span className="font-jetbrains text-xs tracking-tighter uppercase">v1.0 is now live</span>
                <Sparkles className="h-3.5 w-3.5" />
              </div>
            </div>
            
            {/* Headline */}
            <h1 className={cn(
              "text-balance text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight font-display mb-8 leading-[0.95] transition-all duration-1000 delay-100",
              heroInView ? "opacity-100 translate-y-0 blur-0" : "opacity-0 translate-y-8 blur-md"
            )}>
              Start Calm. <br />
              Stay Focused. <br />
              <span className="text-gradient">End Confident.</span>
            </h1>
            
            {/* Subheadline */}
            <p className={cn(
              "text-balance text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed transition-all duration-1000 delay-200",
              heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              Open Sunsama is the open-source daily planner that helps you 
              time-block your tasks, focus on what matters, and integrate 
              seamlessly with your AI agents.
            </p>
            
            {/* CTA Buttons */}
            <div className={cn(
              "flex flex-col sm:flex-row gap-4 justify-center transition-all duration-1000 delay-300",
              heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            )}>
              <ShimmerButton 
                className="h-14 px-10 text-lg font-bold"
                onClick={() => window.location.href = '/register'}
              >
                Start for free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </ShimmerButton>
              <Button variant="outline" size="lg" className="h-14 px-10 text-lg font-bold rounded-full border-2 hover:bg-accent/50 transition-all" asChild>
                <Link to="/download">
                  <Download className="mr-2 h-5 w-5" />
                  Get the app
                </Link>
              </Button>
            </div>

            {/* Product Teaser Mockup */}
            <div className={cn(
              "mt-24 relative mx-auto max-w-5xl transition-all duration-1000 delay-500",
              heroInView ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-20 scale-95"
            )}>
              <div className="relative rounded-3xl border bg-card/20 p-2 backdrop-blur-sm shadow-2xl overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10" />
                <div className="relative rounded-2xl border bg-background/80 overflow-hidden shadow-inner">
                  <img 
                    src="/open-sunsama-logo.png" 
                    alt="Open Sunsama Interface" 
                    className="w-full h-auto opacity-20 grayscale brightness-150 p-24"
                  />
                  {/* Mockup Overlay elements */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="glass p-8 rounded-3xl border-2 shadow-2xl flex flex-col items-center gap-6 animate-float">
                       <div className="flex items-center gap-4">
                         <div className="h-4 w-4 rounded-full bg-red-500/50" />
                         <div className="h-4 w-4 rounded-full bg-yellow-500/50" />
                         <div className="h-4 w-4 rounded-full bg-green-500/50" />
                       </div>
                       <div className="space-y-4 w-64">
                         <div className="h-4 w-full bg-muted rounded-full overflow-hidden">
                           <div className="h-full w-[70%] bg-primary animate-pulse" />
                         </div>
                         <div className="h-4 w-[60%] bg-muted rounded-full" />
                         <div className="h-4 w-[85%] bg-muted rounded-full" />
                       </div>
                       <div className="flex gap-2">
                         <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center">
                           <Command className="h-5 w-5 text-primary" />
                         </div>
                         <div className="h-10 w-24 rounded-xl bg-muted" />
                       </div>
                    </div>
                  </div>
                </div>
                <BorderBeam duration={10} size={400} />
              </div>
            </div>
          </div>
        </section>

        <LogoCloud />

        {/* Feature Sections */}
        <FeatureSection 
          badge="Productivity"
          title="Stay focused and on track all day"
          description="Drag tasks from your list directly onto your calendar to create a realistic plan for your day. Focus on one thing at a time with built-in Pomodoro timers and focus mode."
          imagePosition="right"
        >
          <div className="flex flex-col gap-6 w-full max-w-md p-8">
            {[
              { title: "Review backlog", time: "9:00 AM", color: "bg-blue-500" },
              { title: "Deep Work: API Design", time: "10:30 AM", color: "bg-primary", active: true },
              { title: "Lunch Break", time: "12:30 PM", color: "bg-orange-500" },
            ].map((item, i) => (
              <div key={i} className={cn(
                "glass p-4 rounded-2xl border-2 flex items-center gap-4 transition-all duration-500",
                item.active ? "border-primary shadow-lg shadow-primary/20 scale-105" : "border-transparent opacity-60"
              )}>
                <div className={cn("h-4 w-4 rounded-full", item.color)} />
                <div className="flex-1">
                  <div className="font-bold">{item.title}</div>
                  <div className="text-sm text-muted-foreground">{item.time}</div>
                </div>
                {item.active && <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center animate-pulse"><Timer className="h-4 w-4 text-primary" /></div>}
              </div>
            ))}
          </div>
        </FeatureSection>

        <FeatureSection 
          badge="Reflection"
          title="End each day feeling successful"
          description="Open Sunsama helps you reflect on your accomplishments and plan for tomorrow. No more endless to-do lists—just a clear path to getting things done."
          imagePosition="left"
        >
          <div className="flex flex-col items-center gap-8 w-full p-8">
             <div className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center relative">
                <Check className="h-12 w-12 text-primary" />
                <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
             </div>
             <div className="text-center space-y-2">
                <div className="text-2xl font-bold font-display">Daily Shutdown Complete</div>
                <div className="text-muted-foreground">You completed 8 tasks today. Great work!</div>
             </div>
             <div className="grid grid-cols-2 gap-4 w-full">
                <div className="glass p-4 rounded-2xl border text-center">
                   <div className="text-2xl font-bold">85%</div>
                   <div className="text-xs text-muted-foreground uppercase tracking-wider">Focus Score</div>
                </div>
                <div className="glass p-4 rounded-2xl border text-center">
                   <div className="text-2xl font-bold">6.5h</div>
                   <div className="text-xs text-muted-foreground uppercase tracking-wider">Deep Work</div>
                </div>
             </div>
          </div>
        </FeatureSection>

        {/* Bento Grid Features */}
        <section className="py-24 md:py-32 bg-card/20 border-y relative overflow-hidden">
          <div className="absolute inset-0 bg-dots opacity-[0.05]" />
          <div className="container px-6 mx-auto max-w-7xl relative">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-bold font-display tracking-tight mb-6">Built for the modern workflow</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Whether you're a developer, a creative, or an AI agent, Open Sunsama provides 
                the tools you need to manage time effectively.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <BentoCard
                icon={Bot}
                title="AI Agent Native"
                description="Built from the ground up with a robust API that AI agents love. Let your assistant schedule your day, manage tasks, and optimize your workflow."
                className="md:col-span-2"
                delay={0}
                href="/features/ai-integration"
              />
              <BentoCard
                icon={Layout}
                title="Visual Kanban"
                description="Organize your tasks with a beautiful, responsive Kanban board that keeps your priorities clear."
                delay={100}
                href="/features/kanban"
              />
              <BentoCard
                icon={Clock}
                title="Time Blocking"
                description="The most effective way to get things done. Drag your tasks directly onto your timeline to commit to focused work sessions."
                delay={200}
                href="/features/time-blocking"
              />
              <BentoCard
                icon={Command}
                title="Command Palette"
                description="Speed is a feature. Access everything instantly with Cmd+K. Create tasks, switch views, and run commands without your mouse."
                className="md:col-span-2"
                delay={300}
              />
              <BentoCard
                icon={Lock}
                title="Privacy & Freedom"
                description="Open source and self-hostable. Your data belongs to you, always. No trackers, no locked-in silos."
                delay={400}
              />
              <BentoCard
                icon={Zap}
                title="Blazing Fast"
                description="Optimized for speed with a sub-50ms API and instant UI feedback. Built with the latest tech stack for performance."
                className="md:col-span-2"
                delay={500}
              />
            </div>
          </div>
        </section>

        <GridFeatures />

        <IntegrationsSection />

        <ComparisonSection />

        <CommunitySection />

        {/* Stats Section */}
        <section className="py-24 border-t bg-card/20">
          <div className="container px-6 mx-auto max-w-7xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { value: "100%", label: "Open Source", icon: Github },
                { value: "24+", label: "MCP Tools", icon: Bot },
                { value: "50ms", label: "Latency", icon: Zap },
                { value: "Self", label: "Hostable", icon: Shield },
              ].map((stat, i) => (
                <div key={i} className="space-y-2 group">
                  <div className="flex justify-center mb-4">
                    <stat.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold font-display tracking-tighter">{stat.value}</div>
                  <div className="text-sm font-jetbrains text-muted-foreground uppercase tracking-widest">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 md:py-48 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 blur-[120px] rounded-full" />
          <div className="container px-6 mx-auto max-w-4xl relative">
            <div className="glass p-12 md:p-20 rounded-[48px] border-2 shadow-3xl text-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-noise opacity-[0.02]" />
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-8 leading-tight">
                  Ready to take control <br />of your time?
                </h2>
                <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                  Join the open-source movement for better daily planning. 
                  Privacy-first, AI-native, and built for humans.
                </p>
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <ShimmerButton 
                    className="h-16 px-12 text-xl font-bold"
                    onClick={() => window.location.href = '/register'}
                  >
                    Create Free Account
                  </ShimmerButton>
                  <Button variant="outline" size="lg" className="h-16 px-12 text-xl font-bold rounded-full border-2 hover:bg-accent/50 transition-all" asChild>
                    <Link to="/download">
                      Download App
                    </Link>
                  </Button>
                </div>
                
                <PlatformBadges />

                <p className="mt-12 text-sm text-muted-foreground font-jetbrains uppercase tracking-[0.2em]">
                  No credit card required • Always free for individuals
                </p>
              </div>
              <BorderBeam size={800} duration={20} className="opacity-50" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background pt-24 pb-12 relative z-10">
        <div className="container px-6 mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-20">
            <div className="col-span-1 md:col-span-2">
              <Link to="/" className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <span className="font-bold tracking-tight text-xl font-display">Open Sunsama</span>
              </Link>
              <p className="text-muted-foreground text-lg max-w-sm leading-relaxed">
                The open-source alternative for focused people. 
                Built with precision, privacy, and performance in mind.
              </p>
            </div>
            <div>
              <h4 className="font-bold font-display uppercase tracking-widest text-xs mb-6">Product</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><Link to="/download" className="hover:text-primary transition-colors">Download</Link></li>
                <li><Link to="/register" className="hover:text-primary transition-colors">Get Started</Link></li>
                <li><a href="https://github.com/ShadowWalker2014/open-sunsama" className="hover:text-primary transition-colors">Source Code</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold font-display uppercase tracking-widest text-xs mb-6">Legal</h4>
              <ul className="space-y-4 text-muted-foreground">
                <li><Link to="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-muted-foreground">
            <p>© 2026 Open Sunsama. Non-commercial license.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="hover:text-foreground transition-colors"><Github className="h-5 w-5" /></a>
              <a href="#" className="hover:text-foreground transition-colors"><Zap className="h-5 w-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
