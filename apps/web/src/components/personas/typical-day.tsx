import { Bot, CalendarClock, CheckCheck, CloudOff, LayoutGrid, Timer, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import { RichText, SmartLink } from "@/components/marketing/rich-text";
import { BODY, CONTAINER, EYEBROW, H2, SECTION } from "@/components/marketing/tokens";
import type { DayEntry, DayTone } from "@/content/marketing/for/typical-day";
import type { TextLink } from "@/content/marketing/types";
import { cn } from "@/lib/utils";

/**
 * "A typical day": an example day drawn like the app's own day calendar.
 * Each moment is a block with the app's 3px left bar and tinted fill
 * (components/calendar/time-block.tsx); synced meetings are hatched because
 * they are read-only, and the moment the plan slips is dashed.
 */

const TONES: Record<DayTone, { color: string; icon: LucideIcon }> = {
  plan: { color: "#F59E0B", icon: LayoutGrid },
  block: { color: "#F97316", icon: CalendarClock },
  focus: { color: "#F43F5E", icon: Timer },
  agent: { color: "#A855F7", icon: Bot },
  meeting: { color: "#64748B", icon: Users },
  slip: { color: "#64748B", icon: CloudOff },
  done: { color: "#6366F1", icon: CheckCheck },
};

function hexToRgba(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function DayBlock({ entry }: { entry: DayEntry }) {
  const tone = TONES[entry.tone];
  const Icon = tone.icon;
  const slip = entry.tone === "slip";
  const meeting = entry.tone === "meeting";
  return (
    <div
      className={cn(
        "relative min-w-0 rounded-md px-4 py-3.5",
        slip ? "border border-dashed border-border bg-transparent" : "border-l-[3px]"
      )}
      style={
        slip
          ? undefined
          : {
              borderLeftColor: hexToRgba(tone.color, 0.7),
              backgroundColor: hexToRgba(tone.color, meeting ? 0.08 : 0.11),
              backgroundImage: meeting
                ? `repeating-linear-gradient(135deg, ${hexToRgba(tone.color, 0.09)} 0 6px, transparent 6px 12px)`
                : undefined,
            }
      }
    >
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <h3 className={cn("text-[15.5px] font-semibold leading-snug tracking-[-0.01em]", slip && "text-muted-foreground")}>
          {entry.title}
        </h3>
        <span
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-background/70 px-2 py-0.5 text-[11.5px] font-medium text-foreground/75 ring-1 ring-inset ring-border/60"
        >
          <Icon className="h-3 w-3" style={{ color: tone.color }} aria-hidden />
          {entry.tag}
        </span>
      </div>
      <p className="mt-1.5 text-[14.5px] leading-relaxed text-muted-foreground">
        <RichText text={entry.body} />
      </p>
    </div>
  );
}

export function TypicalDay({
  id,
  eyebrow,
  heading,
  lead,
  note,
  entries,
  links,
}: {
  id: string;
  eyebrow?: string;
  heading: string;
  lead?: string;
  /** Small print under the lead, e.g. "An example day, not a measurement." */
  note?: string;
  entries: DayEntry[];
  links?: TextLink[];
}) {
  return (
    <section id={id} className={SECTION} aria-labelledby={`${id}-heading`}>
      <div className={CONTAINER}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
          <Reveal className="min-w-0 lg:sticky lg:top-28 lg:self-start">
            {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}
            <h2 id={`${id}-heading`} className={cn(H2, eyebrow && "mt-3")}>
              {heading}
            </h2>
            {lead && (
              <p className={cn(BODY, "mt-4")}>
                <RichText text={lead} />
              </p>
            )}
            {note && <p className="mt-4 text-[13px] leading-relaxed text-muted-foreground/80">{note}</p>}
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

          <div className="relative min-w-0">
            {/* The hour rail, like the app's day view */}
            <span aria-hidden className="absolute bottom-3 left-[76px] top-3 w-px bg-border/80 sm:left-[88px]" />
            <ol className="relative" aria-label="An example day, hour by hour">
            {entries.map((entry, i) => (
              <Reveal
                as="li"
                key={`${entry.time}-${entry.title}`}
                delay={Math.min(i, 4) * 60}
                className="relative grid grid-cols-[64px_minmax(0,1fr)] gap-x-6 pb-4 last:pb-0 sm:grid-cols-[76px_minmax(0,1fr)]"
              >
                <p className="pt-3.5 text-right font-mono text-[12.5px] tabular-nums leading-snug text-muted-foreground sm:text-[13px]">
                  {entry.time.split(" - ").map((part, j) => (
                    <span key={part} className={cn("block", j > 0 && "text-muted-foreground/60")}>
                      {part}
                    </span>
                  ))}
                </p>
                <span
                  aria-hidden
                  className="absolute left-[72px] top-[18px] h-2 w-2 rounded-full ring-4 ring-background sm:left-[84px]"
                  style={{ backgroundColor: entry.tone === "slip" ? "hsl(var(--border))" : TONES[entry.tone].color }}
                />
                <DayBlock entry={entry} />
              </Reveal>
            ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
