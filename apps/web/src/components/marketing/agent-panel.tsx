import * as React from "react";
import { Bot, Check, Copy, Terminal } from "lucide-react";
import { Clip } from "@/components/blog/media";
import { Reveal } from "@/components/landing/motion";
import { VideoCard, VideoLightbox } from "@/components/landing/video-lightbox";
import type { TextLink } from "@/content/marketing/types";
import { cn } from "@/lib/utils";
import { RichText, SmartLink } from "./rich-text";
import { BODY, CARD, CONTAINER, EYEBROW, H2, MEDIA_WRAP, SECTION } from "./tokens";

export const MCP_URL = "https://api.opensunsama.com/mcp";

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
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md border border-border/70 bg-background px-2 text-[12px] font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

/**
 * "Any AI agent can do this for you": the MCP URL to paste, prompts to try,
 * the tools the agent calls, the narrated AI video and a real recording.
 */
export function AgentPanel({
  id,
  eyebrow = "AI native",
  heading,
  lead,
  body,
  prompts,
  tools,
  clip,
  clipCaption,
  links,
}: {
  id: string;
  eyebrow?: string;
  heading: string;
  lead?: string;
  body: string[];
  prompts: string[];
  tools?: string[];
  clip?: string;
  clipCaption?: string;
  links?: TextLink[];
}) {
  return (
    <section id={id} className={SECTION} aria-labelledby={`${id}-heading`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-full overflow-hidden" aria-hidden>
        <div className="absolute right-[-10%] top-[10%] h-[420px] w-[560px] rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.1),transparent)] blur-2xl" />
      </div>
      <div className={CONTAINER}>
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <Reveal className="min-w-0">
            <p className={EYEBROW}>{eyebrow}</p>
            <h2 id={`${id}-heading`} className={cn(H2, "mt-3")}>
              {heading}
            </h2>
            {lead && (
              <p className="mt-4 text-[16px] leading-relaxed text-foreground/80 md:text-[17px]">
                <RichText text={lead} />
              </p>
            )}
            <div className={cn(BODY, "mt-4 space-y-3")}>
              {body.map((paragraph) => (
                <p key={paragraph}>
                  <RichText text={paragraph} />
                </p>
              ))}
            </div>
            {links && links.length > 0 && (
              <p className="mt-5 flex flex-wrap gap-x-4 gap-y-1 text-[14px]">
                {links.map((link) => (
                  <SmartLink
                    key={link.href}
                    href={link.href}
                    className="rounded-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    {link.label}
                  </SmartLink>
                ))}
              </p>
            )}
            <div className="mt-7 max-w-md">
              <VideoLightbox id="ai">
                <VideoCard id="ai" label="Let Claude or ChatGPT plan your day" />
              </VideoLightbox>
            </div>
          </Reveal>

          <Reveal delay={120} className="min-w-0">
            <div className={cn(CARD, "overflow-hidden shadow-[0_24px_64px_-32px_hsl(var(--shadow-color)/0.35)]")}>
              <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2.5">
                <span className="flex items-center gap-2 text-[12px] text-muted-foreground">
                  <Terminal className="h-3.5 w-3.5" />
                  MCP server URL
                </span>
                <CopyUrl />
              </div>
              <div className="overflow-x-auto px-4 py-4 font-mono text-[13px] text-foreground sm:text-[14px]">{MCP_URL}</div>
              <div className="border-t border-border/60 px-4 py-4">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Then ask</p>
                <ul className="mt-3 space-y-2">
                  {prompts.map((prompt) => (
                    <li key={prompt} className="flex gap-2.5 rounded-lg bg-muted/50 px-3 py-2.5 text-[14px] leading-snug">
                      <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>
              {tools && tools.length > 0 && (
                <div className="border-t border-border/60 px-4 py-4">
                  <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">Tools it calls</p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tools.map((tool) => (
                      <code
                        key={tool}
                        className="rounded-md border border-border/70 bg-background px-2 py-0.5 font-mono text-[12px] text-foreground/85"
                      >
                        {tool}
                      </code>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>

        {clip && (
          <Reveal className={cn(MEDIA_WRAP, "mx-auto mt-14 max-w-4xl")}>
            <Clip id={clip} caption={clipCaption ?? "An AI agent plans the day over MCP. Tasks and time blocks appear live."} />
          </Reveal>
        )}
      </div>
    </section>
  );
}
