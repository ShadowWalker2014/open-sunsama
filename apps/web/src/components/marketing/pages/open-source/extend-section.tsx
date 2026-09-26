/**
 * "Extend it": the hosted MCP server (with a real recording of an agent
 * planning), the REST API with its real endpoints and key scopes, and a
 * coding agent working on the open code.
 */

import * as React from "react";
import { ArrowRight, Bot, Check, Code2, Copy, KeyRound } from "lucide-react";
import { BrowserFrame } from "@/components/landing/product-shot";
import { Reveal } from "@/components/landing/motion";
import { MCP_URL } from "@/components/marketing/agent-panel";
import { ClipPlayer } from "@/components/marketing/clip-player";
import { SmartLink } from "@/components/marketing/rich-text";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CARD, CONTAINER, FOCUS_RING, SECTION } from "@/components/marketing/tokens";
import { openSource } from "@/content/marketing/pages/open-source-task-manager";
import type { CustomSection } from "@/content/marketing/types";
import { cn } from "@/lib/utils";
import { TerminalCard } from "./terminal-card";

const METHOD: Record<string, string> = {
  GET: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400",
  POST: "bg-primary/12 text-primary",
  PATCH: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
};

const CARD_LINK = cn(
  "inline-flex items-center gap-1.5 rounded-sm text-[13.5px] font-medium text-foreground/80 hover:text-primary",
  FOCUS_RING
);

function CardTitle({ icon: Icon, title, detail }: { icon: typeof Bot; title: string; detail: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <h3 className="text-[17px] font-semibold leading-snug tracking-[-0.015em]">{title}</h3>
        <p className="mt-1 text-[14px] leading-relaxed text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function CopyUrl() {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(MCP_URL)
          .then(() => {
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1600);
          })
          .catch(() => {});
      }}
      className={cn(
        "inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-background px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground",
        FOCUS_RING
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="sr-only sm:not-sr-only">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

export function ExtendSection({ section }: { section: CustomSection }) {
  const { endpoints, scopes, toolGroups, codeLines, prompts } = openSource.extend;
  const toolCount = toolGroups.reduce((sum, group) => sum + group.count, 0);

  return (
    <section id={section.id} className={SECTION} aria-labelledby={`${section.id}-heading`}>
      <div className={CONTAINER}>
        <SectionHeading id={`${section.id}-heading`} eyebrow={section.eyebrow} heading={section.heading} lead={section.lead} />

        <div className="mt-14 grid gap-4 lg:grid-cols-2">
          {/* MCP */}
          <Reveal className="min-w-0 lg:col-span-2">
            <article className={cn(CARD, "grid overflow-hidden lg:grid-cols-[0.85fr_1.15fr]")}>
              <div className="min-w-0 p-5 md:p-7 lg:p-8">
                <CardTitle
                  icon={Bot}
                  title="Any AI agent, one URL"
                  detail="Claude, ChatGPT, Cursor or any MCP client signs in with OAuth. Self-hosted? Your server serves the same tools at your API address plus /mcp."
                />
                <div className="mt-6 flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-muted/40 py-2 pl-3.5 pr-2 dark:border-white/[0.07]">
                  <code className="min-w-0 truncate font-jetbrains text-[12px] text-foreground sm:text-[12.5px] xl:text-[13px]">{MCP_URL}</code>
                  <CopyUrl />
                </div>
                <div className="mt-5 flex flex-wrap items-baseline gap-x-4 gap-y-2">
                  <p className="flex items-baseline gap-1.5">
                    <span className="text-[28px] font-semibold leading-none tracking-[-0.03em] tabular-nums">{toolCount}</span>
                    <span className="text-[13px] font-medium text-muted-foreground">tools</span>
                  </p>
                  <ul className="flex flex-wrap gap-1.5">
                    {toolGroups.map((group) => (
                      <li
                        key={group.label}
                        className="rounded-md border border-border/70 bg-background px-2 py-0.5 text-[12px] text-foreground/80 dark:border-white/[0.08]"
                      >
                        {group.label} <span className="font-jetbrains font-semibold tabular-nums text-foreground">{group.count}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="mt-6 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Then ask</p>
                <ul className="mt-3 grid gap-2">
                  {prompts.map((prompt) => (
                    <li key={prompt} className="flex gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5 text-[13.5px] leading-snug">
                      <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
                <SmartLink href="/docs/mcp/overview" className={cn(CARD_LINK, "mt-6")}>
                  Connect your AI
                  <ArrowRight className="h-3.5 w-3.5" />
                </SmartLink>
              </div>
              <div className="relative min-w-0 border-t border-border/60 bg-muted/30 p-5 dark:border-white/[0.06] md:p-7 lg:flex lg:items-center lg:border-l lg:border-t-0 lg:p-8">
                <figure className="w-full">
                  <BrowserFrame>
                    <div className="relative aspect-[16/10] w-full overflow-hidden">
                      <ClipPlayer id="ai-plan" label="Claude plans the afternoon over MCP while tasks and time blocks appear live in Open Sunsama" controls />
                    </div>
                  </BrowserFrame>
                  <figcaption className="mt-3 text-center text-[12.5px] text-muted-foreground">
                    Claude plans the afternoon over MCP. The blocks appear live.
                  </figcaption>
                </figure>
              </div>
            </article>
          </Reveal>

          {/* REST API */}
          <Reveal delay={100} className="min-w-0">
            <article className={cn(CARD, "h-full p-5 md:p-7")}>
              <CardTitle
                icon={KeyRound}
                title="A REST API with scoped keys"
                detail="Create a key in Settings, pick its scopes, and script your day from cron, n8n or Home Assistant."
              />
              <div className="mt-5 overflow-hidden rounded-xl border border-border/70 dark:border-white/[0.07]">
                <div className="border-b border-border/60 bg-muted/40 px-3.5 py-2 font-jetbrains text-[11.5px] text-muted-foreground dark:border-white/[0.06]">
                  X-API-Key: os_live_…
                </div>
                <ul className="divide-y divide-border/50 dark:divide-white/[0.05]">
                  {endpoints.map((endpoint) => (
                    <li key={`${endpoint.method} ${endpoint.path}`} className="flex items-center gap-2.5 px-3.5 py-2">
                      <span
                        className={cn(
                          "w-[46px] shrink-0 rounded px-1 py-0.5 text-center font-jetbrains text-[10.5px] font-bold",
                          METHOD[endpoint.method]
                        )}
                      >
                        {endpoint.method}
                      </span>
                      <code className="min-w-0 truncate font-jetbrains text-[12.5px] text-foreground/85">{endpoint.path}</code>
                    </li>
                  ))}
                </ul>
              </div>
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="API key scopes">
                {scopes.map((scope) => (
                  <li key={scope} className="rounded-full bg-muted px-2 py-0.5 font-jetbrains text-[11px] text-muted-foreground">
                    {scope}
                  </li>
                ))}
              </ul>
              <SmartLink href="/docs/api/authentication" className={cn(CARD_LINK, "mt-5")}>
                API reference
                <ArrowRight className="h-3.5 w-3.5" />
              </SmartLink>
            </article>
          </Reveal>

          {/* Change the code */}
          <Reveal delay={180} className="min-w-0">
            <article className={cn(CARD, "flex h-full flex-col p-5 md:p-7")}>
              <CardTitle
                icon={Code2}
                title="Your coding agent can change the planner"
                detail="The code is public, so Claude Code or Cursor can read it and build the feature you want."
              />
              <TerminalCard className="mt-5 flex-1" tabs={[{ id: "code", label: "Code", lines: codeLines }]} title="~/open-sunsama" />
              <SmartLink href={openSource.github} className={cn(CARD_LINK, "mt-5")}>
                Read the code on GitHub
                <ArrowRight className="h-3.5 w-3.5" />
              </SmartLink>
            </article>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
