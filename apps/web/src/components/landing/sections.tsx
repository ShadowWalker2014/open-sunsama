import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Check,
  Clock,
  Command,
  Download,
  Github,
  LayoutGrid,
  RefreshCw,
  Timer,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CountUp, Reveal } from "./motion";

const GITHUB_URL = "https://github.com/ShadowWalker2014/open-sunsama";

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function useGitHubStars(): number | null {
  const [stars, setStars] = React.useState<number | null>(() => {
    try {
      const cached = sessionStorage.getItem("os-gh-stars");
      return cached ? Number(cached) : null;
    } catch {
      return null;
    }
  });
  React.useEffect(() => {
    if (stars !== null) return;
    fetch("https://api.github.com/repos/ShadowWalker2014/open-sunsama")
      .then((res) => (res.ok ? res.json() : null))
      .then((repo: { stargazers_count?: number } | null) => {
        if (typeof repo?.stargazers_count !== "number") return;
        setStars(repo.stargazers_count);
        try {
          sessionStorage.setItem("os-gh-stars", String(repo.stargazers_count));
        } catch {
          // Storage unavailable; the count just refetches next visit.
        }
      })
      .catch(() => {});
  }, [stars]);
  return stars;
}

export function SiteHeader() {
  const stars = useGitHubStars();
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b transition-[background-color,border-color,box-shadow] duration-300",
        scrolled
          ? "border-border/60 bg-background/80 shadow-[0_1px_12px_-6px_rgb(0_0_0/0.12)] backdrop-blur-xl supports-[backdrop-filter]:bg-background/65"
          : "border-transparent bg-transparent"
      )}
    >
      <div className="container mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <img src="/open-sunsama-logo.png" alt="Open Sunsama" className="h-7 w-7 rounded-lg object-cover" />
          <span className="text-[14px] font-semibold tracking-tight">Open Sunsama</span>
        </Link>

        <nav className="hidden items-center gap-0.5 md:flex">
          {[
            { label: "Features", href: "/#features" },
            { label: "AI native", href: "/#ai" },
          ].map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
          <Link
            to="/docs"
            className="rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            Docs
          </Link>
          <Link
            to="/blog"
            search={{}}
            className="rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            Blog
          </Link>
          <Link
            to="/download"
            className="rounded-md px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground"
          >
            Download
          </Link>
        </nav>

        <div className="flex items-center gap-1.5">
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-8 items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2.5 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:flex"
          >
            <Github className="h-3.5 w-3.5" />
            Star
            {stars !== null && (
              <span className="rounded bg-muted px-1.5 py-px text-[11px] tabular-nums text-foreground">{stars}</span>
            )}
          </a>
          <Button variant="ghost" size="sm" className="h-8 px-3 text-[13px]" asChild>
            <Link to="/login">Sign in</Link>
          </Button>
          <Button size="sm" className="h-8 px-3 text-[13px]" asChild>
            <Link to="/register">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Features
// ---------------------------------------------------------------------------

const FEATURES = [
  {
    icon: Clock,
    title: "Time blocking",
    body: "Drag tasks onto your calendar to create a realistic daily plan.",
    href: "/features/time-blocking",
  },
  {
    icon: LayoutGrid,
    title: "Kanban board",
    body: "Organize tasks visually with drag-and-drop prioritization.",
    href: "/features/kanban",
  },
  {
    icon: Timer,
    title: "Focus mode",
    body: "Work on one task at a time with a built-in timer.",
    href: "/features/focus-mode",
  },
  {
    icon: Bot,
    title: "AI native",
    body: "Control your planner from any agent. Connect Claude, ChatGPT, Cursor, or any MCP client with one URL.",
    href: "/features/ai-integration",
    agents: ["Claude", "ChatGPT", "Cursor", "Claude Code"],
  },
  {
    icon: Command,
    title: "Command palette",
    body: "Access everything with ⌘K. Search tasks, run commands, and navigate fast.",
    href: "/features/command-palette",
  },
  {
    icon: RefreshCw,
    title: "Calendar sync",
    body: "Two-way sync with Google, Outlook, and iCloud calendars.",
    href: "/features/calendar-sync",
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="scroll-mt-16 border-t border-border/50 py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[44px]">Built for focus.</h2>
          <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">Everything you need to plan your day.</p>
        </Reveal>
        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border/70 bg-border/70 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((item, i) => (
            <Reveal key={item.title} delay={i * 60} className="h-full min-w-0 bg-background">
              <Link to={item.href} className="group relative block h-full p-6 transition-colors hover:bg-muted/40">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary transition-transform duration-300 group-hover:-translate-y-0.5">
                  <item.icon className="h-4 w-4" />
                </span>
                <h3 className="mt-4 flex items-center gap-1.5 text-[15px] font-semibold">
                  {item.title}
                  <ArrowRight className="h-3.5 w-3.5 -translate-x-1 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                </h3>
                <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">{item.body}</p>
                {item.agents && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {item.agents.map((agent) => (
                      <span
                        key={agent}
                        className="rounded-md border border-primary/25 bg-primary/5 px-1.5 py-0.5 text-[11px] font-medium text-foreground/80"
                      >
                        {agent}
                      </span>
                    ))}
                  </div>
                )}
              </Link>
            </Reveal>
          ))}
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
      "$ docker-compose up -d",
      "✓ API and MCP connector on :3001",
    ],
  },
];

const STATS = [
  { value: "100%", label: "Open source" },
  { value: "23", label: "MCP tools" },
  { value: "1", label: "URL for any agent" },
  { value: "∞", label: "Self-host" },
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
                Yours to run, read, and extend.
              </h2>
              <p className="mt-4 max-w-md text-[15px] leading-relaxed text-white/60">
                Self-host it on your own server, wire it into scripts with the REST API, or connect any MCP
                client. No lock-in, and every line is on GitHub.
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
// Comparison
// ---------------------------------------------------------------------------

const ROWS: Array<{ name: string; others: boolean | string }> = [
  { name: "Daily planning board and time blocking", others: true },
  { name: "Google, Outlook, and iCloud sync", others: true },
  { name: "Focus mode with a built-in timer", others: "Varies" },
  { name: "AI native: control it from any agent", others: false },
  { name: "One-click Claude & ChatGPT connector", others: "Rare" },
  { name: "Open source and self-hostable", others: false },
  { name: "Full REST API with scoped keys", others: "Limited" },
];

export function ComparisonSection() {
  return (
    <section className="border-t border-border/50 py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <Reveal className="text-center">
          <h2 className="text-[28px] font-semibold tracking-[-0.03em] md:text-[36px]">Why Open Sunsama?</h2>
          <p className="mt-3 text-[16px] text-muted-foreground">The features you need, none of the lock-in.</p>
        </Reveal>
        <Reveal delay={100} className="mt-10 overflow-hidden rounded-2xl border border-border/70">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-[12px] uppercase tracking-wider">
                <th className="px-3 py-3 text-left font-medium text-muted-foreground sm:px-5" />
                <th className="px-3 py-3 font-semibold text-primary sm:px-5">Open Sunsama</th>
                <th className="px-3 py-3 font-medium text-muted-foreground sm:px-5">Closed planners</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.name} className="border-b border-border/50 last:border-0">
                  <td className="px-3 py-3 text-[13px] text-foreground/85 sm:px-5 sm:text-[14px]">{row.name}</td>
                  <td className="px-3 py-3 text-center sm:px-5">
                    <Check className="mx-auto h-4 w-4 text-primary" />
                  </td>
                  <td className="px-3 py-3 text-center text-[13px] text-muted-foreground sm:px-5">
                    {row.others === true ? (
                      <Check className="mx-auto h-4 w-4 text-muted-foreground/60" />
                    ) : row.others === false ? (
                      <X className="mx-auto h-4 w-4 text-muted-foreground/40" />
                    ) : (
                      row.others
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
        <Reveal delay={160} className="mt-5 text-center text-[13px] text-muted-foreground">
          Switching? Compare with{" "}
          {[
            ["Sunsama", "/alternative/sunsama"],
            ["Motion", "/alternative/motion"],
            ["Akiflow", "/alternative/akiflow"],
            ["Reclaim", "/alternative/reclaim"],
            ["Todoist", "/alternative/todoist"],
          ].map(([label, href], i, all) => (
            <React.Fragment key={href}>
              <Link to={href} className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline">
                {label}
              </Link>
              {i < all.length - 1 ? " · " : ""}
            </React.Fragment>
          ))}
        </Reveal>
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
          Ready to take control?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
          Plan your day on a board, time-block your calendar, and run it all from the AI agent you already use.
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
              Download the app
            </Link>
          </Button>
        </div>
        <p className="mt-4 text-[12px] text-muted-foreground">Open source · Works with Claude, ChatGPT, and any MCP client · Self-host anytime</p>
      </Reveal>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

const FOOTER_COLUMNS: Array<{ title: string; links: Array<[string, string]> }> = [
  {
    title: "Product",
    links: [
      ["Kanban board", "/features/kanban"],
      ["Time blocking", "/features/time-blocking"],
      ["Focus mode", "/features/focus-mode"],
      ["AI integration", "/features/ai-integration"],
      ["Calendar sync", "/features/calendar-sync"],
      ["Download", "/download"],
    ],
  },
  {
    title: "Compare",
    links: [
      ["Sunsama alternative", "/alternative/sunsama"],
      ["Motion alternative", "/alternative/motion"],
      ["Akiflow alternative", "/alternative/akiflow"],
      ["Reclaim alternative", "/alternative/reclaim"],
      ["Todoist alternative", "/alternative/todoist"],
    ],
  },
  {
    title: "For",
    links: [
      ["Developers", "/for/developers"],
      ["Remote workers", "/for/remote-workers"],
      ["ADHD", "/for/adhd"],
      ["Open-source task manager", "/open-source-task-manager"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Docs", "/docs"],
      ["Connect your AI", "/docs/mcp/overview"],
      ["Blog", "/blog"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-14">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <img src="/open-sunsama-logo.png" alt="Open Sunsama" className="h-7 w-7 rounded-lg object-cover" />
            <span className="text-[14px] font-semibold">Open Sunsama</span>
          </Link>
          <p className="mt-3 max-w-[240px] text-[13px] leading-relaxed text-muted-foreground">
            The open-source daily planner you can control from any AI agent.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-foreground/70">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map(([label, href]) => (
                <li key={href}>
                  <a href={href} className="text-[13px] text-muted-foreground transition-colors hover:text-foreground">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-border/50 px-4 pt-6 text-[12px] text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} Open Sunsama</span>
        <span className="flex items-center gap-1.5">
          <Command className="h-3 w-3" />
          Built in the open
        </span>
      </div>
    </footer>
  );
}
