import * as React from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import { RichText, SmartLink } from "@/components/marketing/rich-text";
import { BODY, CARD, CONTAINER, EYEBROW, H2, SECTION } from "@/components/marketing/tokens";
import type { CodeSnippet } from "@/content/marketing/for/developers";
import type { TextLink } from "@/content/marketing/types";
import { cn } from "@/lib/utils";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard
          ?.writeText(text)
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

/** Lines starting with "#" are comments; they're dimmed. */
function CodeLines({ code }: { code: string }) {
  return (
    <>
      {code.split("\n").map((line, i) => (
        <span key={i} className={cn("block min-h-[1.6em]", line.trimStart().startsWith("#") && "text-muted-foreground")}>
          {line}
        </span>
      ))}
    </>
  );
}

/**
 * The developer page's code card: one tab per way in (Claude Code, Cursor,
 * REST API, Docker), each with the exact lines from the docs and a copy button.
 */
export function CodeTabs({
  id,
  eyebrow,
  heading,
  lead,
  body,
  snippets,
  endpoints,
  links,
}: {
  id: string;
  eyebrow?: string;
  heading: string;
  lead?: string;
  body?: string[];
  snippets: CodeSnippet[];
  /** REST routes drawn as mono chips, e.g. "POST /tasks". */
  endpoints?: string[];
  links?: TextLink[];
}) {
  const [active, setActive] = React.useState(0);
  const tabRefs = React.useRef<Array<HTMLButtonElement | null>>([]);
  const snippet = snippets[active] ?? snippets[0];

  const onKeyDown = (event: React.KeyboardEvent) => {
    const step = event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const next = (active + step + snippets.length) % snippets.length;
    setActive(next);
    tabRefs.current[next]?.focus();
  };

  if (!snippet) return null;

  return (
    <section id={id} className={SECTION} aria-labelledby={`${id}-heading`}>
      <div className={CONTAINER}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:items-center lg:gap-14">
          <Reveal className="min-w-0">
            {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}
            <h2 id={`${id}-heading`} className={cn(H2, eyebrow && "mt-3")}>
              {heading}
            </h2>
            {lead && (
              <p className="mt-4 text-[16px] leading-relaxed text-foreground/80 md:text-[17px]">
                <RichText text={lead} />
              </p>
            )}
            {body && (
              <div className={cn(BODY, "mt-4 space-y-3")}>
                {body.map((paragraph) => (
                  <p key={paragraph}>
                    <RichText text={paragraph} />
                  </p>
                ))}
              </div>
            )}
            {endpoints && endpoints.length > 0 && (
              <ul className="mt-5 flex flex-wrap gap-1.5" aria-label="REST endpoints">
                {endpoints.map((endpoint) => (
                  <li key={endpoint}>
                    <code className="rounded-md border border-border/70 bg-background px-2 py-0.5 font-mono text-[12px] text-foreground/85">
                      {endpoint}
                    </code>
                  </li>
                ))}
              </ul>
            )}
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
          </Reveal>

          <Reveal delay={120} className="min-w-0">
            <div className={cn(CARD, "overflow-hidden shadow-[0_24px_64px_-32px_hsl(var(--shadow-color)/0.35)]")}>
              <div
                role="tablist"
                aria-label="Ways to connect"
                onKeyDown={onKeyDown}
                className="flex gap-1 overflow-x-auto border-b border-border/60 px-2 pt-2 [scrollbar-width:none]"
              >
                {snippets.map((item, i) => (
                  <button
                    key={item.id}
                    ref={(el) => {
                      tabRefs.current[i] = el;
                    }}
                    id={`${id}-tab-${item.id}`}
                    type="button"
                    role="tab"
                    aria-selected={i === active}
                    aria-controls={`${id}-panel`}
                    tabIndex={i === active ? 0 : -1}
                    onClick={() => setActive(i)}
                    className={cn(
                      "relative shrink-0 rounded-t-md px-3 pb-2.5 pt-1.5 text-[13px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                      i === active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {item.label}
                    {i === active && <span aria-hidden className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
                  </button>
                ))}
              </div>
              <div id={`${id}-panel`} role="tabpanel" aria-labelledby={`${id}-tab-${snippet.id}`}>
                <div className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-2">
                  <span className="flex min-w-0 items-center gap-2 truncate font-mono text-[12px] text-muted-foreground">
                    <Terminal className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {snippet.file}
                  </span>
                  <CopyButton text={snippet.code.split("\n").filter((l) => !l.trimStart().startsWith("#")).join("\n").trim()} />
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-all bg-muted/30 px-4 py-4 font-mono text-[12.5px] leading-[1.6] text-foreground sm:min-h-[248px] sm:whitespace-pre sm:break-normal sm:text-[13px]">
                  <code>
                    <CodeLines code={snippet.code} />
                  </code>
                </pre>
                <p className="border-t border-border/60 px-4 py-3 text-[13.5px] leading-relaxed text-muted-foreground">
                  <RichText text={snippet.note} />
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
