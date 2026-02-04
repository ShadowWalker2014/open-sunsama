import { Link } from "@tanstack/react-router";
import {
  Calendar,
  ArrowRight,
  Github,
  Check,
  ChevronDown,
  Terminal,
  Code2,
  Keyboard,
  Cpu,
  Database,
  Braces,
  Command,
  Zap,
  Server,
  GitBranch,
  Layers,
  Search,
  Plus,
  Timer,
  LayoutGrid,
  Settings,
  Eye,
  Bot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { FAQSchema, SoftwareApplicationSchema } from "@/components/seo";
import { useState } from "react";

/**
 * "Why Developers Love It" Section - Key features for developers
 */
function WhyDevelopersSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const features = [
    {
      icon: Command,
      title: "Command Palette",
      description: "Access everything with Cmd+K. Fuzzy search tasks, run commands, navigate views. Just like VS Code.",
    },
    {
      icon: Braces,
      title: "Full REST API",
      description: "Programmatic access to all features. Create tasks, schedule time blocks, manage your workflow from scripts.",
    },
    {
      icon: Bot,
      title: "24+ MCP Tools",
      description: "Let AI agents manage your schedule. Native integration with Cursor, Claude, and other MCP-compatible tools.",
    },
    {
      icon: Keyboard,
      title: "Keyboard-First",
      description: "Navigate, create, edit, and complete tasks without touching the mouse. Every action has a shortcut.",
    },
    {
      icon: Eye,
      title: "Minimal UI",
      description: "No visual clutter. Clean, distraction-free interface that stays out of your way while you're in flow.",
    },
    {
      icon: GitBranch,
      title: "Open Source",
      description: "Full TypeScript codebase on GitHub. Self-host it, fork it, contribute to it. Your data, your control.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Why Developers Love It
          </h2>
          <p className="text-sm text-muted-foreground">
            Built with the same principles you use in your IDE.
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
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
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mb-4">
                <feature.icon className="h-5 w-5" />
              </div>
              <h3 className="text-[15px] font-semibold mb-1.5">{feature.title}</h3>
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
 * Visual Demo - Command Palette and IDE-like interface
 */
function VisualDemoSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const [selectedItem, setSelectedItem] = useState(0);

  const paletteItems = [
    { icon: Plus, label: "New task", shortcut: "Cmd+N" },
    { icon: Timer, label: "Start focus mode", shortcut: "Cmd+Enter" },
    { icon: LayoutGrid, label: "Switch to kanban view", shortcut: "Cmd+1" },
    { icon: Calendar, label: "Switch to calendar view", shortcut: "Cmd+2" },
    { icon: Settings, label: "Open settings", shortcut: "Cmd+," },
  ];

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Feels Like Your IDE
          </h2>
          <p className="text-sm text-muted-foreground">
            Command palette with fuzzy search. Keyboard navigation. No menus.
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
                <span className="ml-3 text-[10px] text-muted-foreground">Open Sunsama - Command Palette</span>
              </div>

              {/* Command Palette Demo */}
              <div className="p-6 md:p-10 bg-background/50 backdrop-blur">
                <div className="max-w-md mx-auto">
                  {/* Palette header */}
                  <div className="rounded-t-lg border border-border/60 bg-card shadow-lg overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border/40">
                      <Search className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">focus</span>
                      <span className="text-sm text-muted-foreground/50 animate-pulse">|</span>
                    </div>

                    {/* Palette items */}
                    <div className="py-1">
                      {paletteItems.map((item, i) => (
                        <div
                          key={i}
                          className={cn(
                            "flex items-center justify-between px-3 py-2 cursor-pointer transition-colors",
                            selectedItem === i ? "bg-primary/10" : "hover:bg-muted/30"
                          )}
                          onMouseEnter={() => setSelectedItem(i)}
                        >
                          <div className="flex items-center gap-2.5">
                            <item.icon className={cn(
                              "h-4 w-4",
                              selectedItem === i ? "text-primary" : "text-muted-foreground"
                            )} />
                            <span className={cn(
                              "text-sm",
                              selectedItem === i ? "text-foreground" : "text-muted-foreground"
                            )}>
                              {item.label}
                            </span>
                          </div>
                          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-muted/50 border border-border/40">
                            {item.shortcut}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Keyboard hint */}
                  <div className="flex items-center justify-center gap-4 mt-4 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/40 font-mono">↑↓</kbd>
                      navigate
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/40 font-mono">↵</kbd>
                      select
                    </span>
                    <span className="flex items-center gap-1">
                      <kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/40 font-mono">esc</kbd>
                      close
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature callouts */}
        <div className="flex flex-wrap justify-center gap-2 mt-8">
          {[
            { icon: Search, label: "Fuzzy search" },
            { icon: Keyboard, label: "Keyboard navigation" },
            { icon: Zap, label: "Instant results" },
            { icon: Terminal, label: "IDE-like UX" },
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
 * Tech Stack Section
 */
function TechStackSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const stack = [
    {
      category: "Frontend",
      icon: Layers,
      items: ["React 19", "Vite", "TanStack Router", "TanStack Query", "Tailwind CSS", "Radix UI"],
    },
    {
      category: "Backend",
      icon: Server,
      items: ["Hono", "PostgreSQL", "Drizzle ORM", "PG Boss", "Bun"],
    },
    {
      category: "Desktop",
      icon: Cpu,
      items: ["Tauri v2", "System tray", "Global hotkeys", "Auto-launch"],
    },
    {
      category: "Infrastructure",
      icon: Database,
      items: ["Railway", "S3 storage", "WebSockets", "JWT auth"],
    },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Built With Modern Tech
          </h2>
          <p className="text-sm text-muted-foreground">
            Full TypeScript monorepo. Production-grade stack you can learn from.
          </p>
        </div>

        <div
          ref={ref}
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
        >
          {stack.map((group, i) => (
            <div
              key={i}
              className={cn(
                "rounded-xl border border-border/40 bg-card p-5 transition-all duration-300",
                inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
              )}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <group.icon className="h-4 w-4" />
                </div>
                <h3 className="text-sm font-semibold">{group.category}</h3>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item, j) => (
                  <span
                    key={j}
                    className="px-2 py-1 rounded-md bg-muted/50 border border-border/40 text-[11px] text-muted-foreground"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Button variant="outline" size="sm" className="h-9 px-4 text-xs" asChild>
            <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              View Source on GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}

/**
 * MCP Integration Section
 */
function MCPSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const mcpTools = [
    { category: "Tasks", tools: ["list_tasks", "create_task", "update_task", "complete_task", "schedule_task"] },
    { category: "Time Blocks", tools: ["list_time_blocks", "create_time_block", "update_time_block", "get_schedule_for_day"] },
    { category: "Subtasks", tools: ["list_subtasks", "create_subtask", "toggle_subtask", "delete_subtask"] },
  ];

  const codeExample = `// Create a task via MCP in Cursor
await mcp.callTool("open-sunsama", "create_task", {
  title: "Review PR #42",
  notes: "Check edge cases for auth flow",
  priority: "P1",
  scheduledDate: "2026-02-02"
});`;

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-4xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 mb-4 rounded-full border border-primary/30 bg-primary/10 text-[11px] font-medium text-primary">
            <Bot className="h-3 w-3" />
            AI-Native
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Let AI Agents Manage Your Schedule
          </h2>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            24+ MCP tools for programmatic task and schedule management.
            Works with Cursor, Claude Desktop, and any MCP-compatible client.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "transition-all duration-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          {/* MCP Tools Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {mcpTools.map((group, i) => (
              <div
                key={i}
                className="rounded-xl border border-border/40 bg-card p-4"
              >
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {group.category}
                </h4>
                <div className="space-y-1.5">
                  {group.tools.map((tool, j) => (
                    <div
                      key={j}
                      className="flex items-center gap-2 text-[12px] font-mono text-foreground"
                    >
                      <span className="text-primary">-</span>
                      {tool}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Code Example */}
          <div className="rounded-xl border border-border/40 bg-card overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-border/40 bg-muted/20">
              <Code2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11px] text-muted-foreground font-mono">cursor.ts</span>
            </div>
            <pre className="p-4 text-[12px] font-mono text-foreground overflow-x-auto">
              <code>{codeExample}</code>
            </pre>
          </div>

          {/* Integration logos */}
          <div className="flex items-center justify-center gap-6 mt-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-6 w-6 rounded bg-muted/50 flex items-center justify-center">
                <Terminal className="h-3 w-3" />
              </div>
              <span>Cursor</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-6 w-6 rounded bg-muted/50 flex items-center justify-center">
                <Bot className="h-3 w-3" />
              </div>
              <span>Claude</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="h-6 w-6 rounded bg-muted/50 flex items-center justify-center">
                <Braces className="h-3 w-3" />
              </div>
              <span>Any MCP Client</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Keyboard Shortcuts Section
 */
function KeyboardShortcutsSection() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const shortcuts = [
    { keys: ["Cmd", "K"], action: "Open command palette" },
    { keys: ["Cmd", "N"], action: "Create new task" },
    { keys: ["Cmd", "Enter"], action: "Start focus mode" },
    { keys: ["Cmd", "1"], action: "Switch to kanban view" },
    { keys: ["Cmd", "2"], action: "Switch to calendar view" },
    { keys: ["Cmd", ","], action: "Open settings" },
    { keys: ["↑", "↓"], action: "Navigate tasks" },
    { keys: ["Space"], action: "Toggle task completion" },
    { keys: ["E"], action: "Edit selected task" },
    { keys: ["Delete"], action: "Delete selected task" },
    { keys: ["P"], action: "Change priority" },
    { keys: ["Esc"], action: "Close modal / deselect" },
  ];

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container px-4 mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Never Leave Your Keyboard
          </h2>
          <p className="text-sm text-muted-foreground">
            Every action is a shortcut away. Zero mouse required.
          </p>
        </div>

        <div
          ref={ref}
          className={cn(
            "rounded-xl border border-border/40 bg-card overflow-hidden shadow-lg transition-all duration-500",
            inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          )}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2">
            {shortcuts.map((shortcut, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center justify-between px-4 py-3 border-b border-border/40 last:border-b-0",
                  "sm:odd:border-r sm:[&:nth-last-child(-n+2)]:border-b-0"
                )}
              >
                <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                <div className="flex items-center gap-1">
                  {shortcut.keys.map((key, j) => (
                    <kbd
                      key={j}
                      className="inline-flex items-center justify-center min-w-[24px] px-1.5 py-1 rounded text-[11px] font-mono font-medium bg-muted/50 border border-border/40 text-foreground"
                    >
                      {key === "Cmd" ? "⌘" : key}
                    </kbd>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[11px] text-muted-foreground mt-4">
          Press <kbd className="px-1 py-0.5 rounded bg-muted/50 border border-border/40 font-mono text-[10px]">?</kbd> in the app to see all shortcuts
        </p>
      </div>
    </section>
  );
}

/**
 * FAQ Section - Developer Specific
 */
function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "Is this like Linear for personal tasks?",
      answer: "Similar philosophy: keyboard-first, clean UI, fast. But Open Sunsama focuses on daily planning and time blocking rather than project/issue management. Think of it as 'Linear meets calendar' for your personal workflow. Works great alongside Linear for work tasks.",
    },
    {
      question: "Can I integrate with my dev workflow?",
      answer: "Yes. Full REST API for scripting, 24+ MCP tools for AI agents, and the desktop app has global hotkeys (Cmd+Shift+T to create a task from anywhere). Many developers use the MCP server with Cursor to create tasks while coding.",
    },
    {
      question: "What about Jira/GitHub issues?",
      answer: "Calendar sync is available for Google Calendar, Outlook, and iCloud. Direct Jira/GitHub integration is on the roadmap. For now, you can use the API or MCP tools to build custom integrations, or manually create tasks for issues you're working on today.",
    },
    {
      question: "How do MCP tools work?",
      answer: "MCP (Model Context Protocol) is Anthropic's standard for connecting AI to tools. Configure the Open Sunsama MCP server with your API key, and AI agents can create tasks, schedule time blocks, manage subtasks, etc. Works in Cursor, Claude Desktop, and any MCP-compatible client.",
    },
    {
      question: "Can I self-host this?",
      answer: "Yes. Full Docker setup available. PostgreSQL database, S3-compatible storage for attachments. The entire codebase is MIT-licensed on GitHub. Deploy to Railway, Render, your own servers—wherever you want.",
    },
    {
      question: "Is it actually free?",
      answer: "Completely free and open source. No premium tiers, no feature gates, no 'sign up to unlock'. The hosted version at opensunsama.com is free to use. If you want full control, self-host it. The code is public.",
    },
  ];

  return (
    <section className="py-16 border-t border-border/40 bg-muted/5">
      <div className="container px-4 mx-auto max-w-2xl">
        <div className="text-center mb-10">
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight mb-2">
            Developer FAQ
          </h2>
          <p className="text-sm text-muted-foreground">
            Questions developers actually ask.
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
          <Code2 className="h-3 w-3" />
          Built by Developers
        </div>

        <h2 className="text-2xl md:text-3xl font-semibold tracking-tight mb-3">
          Built by Developers. For Developers.
        </h2>
        <p className="text-sm text-muted-foreground mb-8 max-w-md mx-auto">
          Stop wrestling with bloated productivity apps.
          Start using a planner that respects your workflow.
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
              <Github className="h-4 w-4" />
              Star on GitHub
            </a>
          </Button>
        </div>

        <p className="mt-6 text-[11px] text-muted-foreground">
          No credit card required • MIT License • Self-hostable
        </p>
      </div>
    </section>
  );
}

/**
 * Daily Planner for Developers Landing Page
 * High-conversion page targeting developer-specific searches
 */
export default function ForDevelopersPage() {
  useSEO(SEO_CONFIGS.forAudiences.developers);
  const { ref: heroRef, inView: heroInView } = useInView({ triggerOnce: true });

  const faqItems = [
    {
      question: "Is this like Linear for personal tasks?",
      answer: "Similar philosophy: keyboard-first, clean UI, fast. But Open Sunsama focuses on daily planning and time blocking rather than project/issue management. Think of it as 'Linear meets calendar' for your personal workflow. Works great alongside Linear for work tasks.",
    },
    {
      question: "Can I integrate with my dev workflow?",
      answer: "Yes. Full REST API for scripting, 24+ MCP tools for AI agents, and the desktop app has global hotkeys (Cmd+Shift+T to create a task from anywhere). Many developers use the MCP server with Cursor to create tasks while coding.",
    },
    {
      question: "What about Jira/GitHub issues?",
      answer: "Calendar sync is available for Google Calendar, Outlook, and iCloud. Direct Jira/GitHub integration is on the roadmap. For now, you can use the API or MCP tools to build custom integrations, or manually create tasks for issues you're working on today.",
    },
    {
      question: "How do MCP tools work?",
      answer: "MCP (Model Context Protocol) is Anthropic's standard for connecting AI to tools. Configure the Open Sunsama MCP server with your API key, and AI agents can create tasks, schedule time blocks, manage subtasks, etc. Works in Cursor, Claude Desktop, and any MCP-compatible client.",
    },
    {
      question: "Can I self-host this?",
      answer: "Yes. Full Docker setup available. PostgreSQL database, S3-compatible storage for attachments. The entire codebase is MIT-licensed on GitHub. Deploy to Railway, Render, your own servers—wherever you want.",
    },
    {
      question: "Is it actually free?",
      answer: "Completely free and open source. No premium tiers, no feature gates, no 'sign up to unlock'. The hosted version at opensunsama.com is free to use. If you want full control, self-host it. The code is public.",
    },
  ];

  return (
    <>
      <FAQSchema items={faqItems} />
      <SoftwareApplicationSchema
        name="Open Sunsama"
        description="Daily planner built for developers. Keyboard-first workflow, command palette (Cmd+K), full REST API, 24+ MCP tools for AI automation, and open source on GitHub. Free forever."
        applicationCategory="ProductivityApplication"
        operatingSystem="Web, Windows, macOS, Linux"
        price="0"
        priceCurrency="USD"
        featureList={[
          "Command palette (Cmd+K)",
          "Keyboard-first navigation",
          "Full REST API access",
          "24+ MCP tools for AI agents",
          "TypeScript + React + Vite stack",
          "Self-hostable with Docker",
          "Focus mode with timer",
          "Global hotkeys (desktop app)",
          "Open source (MIT license)",
          "PostgreSQL + Drizzle ORM",
        ]}
        url="https://opensunsama.com/for/developers"
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
              <Code2 className="h-3 w-3 text-primary" />
              <span className="text-primary">Built by Developers</span>
            </div>

            {/* Headline */}
            <h1
              className={cn(
                "text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-tight mb-4 transition-all duration-300 delay-75",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              The Daily Planner{" "}
              <span className="text-primary">Built for Developers</span>
            </h1>

            {/* Subheadline */}
            <p
              className={cn(
                "text-sm md:text-base text-muted-foreground max-w-xl mx-auto mb-8 leading-relaxed transition-all duration-300 delay-100",
                heroInView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              )}
            >
              Keyboard-first workflow. Full API access. MCP tools for AI automation. 
              Open source on GitHub. Made by developers who understand your workflow.
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
                <a href="https://github.com/ShadowWalker2014/open-sunsama" target="_blank" rel="noopener noreferrer">
                  <Github className="h-4 w-4" />
                  View on GitHub
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
                <span>Full API Access</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-green-500" />
                <span>Self-hostable</span>
              </div>
            </div>
          </div>
        </section>

        {/* Why Developers Section */}
        <WhyDevelopersSection />

        {/* Visual Demo */}
        <VisualDemoSection />

        {/* Tech Stack */}
        <TechStackSection />

        {/* MCP Integration */}
        <MCPSection />

        {/* Keyboard Shortcuts */}
        <KeyboardShortcutsSection />

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
