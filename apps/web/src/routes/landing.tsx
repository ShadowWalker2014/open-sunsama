import { Link } from "@tanstack/react-router";
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
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Feature card component with Linear-style hover effects
 */
function FeatureCard({
  icon: Icon,
  title,
  description,
  delay = 0,
}: {
  icon: typeof Calendar;
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <div 
      className="group relative flex flex-col items-start p-6 rounded-xl border bg-card/50 backdrop-blur-sm transition-all duration-300 hover:bg-card hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-1"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br from-primary/5 to-transparent" />
      <div className="relative flex items-center justify-center h-11 w-11 rounded-lg bg-primary/10 mb-5 group-hover:bg-primary/15 transition-colors">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <h3 className="relative text-lg font-semibold mb-2 tracking-tight">{title}</h3>
      <p className="relative text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/**
 * Stats badge component
 */
function StatBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center px-6 py-3">
      <span className="text-2xl font-bold text-foreground">{value}</span>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

/**
 * Landing page component
 * Linear-style design with gradient mesh, refined typography, and micro-interactions
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />
      <div className="fixed inset-0 bg-grid opacity-30 pointer-events-none" />
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-6xl">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 group-hover:bg-primary/15 transition-colors">
              <Calendar className="h-4 w-4 text-primary" />
            </div>
            <span className="font-semibold tracking-tight">Open Sunsama</span>
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <Link to="/download">Download</Link>
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" asChild>
              <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
                <Github className="h-4 w-4 mr-2" />
                GitHub
              </a>
            </Button>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" className="shadow-sm hover:shadow-md transition-shadow" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative container px-4 mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-center text-center py-24 md:py-36">
          {/* Badge */}
          <div className="animate-fade-up flex items-center gap-2 mb-8 px-4 py-2 rounded-full border bg-card/50 backdrop-blur-sm text-sm text-muted-foreground shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>AI-Native Task Management</span>
            <span className="h-1 w-1 rounded-full bg-primary/50" />
            <span className="text-primary font-medium">v1.0</span>
          </div>
          
          {/* Headline */}
          <h1 className="animate-fade-up-delay-1 text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight max-w-4xl mb-6 leading-[1.1]">
            The daily planner for{" "}
            <span className="text-gradient">focused work</span>
          </h1>
          
          {/* Subheadline */}
          <p className="animate-fade-up-delay-2 text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
            Time blocking meets task management. Built for humans and AI agents alike. 
            Open source, privacy-first, and designed for deep work.
          </p>
          
          {/* CTA Buttons */}
          <div className="animate-fade-up-delay-3 flex flex-col sm:flex-row gap-4">
            <Button size="lg" className="h-12 px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]" asChild>
              <Link to="/register">
                Start for free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" className="h-12 px-8 hover:bg-accent transition-colors" asChild>
              <Link to="/download">
                <Download className="mr-2 h-4 w-4" />
                Download app
              </Link>
            </Button>
          </div>

          {/* Social Proof */}
          <div className="mt-16 flex items-center gap-8 text-sm text-muted-foreground animate-fade-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span>Self-hostable</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              <span>Open source</span>
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              <span>API access</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative container px-4 mx-auto max-w-6xl py-24">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4 px-3 py-1 rounded-full border bg-card/50 text-sm text-muted-foreground">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <span>Features</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Everything you need to stay organized
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            A modern task manager with time blocking, designed for deep work and seamless AI integration.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          <FeatureCard
            icon={Bot}
            title="AI Agent Compatible"
            description="Full REST API access for Claude, GPT, and other AI assistants. Let AI help manage your tasks and schedule automatically."
            delay={0}
          />
          <FeatureCard
            icon={Clock}
            title="Visual Time Blocking"
            description="Drag-and-drop calendar interface. See your entire day at a glance and allocate time intentionally for focused work."
            delay={100}
          />
          <FeatureCard
            icon={CheckSquare}
            title="Smart Task Management"
            description="Priorities (P0-P3), subtasks, rich notes, and file attachments. Capture and organize everything in one place."
            delay={200}
          />
          <FeatureCard
            icon={Zap}
            title="Focus Mode"
            description="Dedicated timer with distraction-free interface. Track time spent on each task with built-in Pomodoro support."
            delay={300}
          />
          <FeatureCard
            icon={Shield}
            title="Privacy First"
            description="Self-hostable, open source, and your data stays yours. No tracking, no ads, no data mining."
            delay={400}
          />
          <FeatureCard
            icon={Download}
            title="Native Desktop App"
            description="Fast, native experience on macOS, Windows, and Linux. Global hotkeys, system tray, and offline support."
            delay={500}
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative container px-4 mx-auto max-w-6xl py-16">
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 py-12 px-8 rounded-2xl border bg-card/30 backdrop-blur-sm">
          <StatBadge value="100%" label="Open Source" />
          <StatBadge value="24" label="API Endpoints" />
          <StatBadge value="< 50ms" label="API Response" />
          <StatBadge value="∞" label="Self-Hosted" />
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative container px-4 mx-auto max-w-6xl py-24">
        <div className="relative flex flex-col items-center justify-center text-center py-16 px-8 rounded-2xl border bg-card/50 backdrop-blur-sm overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5" />
          
          <div className="relative">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Start organizing your time today
            </h2>
            <p className="text-muted-foreground max-w-lg mb-8 text-lg">
              Free, open source, and built for people who value their time. 
              No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="h-12 px-8 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all hover:scale-[1.02] active:scale-[0.98]" asChild>
                <Link to="/register">
                  Create your account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-12 px-8" asChild>
                <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
                  <Github className="mr-2 h-4 w-4" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t bg-card/30 backdrop-blur-sm">
        <div className="container px-4 mx-auto max-w-6xl py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
                <Calendar className="h-4 w-4 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-semibold tracking-tight">Open Sunsama</span>
                <span className="text-sm text-muted-foreground">Free and open source</span>
              </div>
            </div>
            <nav className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                to="/download"
                className="hover:text-foreground transition-colors"
              >
                Download
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
                className="flex items-center gap-2 hover:text-foreground transition-colors"
              >
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </a>
            </nav>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            <p>Built with care for people who value their time.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
