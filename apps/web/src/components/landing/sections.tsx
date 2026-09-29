import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Download,
  Github,
  Hourglass,
  ListChecks,
  Monitor,
  RefreshCw,
  Repeat,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { BenefitGrid, type BenefitItem } from "@/components/marketing/benefit-grid";
import { CountUp, Reveal } from "./motion";

const GITHUB_URL = "https://github.com/ShadowWalker2014/open-sunsama";

// Header and footer live in components/marketing so every public page shares them.
export { SiteHeader } from "@/components/marketing/site-header";
export { SiteFooter } from "@/components/marketing/site-footer";

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const FEATURES: BenefitItem[] = [
  {
    icon: RefreshCw,
    title: "Calendar sync",
    body: "See your Google, Outlook and iCloud events right next to your plan.",
    href: "/features/calendar-sync",
    color: "#F59E0B",
  },
  {
    icon: Repeat,
    title: "Rollover and repeats",
    body: "Unfinished tasks roll over to tomorrow. Recurring tasks come back on their own.",
    color: "#F97316",
  },
  {
    icon: Hourglass,
    title: "Planned vs actual",
    body: "Set an estimate. The focus timer tracks the real time. Your next plan gets better.",
    href: "/features/focus-mode",
    color: "#F43F5E",
  },
  {
    icon: ListChecks,
    title: "Subtasks, notes and files",
    body: "Break big tasks into steps. Add rich notes and attach files where you need them.",
    color: "#EC4899",
  },
  {
    icon: Monitor,
    title: "Desktop apps",
    body: "Apps for Mac, Windows and Linux, with a global shortcut to add a task from anywhere.",
    href: "/download",
    color: "#A855F7",
  },
  {
    icon: Smartphone,
    title: "On your phone",
    body: "Open it in your phone's browser. Changes sync across all your devices in real time.",
    color: "#6366F1",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-border/50 py-24 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto max-w-3xl text-balance text-center">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">Features</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[44px]">
            Everything else a good day needs.
          </h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">The small things that keep your plan honest.</p>
        </Reveal>
        <div className="mt-12">
          <BenefitGrid items={FEATURES} />
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Open source
// ---------------------------------------------------------------------------

const SNIPPETS = [
  {
    id: "claude-code",
    label: "Claude Code",
    lines: ["$ claude mcp add --transport http open-sunsama \\", "    https://api.opensunsama.com/mcp", "✓ Added MCP server open-sunsama"],
  },
  {
    id: "api",
    label: "REST API",
    lines: [
      "$ curl -X POST https://api.opensunsama.com/tasks \\",
      '    -H "X-API-Key: os_…" \\',
      `    -d '{"title":"Ship v2","priority":"P0"}'`,
    ],
  },
  {
    id: "self-host",
    label: "Self-host",
    lines: [
      "$ git clone github.com/ShadowWalker2014/open-sunsama",
      "$ docker compose up -d --build",
      "✓ Web app on :3000, API and MCP connector on :3001",
    ],
  },
];

const STATS = [
  { value: "24", label: "MCP tools" },
  { value: "1", label: "URL for any agent" },
  { value: "3", label: "Desktop apps" },
  { value: "REST", label: "Public API" },
];

export function OpenSourceSection() {
  const [tab, setTab] = React.useState(SNIPPETS[0]!.id);
  const snippet = SNIPPETS.find((s) => s.id === tab)!;

  return (
    <section className="border-t border-border/50 py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-[hsl(228_14%_7%)] p-8 text-[hsl(220_13%_93%)] shadow-[0_32px_100px_-40px_hsl(var(--shadow-color)/0.5)] md:p-12">
          <div className="landing-grid-dark pointer-events-none absolute inset-0 opacity-60" />
          <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-[radial-gradient(closest-side,hsl(24_95%_60%/0.35),transparent)] blur-2xl motion-safe:animate-[landing-drift_16s_ease-in-out_infinite]" />
          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <Reveal className="min-w-0">
              <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[hsl(24_95%_60%)]">
                Open source
              </p>
              <h2 className="mt-3 text-[30px] font-semibold leading-[1.1] tracking-[-0.03em] md:text-[40px]">
                Yours to run, read and change.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
                The code is public on GitHub. Run it on your own server with Docker. Script it with the REST
                API. Your data stays yours.
              </p>
              <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-4">
                {STATS.map((stat) => (
                  <div key={stat.label}>
                    <div className="text-[28px] font-semibold tabular-nums tracking-tight">
                      <CountUp value={stat.value} />
                    </div>
                    <div className="mt-0.5 text-[11px] uppercase tracking-wider text-white/45">{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap gap-2.5">
                <Button size="sm" className="h-9 px-4 text-[13px]" asChild>
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                    Star on GitHub
                  </a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-9 border-white/15 bg-white/5 px-4 text-[13px] text-white hover:bg-white/10 hover:text-white"
                  asChild
                >
                  <Link to="/docs/$" params={{ _splat: "self-hosting/docker" }}>
                    Self-hosting guide
                  </Link>
                </Button>
              </div>
            </Reveal>

            <Reveal delay={150} y={24} className="min-w-0">
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur">
                <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
                  {SNIPPETS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setTab(s.id)}
                      className={cn(
                        "rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                        tab === s.id ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80"
                      )}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
                <pre key={tab} className="min-h-[148px] overflow-x-auto p-4 font-mono text-[11.5px] leading-7 sm:p-5 sm:text-[12.5px]">
                  {snippet.lines.map((line, i) => (
                    <div
                      key={line}
                      className={cn(
                        "motion-safe:animate-[landing-line_500ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
                        line.startsWith("✓") ? "text-emerald-400" : line.startsWith("$") ? "text-white" : "text-white/60"
                      )}
                      style={{ animationDelay: `${i * 140}ms` }}
                    >
                      {line}
                    </div>
                  ))}
                  <span className="inline-block h-4 w-2 translate-y-0.5 bg-white/70 motion-safe:animate-[landing-caret_1s_steps(1)_infinite]" />
                </pre>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

export function FinalCta() {
  return (
    <section className="relative overflow-hidden border-t border-border/50 py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[420px] w-[820px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.14),transparent)] blur-2xl" />
      </div>
      <Reveal className="container mx-auto max-w-2xl px-4 text-center">
        <img src="/open-sunsama-logo.png" alt="" className="mx-auto h-12 w-12 rounded-2xl shadow-lg" />
        <h2 className="mt-6 text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] md:text-[48px]">
          Ready for a calmer day?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
          Plan on a board, block time on your calendar, and let your AI agent help.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Button size="lg" className="h-11 rounded-lg px-5 text-[14px] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)]" asChild>
            <Link to="/register">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-11 rounded-lg px-5 text-[14px]" asChild>
            <Link to="/download">
              <Download className="h-4 w-4" />
              Download for desktop
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-[12px] text-muted-foreground">Open source · Works with Claude, ChatGPT and any MCP app · Self-host any time</p>
      </Reveal>
    </section>
  );
}
