/**
 * "License, plainly": the LICENSE file's terms as a document card (allowed vs
 * needs a company license), the contact for a company license, and the
 * honest line about what "open source" means here.
 */

import { ArrowUpRight, Building2, Check, FileText, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/motion";
import { RichText } from "@/components/marketing/rich-text";
import { SectionHeading } from "@/components/marketing/section-heading";
import { CARD, CONTAINER, SECTION } from "@/components/marketing/tokens";
import { openSource } from "@/content/marketing/pages/open-source-task-manager";
import type { CustomSection } from "@/content/marketing/types";
import { cn } from "@/lib/utils";

export function LicenseSection({ section }: { section: CustomSection }) {
  const { allowed, needsLicense } = openSource.license;
  // The last paragraph is the plain-words caveat; the first two are drawn as the card.
  const caveat = section.body?.at(-1);

  return (
    <section id={section.id} className={SECTION} aria-labelledby={`${section.id}-heading`}>
      <div className={cn(CONTAINER, "grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-14")}>
        <div className="min-w-0">
          <SectionHeading id={`${section.id}-heading`} eyebrow={section.eyebrow} heading={section.heading} lead={section.lead} align="left" />
          {caveat && (
            <Reveal delay={80}>
              <p className="mt-5 max-w-xl text-[15px] leading-relaxed text-muted-foreground">
                <RichText text={caveat} />
              </p>
            </Reveal>
          )}
          <Reveal delay={120} className="mt-7 flex flex-col gap-2.5 sm:flex-row">
            <Button variant="outline" className="h-10 rounded-lg px-4 text-[13.5px]" asChild>
              <a href={openSource.licenseUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="h-4 w-4" />
                Read the LICENSE file
              </a>
            </Button>
            <Button variant="ghost" className="h-10 rounded-lg px-4 text-[13.5px]" asChild>
              <a href={`mailto:${openSource.licenseContact}?subject=Open%20Sunsama%20company%20license`}>
                <Mail className="h-4 w-4" />
                Ask about a company license
              </a>
            </Button>
          </Reveal>
        </div>

        <Reveal delay={100} y={24} className="min-w-0">
          <figure className={cn(CARD, "overflow-hidden shadow-[0_24px_64px_-32px_hsl(var(--shadow-color)/0.35)]")}>
            <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-4 py-2.5 dark:border-white/[0.06]">
              <span className="flex min-w-0 items-center gap-2 font-jetbrains text-[12px] text-muted-foreground">
                <FileText className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="truncate">open-sunsama / LICENSE</span>
              </span>
              <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                Non-commercial
              </span>
            </div>

            <div className="grid sm:grid-cols-2">
              <div className="p-5 md:p-6">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-emerald-700 dark:text-emerald-400">
                  Yours to use
                </p>
                <ul className="mt-4 space-y-3">
                  {allowed.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[14.5px] leading-snug text-foreground/90">
                      <span className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-emerald-500/12 text-emerald-600 dark:text-emerald-400">
                        <Check className="h-3 w-3" strokeWidth={3} aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border-t border-border/60 bg-muted/25 p-5 dark:border-white/[0.06] sm:border-l sm:border-t-0 md:p-6">
                <p className="text-[11.5px] font-semibold uppercase tracking-[0.1em] text-amber-700 dark:text-amber-400">
                  Needs a company license
                </p>
                <ul className="mt-4 space-y-3">
                  {needsLicense.map((item) => (
                    <li key={item} className="flex gap-2.5 text-[14.5px] leading-snug text-foreground/90">
                      <span className="mt-px flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
                        <Building2 className="h-3 w-3" aria-hidden />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <figcaption className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 px-4 py-3 text-[12.5px] text-muted-foreground dark:border-white/[0.06] md:px-6">
              <span>Summary of the Open Sunsama Non-Commercial License.</span>
              <a
                href={`mailto:${openSource.licenseContact}`}
                className="inline-flex items-center gap-1 rounded-sm font-medium text-foreground/80 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {openSource.licenseContact}
                <ArrowUpRight className="h-3 w-3" />
              </a>
            </figcaption>
          </figure>
        </Reveal>
      </div>
    </section>
  );
}
