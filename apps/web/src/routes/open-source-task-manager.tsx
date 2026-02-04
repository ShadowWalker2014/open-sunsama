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
  Bot,
  Code,
  Server,
  Command,
  Shield,
  Eye,
  Database,
  Unlock,
  Users,
  Terminal,
  Copy,
  ExternalLink,
  Cpu,
  Globe,
  FileCode,
  Blocks,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { FAQSchema, SoftwareApplicationSchema } from "@/components/seo";
import { useState } from "react";

/**
 * Why Open Source Matters Section
 */
function WhyOpenSourceSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const reasons = [
    {
      icon: Eye,
      title: "Full Transparency",
      description: "Every line of code is auditable. No hidden telemetry, no black boxes. Know exactly what runs on your machine.",
    },
    {
      icon: Database,
      title: "Data Ownership",
      description: "Self-host and own your data completely. Your tasks, your servers, your control. Export anytime in standard formats.",
    },
    {
      icon: Unlock,
      title: "No Vendor Lock-in",
      description: "Fork it, modify it, extend it. You're never trapped. Switch hosts, add features, or run it forever—even if we disappear.",
    },
    {
      icon: Users,
      title: "Community-Driven",
      description: "Features requested and built by real users. Report bugs, submit PRs, shape the roadmap. Your voice matters.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Why Open Source Matters
          </h2>
          <p className="text-sm text-muted-foreground">
            Your productivity tools should respect your autonomy.
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
                "group rounded-xl border border-border/40 bg-card p-5 hover:border-border/60 hover:bg-card/80 transition-all duration-300",
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
 * Technical Features Section
 */
function TechStackSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const techFeatures = [
    {
      icon: FileCode,
      title: "TypeScript + React + Vite",
      description: "Modern, type-safe frontend with blazing fast HMR. Built on the best tooling available.",
    },
    {
      icon: Database,
      title: "PostgreSQL + Drizzle ORM",
      description: "Rock-solid database with type-safe queries. Your data is stored reliably and efficiently.",
    },
    {
      icon: Globe,
      title: "Full REST API",
      description: "Comprehensive API with JWT and API key auth. Build your own integrations or automations.",
    },
    {
      icon: Bot,
      title: "24+ MCP Tools",
      description: "Native AI integration. Let Claude, GPT, or any MCP-compatible agent manage your tasks.",
    },
    {
      icon: Cpu,
      title: "Tauri Desktop App",
      description: "Native desktop experience with system tray, global hotkeys, and offline support.",
    },
    {
      icon: Server,
      title: "Docker Self-Hosting",
      description: "One docker-compose.yml and you're running. Deploy anywhere: VPS, NAS, or local machine.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Built for Developers
          </h2>
          <p className="text-sm text-muted-foreground">
            A tech stack you'll actually want to work with.
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {techFeatures.map((feature, i) => (
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
 * Visual Demo Section - Developer-friendly interface
 */
function VisualDemoSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Clean, Keyboard-First Interface
          </h2>
          <p className="text-sm text-muted-foreground">
            Designed for developers who live in their keyboard.
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

              {/* App content with command palette overlay */}
              <div className="p-4 md:p-6 relative">
                {/* Command palette overlay */}
                <div className="absolute inset-x-4 top-4 z-10 md:inset-x-12 md:top-6">
                  <div className="rounded-xl border border-border/60 bg-card shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 py-3 border-b border-border/40">
                      <Command className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Search tasks, run commands...</span>
                      <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-border/40 bg-muted/30 text-muted-foreground">esc</kbd>
                    </div>
                    <div className="py-2">
                      <div className="px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider">Tasks</div>
                      <div className="px-4 py-2 hover:bg-muted/30 flex items-center gap-3 cursor-pointer bg-primary/5">
                        <div className="h-2 w-2 rounded-full bg-red-500" />
                        <span className="text-sm">Fix API authentication bug</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">P0</span>
                      </div>
                      <div className="px-4 py-2 hover:bg-muted/30 flex items-center gap-3 cursor-pointer">
                        <div className="h-2 w-2 rounded-full bg-yellow-500" />
                        <span className="text-sm">Review pull requests</span>
                        <span className="ml-auto text-[10px] text-muted-foreground">P1</span>
                      </div>
                      <div className="px-4 py-1.5 text-[10px] text-muted-foreground uppercase tracking-wider mt-2">Commands</div>
                      <div className="px-4 py-2 hover:bg-muted/30 flex items-center gap-3 cursor-pointer">
                        <Terminal className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Create new task</span>
                        <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-border/40 bg-muted/30 text-muted-foreground">n</kbd>
                      </div>
                      <div className="px-4 py-2 hover:bg-muted/30 flex items-center gap-3 cursor-pointer">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">Start focus mode</span>
                        <kbd className="ml-auto text-[10px] px-1.5 py-0.5 rounded border border-border/40 bg-muted/30 text-muted-foreground">f</kbd>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background app content (dimmed) */}
                <div className="opacity-30 blur-[1px]">
                  <div className="flex gap-6">
                    {/* Task list side */}
                    <div className="w-1/3 space-y-3">
                      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Today
                      </div>
                      <div className="rounded-lg border border-border/40 bg-card p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-red-500" />
                          <span className="text-xs font-medium">Fix API auth bug</span>
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/40 bg-card p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-yellow-500" />
                          <span className="text-xs font-medium">Review PRs</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline side */}
                    <div className="flex-1 space-y-2">
                      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Timeline
                      </div>
                      <div className="h-8 rounded-lg bg-muted/50 border border-border/40" />
                      <div className="h-12 rounded-lg bg-red-500/10 border border-red-500/20" />
                      <div className="h-8 rounded-lg bg-yellow-500/10 border border-yellow-500/20" />
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
            { icon: Command, label: "Command Palette (Cmd+K)" },
            { icon: Terminal, label: "Keyboard-First" },
            { icon: Layout, label: "Kanban Board" },
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
 * Self-Hosting Section with Docker
 */
function SelfHostingSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [copied, setCopied] = useState(false);

  const dockerCommand = `git clone https://github.com/ShadowWalker2014/open-sunsama
cd open-sunsama
docker-compose up -d`;

  const handleCopy = () => {
    navigator.clipboard.writeText(dockerCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Self-Host in Minutes
          </h2>
          <p className="text-sm text-muted-foreground">
            Your data stays on your servers. Always.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "transition-all duration-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* Docker command */}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden shadow-lg">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20">
              <div className="flex items-center gap-2">
                <Terminal className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Terminal</span>
              </div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-2 py-1 rounded text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 text-green-500" />
                    <span className="text-green-500">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-sm overflow-x-auto">
              <code className="text-muted-foreground">
                <span className="text-green-400">$</span> git clone https://github.com/ShadowWalker2014/open-sunsama{"\n"}
                <span className="text-green-400">$</span> cd open-sunsama{"\n"}
                <span className="text-green-400">$</span> docker-compose up -d
              </code>
            </pre>
          </div>

          {/* Deployment options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            {[
              { name: "Docker", desc: "Self-host anywhere" },
              { name: "Railway", desc: "One-click deploy" },
              { name: "Vercel + Supabase", desc: "Serverless option" },
            ].map((option, i) => (
              <div
                key={i}
                className="rounded-lg border border-border/40 bg-card p-4 text-center"
              >
                <div className="text-sm font-medium mb-1">{option.name}</div>
                <div className="text-[11px] text-muted-foreground">{option.desc}</div>
              </div>
            ))}
          </div>

          {/* Trust message */}
          <div className="flex items-center justify-center gap-2 mt-8 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>Your data never leaves your infrastructure</span>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Comparison to Other Open Source Tools
 */
function ComparisonSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    { name: "Time blocking", vikunja: false, focalboard: false, openSunsama: true },
    { name: "Focus mode", vikunja: false, focalboard: false, openSunsama: true },
    { name: "Calendar sync", vikunja: "Limited", focalboard: false, openSunsama: true },
    { name: "MCP/AI tools", vikunja: false, focalboard: false, openSunsama: "24+ tools" },
    { name: "Desktop app", vikunja: false, focalboard: true, openSunsama: true },
    { name: "Command palette", vikunja: false, focalboard: false, openSunsama: true },
    { name: "Modern UI", vikunja: "Basic", focalboard: "Basic", openSunsama: true },
    { name: "TypeScript", vikunja: false, focalboard: true, openSunsama: true },
    { name: "Full REST API", vikunja: true, focalboard: "Limited", openSunsama: true },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            vs Other Open Source Options
          </h2>
          <p className="text-sm text-muted-foreground">
            We built what we wished existed.
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
                <th className="px-3 py-3 font-medium text-muted-foreground text-center">Vikunja</th>
                <th className="px-3 py-3 font-medium text-muted-foreground text-center">Focalboard</th>
                <th className="px-3 py-3 font-medium text-center bg-primary/5">
                  <span className="text-primary">Open Sunsama</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {features.map((feature, i) => (
                <tr
                  key={i}
                  className="border-b border-border/40 last:border-0"
                >
                  <td className="px-4 py-2.5 text-muted-foreground">{feature.name}</td>
                  <td className="px-3 py-2.5 text-center">
                    {typeof feature.vikunja === "boolean" ? (
                      feature.vikunja ? (
                        <Check className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className="text-muted-foreground">{feature.vikunja}</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-center">
                    {typeof feature.focalboard === "boolean" ? (
                      feature.focalboard ? (
                        <Check className="h-3.5 w-3.5 text-muted-foreground/50 mx-auto" />
                      ) : (
                        <X className="h-3.5 w-3.5 text-muted-foreground/30 mx-auto" />
                      )
                    ) : (
                      <span className="text-muted-foreground">{feature.focalboard}</span>
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
                      <span className="font-medium text-foreground">{feature.openSunsama}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Comparison based on current feature sets. All projects are actively maintained.
        </p>
      </div>
    </section>
  );
}

/**
 * API & Integration Section
 */
function APISection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            API-First Architecture
          </h2>
          <p className="text-sm text-muted-foreground">
            Build your own integrations. Automate everything.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "grid grid-cols-1 md:grid-cols-2 gap-6 transition-all duration-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* REST API */}
          <div className="rounded-xl border border-border/40 bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold">Full REST API</h3>
                <p className="text-[11px] text-muted-foreground">JWT & API key authentication</p>
              </div>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 font-mono text-xs">
              <div className="text-muted-foreground mb-2"># Create a task</div>
              <div><span className="text-green-400">POST</span> /tasks</div>
              <div className="text-muted-foreground mt-2"># Get schedule</div>
              <div><span className="text-blue-400">GET</span> /time-blocks?date=2026-02-01</div>
            </div>
          </div>

          {/* MCP Integration */}
          <div className="rounded-xl border border-border/40 bg-card p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold">MCP Integration</h3>
                <p className="text-[11px] text-muted-foreground">24+ tools for AI agents</p>
              </div>
            </div>
            <div className="rounded-lg border border-border/40 bg-muted/20 p-3 font-mono text-xs">
              <div className="text-muted-foreground mb-2">// Available MCP tools</div>
              <div className="text-purple-400">create_task</div>
              <div className="text-purple-400">schedule_task</div>
              <div className="text-purple-400">get_schedule_for_day</div>
              <div className="text-muted-foreground">// ...21 more</div>
            </div>
          </div>
        </div>

        {/* Integration examples */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
          {[
            { name: "Cursor", desc: "AI coding" },
            { name: "Claude", desc: "Chat assistant" },
            { name: "n8n", desc: "Automation" },
            { name: "Custom", desc: "Build your own" },
          ].map((item, i) => (
            <div
              key={i}
              className="rounded-lg border border-border/40 bg-card p-3 text-center"
            >
              <div className="text-sm font-medium mb-0.5">{item.name}</div>
              <div className="text-[10px] text-muted-foreground">{item.desc}</div>
            </div>
          ))}
        </div>
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
      question: "How do I self-host Open Sunsama?",
      answer: "Clone the repo, configure your .env file with your PostgreSQL connection, and run docker-compose up. That's it. Full documentation is available on GitHub, including guides for Railway, Vercel, and bare metal deployments.",
    },
    {
      question: "What's the tech stack?",
      answer: "Frontend: React 19 + Vite + TanStack Router/Query + Tailwind CSS. Backend: Hono (Node.js) + PostgreSQL + Drizzle ORM. Desktop: Tauri v2. Mobile: Expo/React Native. Everything is TypeScript with shared types across packages.",
    },
    {
      question: "Is it actively maintained?",
      answer: "Yes! We're actively developing Open Sunsama with regular releases. Check our GitHub for commit history, open issues, and the roadmap. We welcome contributions from the community.",
    },
    {
      question: "Can I contribute?",
      answer: "We'd love your help. The codebase is well-documented with clear contribution guidelines. Whether it's bug fixes, new features, documentation, or translations—all contributions are welcome. Start by checking our 'good first issue' label on GitHub.",
    },
    {
      question: "How does the MCP integration work?",
      answer: "Open Sunsama includes a full MCP (Model Context Protocol) server with 24+ tools. Configure it in your AI assistant (Cursor, Claude Desktop, etc.) with your API key. The AI can then create tasks, schedule time blocks, check your calendar, and more—all through natural language.",
    },
    {
      question: "What about data portability?",
      answer: "Your data is yours. Export everything as JSON anytime. The database schema is documented, and since you can self-host, you have direct database access. No vendor lock-in, ever.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-muted-foreground">
            Everything developers want to know.
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
          <Code className="h-3 w-3" />
          100% Open Source
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
          Own Your Productivity Stack
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          Stop renting your task manager. Self-host for complete control, 
          or use our hosted version for free.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button size="lg" className="h-11 px-6 text-sm" asChild>
            <Link to="/register">
              Start Free
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-11 px-6 text-sm" asChild>
            <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
              <Star className="h-4 w-4" />
              Star on GitHub
            </a>
          </Button>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          MIT License • Free forever • Self-host or cloud
        </p>
      </div>
    </section>
  );
}

/**
 * Open Source Task Manager Landing Page
 * High-conversion page targeting "open source task management" searches
 */
export default function OpenSourceTaskManagerPage() {
  useSEO(SEO_CONFIGS.openSourceTaskManager);
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  const faqItems = [
    {
      question: "How do I self-host Open Sunsama?",
      answer: "Clone the repo, configure your .env file with your PostgreSQL connection, and run docker-compose up. That's it. Full documentation is available on GitHub, including guides for Railway, Vercel, and bare metal deployments.",
    },
    {
      question: "What's the tech stack?",
      answer: "Frontend: React 19 + Vite + TanStack Router/Query + Tailwind CSS. Backend: Hono (Node.js) + PostgreSQL + Drizzle ORM. Desktop: Tauri v2. Mobile: Expo/React Native. Everything is TypeScript with shared types across packages.",
    },
    {
      question: "Is it actively maintained?",
      answer: "Yes! We're actively developing Open Sunsama with regular releases. Check our GitHub for commit history, open issues, and the roadmap. We welcome contributions from the community.",
    },
    {
      question: "Can I contribute?",
      answer: "We'd love your help. The codebase is well-documented with clear contribution guidelines. Whether it's bug fixes, new features, documentation, or translations—all contributions are welcome. Start by checking our 'good first issue' label on GitHub.",
    },
    {
      question: "How does the MCP integration work?",
      answer: "Open Sunsama includes a full MCP (Model Context Protocol) server with 24+ tools. Configure it in your AI assistant (Cursor, Claude Desktop, etc.) with your API key. The AI can then create tasks, schedule time blocks, check your calendar, and more—all through natural language.",
    },
    {
      question: "What about data portability?",
      answer: "Your data is yours. Export everything as JSON anytime. The database schema is documented, and since you can self-host, you have direct database access. No vendor lock-in, ever.",
    },
  ];

  return (
    <>
      <FAQSchema items={faqItems} />
      <SoftwareApplicationSchema
        name="Open Sunsama"
        description="Open source task manager with time blocking, calendar sync, and focus mode. Full TypeScript codebase, self-hostable with Docker, MIT licensed. Free forever."
        applicationCategory="ProductivityApplication"
        operatingSystem="Web, Windows, macOS, Linux"
        price="0"
        priceCurrency="USD"
        featureList={[
          "100% open source (MIT license)",
          "Self-hostable with Docker",
          "Full REST API access",
          "TypeScript + React + Vite stack",
          "PostgreSQL + Drizzle ORM",
          "24+ MCP tools for AI agents",
          "Calendar sync (Google, Outlook, iCloud)",
          "Focus mode with timer",
          "Kanban task management",
          "Tauri desktop app",
        ]}
        url="https://opensunsama.com/open-source-task-manager"
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
                "inline-flex items-center gap-1.5 px-3 py-1.5 mb-6 rounded-full border border-primary/30 bg-primary/10 text-[11px] font-semibold transition-all duration-300",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <Code className="h-3 w-3 text-primary" />
              <span className="text-primary">100% Open Source</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              The Open Source{" "}
              <span className="text-primary">Task Manager</span>{" "}
              You Can Trust
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-4 leading-relaxed transition-all duration-300 delay-100",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Full source code on GitHub. Self-host for complete data ownership. 
              No vendor lock-in. Built by developers, for developers.
            </p>

            {/* GitHub stats */}
            <div
              className={cn(
                "inline-flex items-center gap-2 px-4 py-2 mb-8 rounded-lg border border-border/40 bg-card/50 text-sm transition-all duration-300 delay-125",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              <a
                href="https://github.com/ShadowWalker2014/open-sunsama"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 hover:text-primary transition-colors"
              >
                <Github className="h-4 w-4" />
                <span className="text-muted-foreground">ShadowWalker2014/open-sunsama</span>
                <span className="flex items-center gap-1 text-xs">
                  <Star className="h-3 w-3 text-yellow-500" />
                  <span className="font-medium">Star</span>
                </span>
              </a>
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
                  Start Free
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" className="h-11 px-6 text-sm" asChild>
                <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  View Source
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
                <span>MIT License</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Self-Hostable</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Active Development</span>
              </div>
            </div>
          </div>
        </section>

        {/* Why Open Source Section */}
        <WhyOpenSourceSection />

        {/* Tech Stack Section */}
        <TechStackSection />

        {/* Visual Demo Section */}
        <VisualDemoSection />

        {/* Self-Hosting Section */}
        <SelfHostingSection />

        {/* Comparison Section */}
        <ComparisonSection />

        {/* API Section */}
        <APISection />

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
                © 2026 Open Sunsama • MIT License
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
