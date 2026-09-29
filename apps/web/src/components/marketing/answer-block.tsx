import { Check } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import { cn } from "@/lib/utils";
import { RichText } from "./rich-text";
import { CONTAINER, EYEBROW, H2, SECTION } from "./tokens";

/**
 * The direct answer to the page's query, right under the hero: a heading that
 * states the answer, two or three short paragraphs, and a key-points card.
 * AI answers and featured snippets quote this block.
 */
export function AnswerBlock({
  id,
  eyebrow,
  heading,
  body,
  points,
  pointsTitle = "Key points",
  className,
}: {
  id: string;
  eyebrow?: string;
  heading: string;
  body: string[];
  points?: string[];
  pointsTitle?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn(SECTION, className)} aria-labelledby={`${id}-heading`}>
      <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16")}>
        <Reveal className="min-w-0">
          {eyebrow && <p className={EYEBROW}>{eyebrow}</p>}
          <h2 id={`${id}-heading`} className={cn(H2, eyebrow && "mt-3")}>
            {heading}
          </h2>
          <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-foreground/80 md:text-[17px]">
            {body.map((paragraph) => (
              <p key={paragraph}>
                <RichText text={paragraph} />
              </p>
            ))}
          </div>
        </Reveal>
        {points && points.length > 0 && (
          <Reveal delay={120} className="min-w-0 lg:pt-2">
            <div className="relative overflow-hidden rounded-2xl border border-primary/25 bg-primary/[0.035] p-6 dark:bg-primary/[0.06] md:p-7">
              <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.18),transparent)] blur-xl" />
              <p className="relative text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">{pointsTitle}</p>
              <ul className="relative mt-4 space-y-3.5">
                {points.map((point) => (
                  <li key={point} className="flex gap-3 text-[15px] leading-relaxed text-foreground/85">
                    <span className="mt-[3px] flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>
                      <RichText text={point} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}
