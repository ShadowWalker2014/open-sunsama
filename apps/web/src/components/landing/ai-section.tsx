/**
 * "Connect your AI" section: three setup steps beside a live-feeling demo in
 * which an assistant calls Open Sunsama's MCP tools and the time blocks land
 * on a timeline drawn with the app's own block styles (see TimeBlock).
 */

import * as React from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, Copy, KeyRound, Link2, MessageSquareText, RotateCcw, ShieldCheck } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";
import { Reveal, useReducedMotion } from "./motion";

const MCP_URL = "https://api.opensunsama.com/mcp";
const HOUR = 56; // px per hour in the mini timeline
const START_HOUR = 12;
const END_HOUR = 17;

interface Block {
  title: string;
  start: number; // hours, e.g. 13.25
  end: number;
  color: string;
}

const EXISTING: Block[] = [{ title: "Lunch", start: 12, end: 12.75, color: "#10B981" }];

const PLANNED: Array<Block & { tool: string }> = [
  { title: "Draft the one-page narrative", start: 13, end: 14, color: "#EF4444", tool: "create_time_block" },
  { title: "Send pre-read to leadership", start: 14.25, end: 14.75, color: "#F59E0B", tool: "create_time_block" },
  { title: "Hiring plan", start: 15, end: 16, color: "#8B5CF6", tool: "create_time_block" },
];

const READ_CALLS = ["list_tasks", "get_schedule_for_day"];

const REPLY =
  "Done. I blocked 1–4pm: the one-page narrative first while you're fresh, the pre-read right after, then the hiring plan. 4pm stays open for inbox.";

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function formatTime(hours: number, withPeriod: boolean): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  const display = ((h + 11) % 12) + 1;
  const period = h >= 12 ? "PM" : "AM";
  return `${display}:${m.toString().padStart(2, "0")}${withPeriod ? ` ${period}` : ""}`;
}

function hourLabel(h: number): string {
  const display = ((h + 11) % 12) + 1;
  return `${display}${h >= 12 ? "pm" : "am"}`;
}

/** Mirrors components/calendar/time-block.tsx so the demo looks exactly like the app. */
function DemoBlock({ block, visible, fresh }: { block: Block; visible: boolean; fresh?: boolean }) {
  const top = (block.start - START_HOUR) * HOUR;
  const height = (block.end - block.start) * HOUR;
  const compact = height < 48;
  return (
    <div
      className={cn(
        "absolute left-1 right-1 z-10 my-0.5 origin-top rounded-md border-l-[3px] transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
        visible ? "opacity-100 [transform:none]" : "opacity-0 [transform:scaleY(0.6)_translateY(-6px)]",
        fresh && visible && "animate-[landing-ring_1.6s_ease-out_1]"
      )}
      style={{
        top,
        height: Math.max(height - 4, 20),
        backgroundColor: hexToRgba(block.color, 0.15),
        borderColor: hexToRgba(block.color, 0.6),
        ["--ring" as string]: hexToRgba(block.color, 0.45),
      }}
    >
      <div className={cn("flex h-full flex-col overflow-hidden px-2", compact ? "py-0.5" : "py-1")}>
        <p className={cn("truncate font-medium text-foreground", compact ? "text-xs" : "text-sm")}>{block.title}</p>
        {!compact && (
          <p className="truncate text-xs text-muted-foreground">
            {formatTime(block.start, false)} - {formatTime(block.end, true)}
          </p>
        )}
      </div>
    </div>
  );
}

function MiniTimeline({ shown }: { shown: number }) {
  const hours = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => START_HOUR + i);
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-baseline justify-between border-b border-border/60 px-4 py-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Tue</p>
          <p className="text-[15px] font-semibold leading-tight">Sep 22</p>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {EXISTING.length + shown} blocks
        </p>
      </div>
      <div className="relative flex flex-1 overflow-hidden">
        <div className="w-12 flex-shrink-0 border-r bg-muted/30">
          {hours.map((h) => (
            <div key={h} className="relative border-b border-border/50" style={{ height: HOUR }}>
              {h !== START_HOUR && (
                <span className="absolute -top-2 right-2 text-xs font-medium text-muted-foreground">{hourLabel(h)}</span>
              )}
            </div>
          ))}
        </div>
        <div className="relative flex-1">
          {hours.map((h) => (
            <React.Fragment key={h}>
              <div className="absolute left-0 right-0 border-b border-border/50" style={{ top: (h - START_HOUR + 1) * HOUR }} />
              <div className="absolute left-0 right-0 border-b border-border/15" style={{ top: (h - START_HOUR + 0.5) * HOUR }} />
            </React.Fragment>
          ))}
          {EXISTING.map((block) => (
            <DemoBlock key={block.title} block={block} visible />
          ))}
          {PLANNED.map((block, i) => (
            <DemoBlock key={block.title} block={block} visible={i < shown} fresh />
          ))}
          {/* Now line, as in the app. */}
          <div className="absolute left-0 right-0 z-30 flex items-center" style={{ top: (12.55 - START_HOUR) * HOUR }}>
            <div className="-ml-1.5 h-3 w-3 rounded-full bg-red-500 shadow-sm" />
            <div className="h-0.5 flex-1 bg-red-500 shadow-sm" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ToolCall({ name, detail, state }: { name: string; detail?: string; state: "hidden" | "running" | "done" }) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-2.5 py-1.5 text-[12px] transition-[opacity,transform] duration-300",
        state === "hidden" ? "h-0 -translate-y-1 overflow-hidden border-transparent py-0 opacity-0" : "opacity-100"
      )}
    >
      <span
        className={cn(
          "flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full",
          state === "done" ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
        )}
      >
        {state === "done" ? (
          <Check className="h-3 w-3" />
        ) : (
          <span className="h-3 w-3 animate-spin rounded-full border-[1.5px] border-current border-t-transparent" />
        )}
      </span>
      <span className="font-mono text-[11.5px] font-medium text-foreground">{name}</span>
      {detail && <span className="truncate text-muted-foreground">{detail}</span>}
      <span className="ml-auto flex-shrink-0 text-[10px] text-muted-foreground">Open Sunsama</span>
    </div>
  );
}

/**
 * Step machine for the demo. Each tick reveals the next thing; the whole
 * sequence runs once when scrolled into view and can be replayed.
 */
const SCRIPT_LENGTH = READ_CALLS.length * 2 + PLANNED.length * 2 + 2;

function useDemoScript(active: boolean, reduced: boolean) {
  const [step, setStep] = React.useState(0);
  const [run, setRun] = React.useState(0);

  React.useEffect(() => {
    if (!active) return;
    if (reduced) {
      setStep(SCRIPT_LENGTH);
      return;
    }
    setStep(0);
    const timers: number[] = [];
    let t = 700;
    for (let s = 1; s <= SCRIPT_LENGTH; s++) {
      timers.push(window.setTimeout(() => setStep(s), t));
      t += s % 2 === 1 ? 520 : 380;
    }
    return () => timers.forEach(window.clearTimeout);
  }, [active, reduced, run]);

  return { step, replay: () => setRun((r) => r + 1), done: step >= SCRIPT_LENGTH };
}

export function AssistantDemo() {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.35 });
  const { step, replay, done } = useDemoScript(inView, reduced);

  // Step layout: [read calls: start/done]... [planned calls: start/done]... reply, finished
  const callState = (index: number): "hidden" | "running" | "done" => {
    const startStep = index * 2 + 1;
    if (step < startStep) return "hidden";
    return step === startStep ? "running" : "done";
  };
  const plannedShown = PLANNED.filter((_, i) => callState(READ_CALLS.length + i) === "done").length;
  const replyVisible = step >= SCRIPT_LENGTH - 1;

  return (
    <div ref={ref} className="relative">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[32px] bg-[radial-gradient(50%_50%_at_60%_40%,hsl(var(--primary)/0.14),transparent_70%)] blur-2xl" />
      <div className="grid overflow-hidden rounded-2xl border border-border/70 bg-background shadow-[0_24px_80px_-28px_rgb(0_0_0/0.35)] dark:border-white/10 sm:grid-cols-[1.3fr_1fr]">
        {/* Chat */}
        <div className="flex min-h-[420px] min-w-0 flex-col border-b border-border/60 sm:border-b-0 sm:border-r">
          <div className="flex items-center justify-between border-b border-border/60 px-4 py-3">
            <div className="flex items-center gap-2">
              <MessageSquareText className="h-4 w-4 text-muted-foreground" />
              <span className="text-[13px] font-semibold">Your AI assistant</span>
            </div>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Open Sunsama connected
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-primary px-3.5 py-2 text-[13.5px] leading-snug text-primary-foreground shadow-sm">
              Plan my afternoon around the roadmap review.
            </div>
            <div className="flex flex-col gap-1.5">
              {READ_CALLS.map((name, i) => (
                <ToolCall key={name} name={name} detail={i === 0 ? "Today" : "Tue, Sep 22"} state={callState(i)} />
              ))}
              {PLANNED.map((block, i) => (
                <ToolCall
                  key={block.title}
                  name={block.tool}
                  detail={`${block.title} · ${formatTime(block.start, false)}–${formatTime(block.end, true)}`}
                  state={callState(READ_CALLS.length + i)}
                />
              ))}
            </div>
            <div
              className={cn(
                "max-w-[92%] rounded-2xl rounded-bl-md bg-muted/60 px-3.5 py-2 text-[13.5px] leading-snug text-foreground transition-[opacity,transform] duration-500",
                replyVisible ? "opacity-100 [transform:none]" : "translate-y-1 opacity-0"
              )}
            >
              {REPLY}
            </div>
            <div className="mt-auto flex items-center justify-between pt-2">
              <p className="text-[11px] text-muted-foreground">Illustration of the connector's real tool calls</p>
              <button
                type="button"
                onClick={replay}
                disabled={!done}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-0"
              >
                <RotateCcw className="h-3 w-3" />
                Replay
              </button>
            </div>
          </div>
        </div>
        {/* Timeline */}
        <div className="h-[340px] min-w-0 bg-background sm:h-auto">
          <MiniTimeline shown={plannedShown} />
        </div>
      </div>
    </div>
  );
}

function CopyUrl() {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        await navigator.clipboard.writeText(MCP_URL);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
      }}
      className="group mt-2 flex w-full max-w-sm items-center gap-2 rounded-lg border border-border/70 bg-muted/40 px-3 py-2 text-left font-mono text-[12.5px] transition-colors hover:border-primary/40"
    >
      <span className="w-0 min-w-0 flex-1 truncate">{MCP_URL}</span>
      <span className="ml-auto flex items-center gap-1 font-sans text-[11px] font-medium text-muted-foreground group-hover:text-foreground">
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}

const STEPS = [
  {
    icon: Link2,
    title: "Paste one URL",
    body: "Add it as a connector in Claude, a plugin in ChatGPT, or an MCP server in Cursor, VS Code, or Claude Code.",
    extra: <CopyUrl />,
  },
  {
    icon: KeyRound,
    title: "Sign in and allow access",
    body: "Standard OAuth: no API keys to paste. See exactly what it can touch, and disconnect anytime in Settings.",
  },
  {
    icon: MessageSquareText,
    title: "Ask in plain language",
    body: "“Move everything that isn't a P0 to tomorrow.” “Block two hours for the launch plan.” It asks before deleting anything.",
  },
];

export function AiSection() {
  return (
    <section id="ai" className="relative scroll-mt-16 border-t border-border/50 py-24 md:py-32">
      <div className="container mx-auto grid max-w-6xl items-center gap-14 px-4 xl:grid-cols-[0.85fr_1.15fr]">
        <div className="mx-auto min-w-0 max-w-2xl xl:mx-0 xl:max-w-none">
          <Reveal>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">AI native</p>
            <h2 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[44px]">
              Control your planner from any agent.
            </h2>
            <p className="mt-4 text-[16px] leading-relaxed text-muted-foreground">
              Claude, ChatGPT, Cursor, Claude Code, VS Code, or an agent you built yourself. Connect it once and
              it can read your plan, create and prioritize tasks, time-block your day, and check things off.
            </p>
          </Reveal>

          <ol className="mt-9 space-y-6">
            {STEPS.map((step, i) => (
              <Reveal key={step.title} as="li" delay={120 + i * 110} className="flex gap-4">
                <div className="relative flex flex-col items-center">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-border/70 bg-background text-primary shadow-sm">
                    <step.icon className="h-4 w-4" />
                  </span>
                  {i < STEPS.length - 1 && <span className="mt-2 w-px flex-1 bg-border" />}
                </div>
                <div className="min-w-0 pb-1">
                  <p className="text-[15px] font-semibold">
                    <span className="mr-1.5 text-muted-foreground">{i + 1}.</span>
                    {step.title}
                  </p>
                  <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{step.body}</p>
                  {step.extra}
                </div>
              </Reveal>
            ))}
          </ol>

          <Reveal delay={480} className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/docs/$"
              params={{ _splat: "mcp/overview" }}
              className="inline-flex items-center gap-1.5 text-[14px] font-medium text-primary hover:underline"
            >
              Setup guides for every assistant
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-[12px] text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
              OAuth 2.1 · scoped, revocable access
            </span>
          </Reveal>
        </div>

        <Reveal delay={150} y={28} className="mx-auto w-full min-w-0 max-w-3xl xl:max-w-none">
          <AssistantDemo />
        </Reveal>
      </div>
    </section>
  );
}
