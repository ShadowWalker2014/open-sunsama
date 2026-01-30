import { Link } from "@tanstack/react-router";
import {
  Calendar,
  Clock,
  CheckSquare,
  Bot,
  ArrowRight,
  Github,
} from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Feature card component
 */
function FeatureCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Calendar;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-start p-6 rounded-lg border bg-card">
      <div className="flex items-center justify-center h-10 w-10 rounded-md bg-muted mb-4">
        <Icon className="h-5 w-5 text-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

/**
 * Landing page component
 * Clean, minimal Linear-style aesthetic
 */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4 mx-auto max-w-6xl">
          <Link to="/" className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            <span className="font-semibold">Open Sunsama</span>
          </Link>
          <nav className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container px-4 mx-auto max-w-6xl">
        <div className="flex flex-col items-center justify-center text-center py-20 md:py-32">
          <div className="flex items-center gap-2 mb-6 px-3 py-1 rounded-full border bg-muted/50 text-sm text-muted-foreground">
            <Bot className="h-4 w-4" />
            <span>AI Agent Compatible</span>
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight max-w-3xl mb-6">
            Open source daily planner for focused work
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
            Time blocking meets task management. Built for humans and AI agents
            alike. Take control of your day with a clean, distraction-free
            interface.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild>
              <Link to="/register">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container px-4 mx-auto max-w-6xl py-20 border-t">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Everything you need to stay organized
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A modern task manager with time blocking, designed for both personal
            productivity and AI agent integration.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <FeatureCard
            icon={Bot}
            title="AI Agent Compatible"
            description="Full API access for Claude, GPT, and other AI assistants. Let AI help manage your tasks and schedule through a well-documented REST API."
          />
          <FeatureCard
            icon={Clock}
            title="Time Blocking"
            description="Visual calendar with drag-and-drop time blocks. See your day at a glance and allocate time intentionally for focused work."
          />
          <FeatureCard
            icon={CheckSquare}
            title="Task Management"
            description="Priorities, subtasks, rich notes, and file attachments. Everything you need to capture and organize your work in one place."
          />
        </div>
      </section>

      {/* CTA Section */}
      <section className="container px-4 mx-auto max-w-6xl py-20 border-t">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-2xl md:text-3xl font-semibold mb-4">
            Start organizing your time today
          </h2>
          <p className="text-muted-foreground max-w-lg mb-8">
            Free and open source. No credit card required. Your data stays
            yours.
          </p>
          <Button size="lg" asChild>
            <Link to="/register">
              Create your account
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 mx-auto max-w-6xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Open Sunsama</span>
            <span className="mx-2">·</span>
            <span>Free and open source</span>
          </div>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
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
      </footer>
    </div>
  );
}
