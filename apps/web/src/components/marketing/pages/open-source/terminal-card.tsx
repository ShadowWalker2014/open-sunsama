/**
 * A dark terminal card, the same surface as the home page's open-source block.
 * Lines starting with "$ " are commands (copyable), "# " lines are comments.
 * Lines type in one after another the first time the card scrolls into view
 * and again when you switch tabs; with reduced motion they simply appear.
 */

import * as React from "react";
import { Check, Copy } from "lucide-react";
import { useInView } from "react-intersection-observer";
import { cn } from "@/lib/utils";

export interface TerminalTab {
  id: string;
  label: string;
  lines: string[];
}

function CopyButton({ text, label }: { text: string; label: string }) {
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
      aria-label={copied ? "Copied" : label}
      className="inline-flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2 text-[11.5px] font-medium text-white/55 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(24_95%_60%)]"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="hidden sm:inline">{copied ? "Copied" : "Copy"}</span>
    </button>
  );
}

function Line({ line, index, animate }: { line: string; index: number; animate: boolean }) {
  const command = line.startsWith("$ ");
  const comment = line.startsWith("# ");
  return (
    <div
      className={cn(
        "flex gap-2.5 [overflow-wrap:anywhere]",
        animate && "motion-safe:animate-[landing-line_500ms_cubic-bezier(0.2,0.8,0.2,1)_both]",
        comment ? "text-white/40" : "text-white/90"
      )}
      style={animate ? { animationDelay: `${index * 160}ms` } : undefined}
    >
      {command ? (
        <>
          <span className="select-none text-[hsl(24_95%_60%)]" aria-hidden>
            $
          </span>
          <span className="min-w-0">{line.slice(2)}</span>
        </>
      ) : (
        <span className="min-w-0">{line}</span>
      )}
    </div>
  );
}

export function TerminalCard({
  tabs,
  title,
  className,
  minLines = 0,
}: {
  tabs: TerminalTab[];
  /** Shown in the title bar when there is only one tab. */
  title?: string;
  className?: string;
  /** Reserve height for this many lines so switching tabs never shifts the page. */
  minLines?: number;
}) {
  const [activeId, setActiveId] = React.useState(tabs[0]!.id);
  const { ref, inView } = useInView({ triggerOnce: true, rootMargin: "0px 0px -10% 0px" });
  const active = tabs.find((tab) => tab.id === activeId) ?? tabs[0]!;
  const commands = active.lines
    .filter((line) => line.startsWith("$ "))
    .map((line) => line.slice(2))
    .join("\n");
  const baseId = React.useId();

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden rounded-xl border border-white/10 bg-[hsl(228_14%_7%)] text-[hsl(220_13%_93%)] shadow-[0_24px_64px_-28px_rgb(0_0_0/0.55)] dark:bg-[hsl(228_16%_5%)]",
        className
      )}
    >
      <div className="flex items-center gap-3 border-b border-white/10 py-1.5 pl-3.5 pr-1.5">
        <div className="flex shrink-0 gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
        </div>
        {tabs.length > 1 ? (
          <div role="tablist" aria-label="Commands" className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                id={`${baseId}-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={tab.id === active.id}
                aria-controls={`${baseId}-panel`}
                onClick={() => setActiveId(tab.id)}
                className={cn(
                  "shrink-0 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(24_95%_60%)]",
                  tab.id === active.id ? "bg-white/10 text-white" : "text-white/45 hover:text-white/80"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : (
          <span className="min-w-0 flex-1 truncate font-jetbrains text-[11.5px] text-white/45">{title}</span>
        )}
        {commands && <CopyButton text={commands} label={`Copy ${active.label.toLowerCase()} commands`} />}
      </div>
      <div
        id={`${baseId}-panel`}
        role={tabs.length > 1 ? "tabpanel" : undefined}
        aria-labelledby={tabs.length > 1 ? `${baseId}-${active.id}` : undefined}
        className="px-4 py-4 font-jetbrains text-[12px] leading-[1.75] sm:px-5 sm:text-[12.5px]"
        style={minLines ? { minHeight: `calc(${minLines} * 1.75em + 2rem)` } : undefined}
      >
        <div key={active.id} className={cn(!inView && "invisible")}>
          {active.lines.map((line, i) => (
            <Line key={`${active.id}-${i}`} line={line} index={i} animate={inView} />
          ))}
          <span
            className="mt-1 inline-block h-[1.05em] w-[0.55em] translate-y-[0.15em] bg-white/70 motion-safe:animate-[landing-caret_1s_steps(1)_infinite]"
            aria-hidden
          />
        </div>
      </div>
    </div>
  );
}
