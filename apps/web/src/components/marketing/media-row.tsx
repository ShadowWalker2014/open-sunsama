import { ArrowRight, Check } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import type { MediaRow as MediaRowData } from "@/content/marketing/types";
import { cn } from "@/lib/utils";
import { MediaBlock } from "./media";
import { RichText, SmartLink } from "./rich-text";
import { SectionHeading } from "./section-heading";
import { BODY, CONTAINER, H3, SECTION } from "./tokens";

/** Text beside a real clip or screenshot. `flip` puts the media on the left (md and up). */
export function MediaRow({ row, flip = false }: { row: MediaRowData; flip?: boolean }) {
  return (
    <div className="grid items-center gap-6 md:grid-cols-5 md:gap-12">
      <Reveal className={cn("min-w-0 md:col-span-2", flip && "md:order-2")}>
        <h3 className={H3}>{row.title}</h3>
        <div className={cn(BODY, "mt-3 space-y-3")}>
          {row.body.map((paragraph) => (
            <p key={paragraph}>
              <RichText text={paragraph} />
            </p>
          ))}
        </div>
        {row.bullets && (
          <ul className="mt-4 space-y-2">
            {row.bullets.map((bullet) => (
              <li key={bullet} className="flex gap-2.5 text-[14.5px] leading-relaxed text-foreground/85">
                <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2.5} />
                <span>
                  <RichText text={bullet} />
                </span>
              </li>
            ))}
          </ul>
        )}
        {row.link && (
          <SmartLink
            href={row.link.href}
            className="mt-5 inline-flex items-center gap-1.5 rounded-sm text-[14px] font-medium text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {row.link.label}
            <ArrowRight className="h-3.5 w-3.5" />
          </SmartLink>
        )}
      </Reveal>
      <Reveal delay={100} y={24} className={cn("min-w-0 md:col-span-3", flip && "md:order-1")}>
        <MediaBlock media={row.media} />
      </Reveal>
    </div>
  );
}

/** A section of alternating MediaRows. */
export function MediaRows({
  id,
  eyebrow,
  heading,
  lead,
  rows,
}: {
  id: string;
  eyebrow?: string;
  heading: string;
  lead?: string;
  rows: MediaRowData[];
}) {
  return (
    <section id={id} className={SECTION} aria-labelledby={`${id}-heading`}>
      <div className={CONTAINER}>
        <SectionHeading id={`${id}-heading`} eyebrow={eyebrow} heading={heading} lead={lead} />
        <div className="mt-14 space-y-16 md:mt-16 md:space-y-24">
          {rows.map((row, i) => (
            <MediaRow key={row.title} row={row} flip={i % 2 === 1} />
          ))}
        </div>
      </div>
    </section>
  );
}
