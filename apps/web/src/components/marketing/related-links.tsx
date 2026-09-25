import { ArrowUpRight } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import type { RelatedLink } from "@/content/marketing/types";
import { cn } from "@/lib/utils";
import { SmartLink } from "./rich-text";
import { SectionHeading } from "./section-heading";
import { CONTAINER, SECTION } from "./tokens";

const KIND_LABEL: Record<RelatedLink["kind"], string> = {
  feature: "Feature",
  compare: "Compare",
  persona: "For you",
  guide: "Guide",
  docs: "Docs",
};

/** Cards to related features, comparisons, persona pages, guides and docs. */
export function RelatedLinks({
  id = "related",
  heading,
  lead,
  links,
  className,
}: {
  id?: string;
  heading: string;
  lead?: string;
  links: RelatedLink[];
  className?: string;
}) {
  return (
    <section id={id} className={cn(SECTION, className)} aria-labelledby={`${id}-heading`}>
      <div className={CONTAINER}>
        <SectionHeading id={`${id}-heading`} heading={heading} lead={lead} align="left" />
        <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {links.map((link, i) => (
            <Reveal as="li" key={link.href} delay={(i % 3) * 60} className="min-w-0">
              <SmartLink
                href={link.href}
                className="group relative flex h-full flex-col rounded-2xl border border-border/70 bg-card p-5 transition-[border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_16px_40px_-24px_hsl(var(--shadow-color)/0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:border-white/[0.08] md:p-6"
              >
                <span className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-border/70 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                    {KIND_LABEL[link.kind]}
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" />
                </span>
                <span className="mt-4 block text-[16px] font-semibold leading-snug tracking-[-0.01em]">{link.title}</span>
                <span className="mt-1.5 block text-[14px] leading-relaxed text-muted-foreground">{link.description}</span>
              </SmartLink>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
