import { Link } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { Calendar, ArrowRight, Github, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShimmerButton } from "@/components/landing/shimmer-button";
import { BorderBeam } from "@/components/landing/border-beam";

/**
 * Layout wrapper for feature-specific landing pages
 */
export function FeatureLayout({ 
  children, 
  title, 
  subtitle,
  badge 
}: { 
  children: ReactNode; 
  title: string; 
  subtitle: string;
  badge?: string;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/30 selection:text-primary-foreground font-sans relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-secondary/5 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-grid opacity-[0.03]" />
        <div className="absolute inset-0 bg-noise opacity-[0.02]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/60 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between px-6 mx-auto max-w-7xl">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 group-hover:bg-primary/20 transition-all">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold tracking-tight text-xl font-display">Open Sunsama</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild className="font-medium">
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
        {/* Feature Hero */}
        <section className="pt-24 pb-20 md:pt-32 md:pb-32">
          <div className="container px-6 mx-auto max-w-5xl text-center">
            {badge && (
              <div className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full bg-primary/10 text-primary font-jetbrains text-xs tracking-widest uppercase animate-fade-up">
                {badge}
              </div>
            )}
            <h1 className="text-5xl md:text-7xl font-extrabold font-display tracking-tight mb-8 leading-[0.95] animate-fade-up">
              {title}
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed animate-fade-up animate-delay-100">
              {subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-up animate-delay-200">
              <ShimmerButton 
                className="h-14 px-10 text-lg font-bold"
                onClick={() => window.location.href = '/register'}
              >
                Try for free
                <ArrowRight className="ml-2 h-5 w-5" />
              </ShimmerButton>
              <Button variant="outline" size="lg" className="h-14 px-10 text-lg font-bold rounded-full border-2" asChild>
                <Link to="/download">Download App</Link>
              </Button>
            </div>
          </div>
        </section>

        {children}

        {/* Final CTA */}
        <section className="py-32 md:py-48">
          <div className="container px-6 mx-auto max-w-4xl">
            <div className="glass p-12 md:p-20 rounded-[48px] border-2 shadow-3xl text-center relative overflow-hidden group">
              <div className="relative z-10">
                <h2 className="text-4xl md:text-6xl font-bold font-display tracking-tight mb-8">
                  Ready to upgrade your workflow?
                </h2>
                <p className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto">
                  Experience the most powerful daily planner ever built. 
                  Open source, AI-native, and lightning fast.
                </p>
                <ShimmerButton 
                  className="h-16 px-12 text-xl font-bold mx-auto"
                  onClick={() => window.location.href = '/register'}
                >
                  Create Your Account
                </ShimmerButton>
              </div>
              <BorderBeam size={800} duration={20} className="opacity-50" />
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-background pt-24 pb-12">
        <div className="container px-6 mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-12 mb-16">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <span className="font-bold tracking-tight text-xl font-display">Open Sunsama</span>
            </Link>
            <nav className="flex items-center gap-10 text-sm font-medium text-muted-foreground">
              <Link to="/privacy" className="hover:text-primary transition-colors">Privacy</Link>
              <Link to="/terms" className="hover:text-primary transition-colors">Terms</Link>
              <a href="https://github.com/ShadowWalker2014/open-sunsama" className="hover:text-primary transition-colors">GitHub</a>
            </nav>
          </div>
          <p className="text-center text-sm text-muted-foreground pt-8 border-t">
            © 2026 Open Sunsama. Non-commercial license.
          </p>
        </div>
      </footer>
    </div>
  );
}
