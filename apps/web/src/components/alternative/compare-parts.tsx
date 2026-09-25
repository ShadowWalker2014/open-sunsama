/**
 * Parts only the /alternative/* compare pages need, built from the marketing
 * kit's tokens: the "Switch if / Stay if" verdict cards and the "What you give
 * up" list. The words come from each page's content module
 * (src/content/marketing/alternatives/*); see shared.ts there.
 */

import { ArrowRight, Check, X } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import { CARD, CONTAINER, SECTION, SectionHeading, SmartLink, RichText, type SectionSlots } from "@/components/marketing";
import type { AlternativeExtras, GiveUp, Verdict } from "@/content/marketing/alternatives/shared";
import type { MarketingPageContent, MarketingSection, TextLink } from "@/content/marketing/types";
import { cn } from "@/lib/utils";

type SectionCopy = Pick<Extract<MarketingSection, { kind: "custom" }>, "id" | "eyebrow" | "heading" | "lead">;

function CardLink({ link, tone }: { link: TextLink; tone: "primary" | "muted" }) {
  const className = cn(
    "group mt-6 inline-flex items-center gap-1.5 rounded-sm text-[14px] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
    tone === "primary" ? "text-primary hover:text-primary/80" : "text-foreground/75 hover:text-foreground"
  );
  const body = (
    <>
      {link.label}
      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
    </>
  );
  // In-page anchors ("#how-it-works") skip the router.
  return link.href.startsWith("#") ? (
    <a href={link.href} className={className}>
      {body}
    </a>
  ) : (
    <SmartLink href={link.href} className={className}>
      {body}
    </SmartLink>
  );
}

/** Two honest cards: who should switch, and who should stay. */
export function VerdictSection({ section, verdict }: { section: SectionCopy; verdict: Verdict }) {
  const headingId = `${section.id}-heading`;
  return (
    <section id={section.id} className={SECTION} aria-labelledby={headingId}>
      <div className={cn(CONTAINER, "max-w-5xl")}>
        <SectionHeading id={headingId} eyebrow={section.eyebrow} heading={section.heading} lead={section.lead} />
        <div className="mt-12 grid gap-4 md:grid-cols-2 md:gap-5">
          <Reveal className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-primary/35 bg-gradient-to-b from-primary/[0.07] to-primary/[0.02] p-6 shadow-[0_24px_60px_-40px_hsl(var(--primary)/0.6)] md:p-7">
            <div
              className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(closest-side,rgb(249_115_22/0.18),transparent)] blur-xl"
              aria-hidden
            />
            <h3 className="relative flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.01em]">
              <img src="/open-sunsama-logo.png" alt="" width={24} height={24} className="h-6 w-6 rounded-md shadow-sm" />
              Switch to Open Sunsama if…
            </h3>
            <ul className="relative mt-5 space-y-3.5">
              {verdict.switchIf.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-foreground/90">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground" aria-hidden>
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>
                    <RichText text={item} />
                  </span>
                </li>
              ))}
            </ul>
            {verdict.switchLink && <CardLink link={verdict.switchLink} tone="primary" />}
          </Reveal>

          <Reveal delay={100} className={cn(CARD, "flex min-w-0 flex-col p-6 md:p-7")}>
            <h3 className="flex items-center gap-2.5 text-[17px] font-semibold tracking-[-0.01em]">
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md border border-border/80 bg-muted text-[12px] font-semibold text-muted-foreground"
                aria-hidden
              >
                {verdict.rival.charAt(0)}
              </span>
              Stay with {verdict.rival} if…
            </h3>
            <ul className="mt-5 space-y-3.5">
              {verdict.stayIf.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-foreground/80">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-foreground/60" aria-hidden>
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </span>
                  <span>
                    <RichText text={item} />
                  </span>
                </li>
              ))}
            </ul>
            {verdict.stayLink && <CardLink link={verdict.stayLink} tone="muted" />}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** The true gaps, one row each, so nobody switches blind. */
export function GiveUpSection({ section, items, rival }: { section: SectionCopy; items: GiveUp[]; rival: string }) {
  const headingId = `${section.id}-heading`;
  return (
    <section id={section.id} className={SECTION} aria-labelledby={headingId}>
      <div className={cn(CONTAINER, "max-w-5xl")}>
        <SectionHeading id={headingId} eyebrow={section.eyebrow} heading={section.heading} lead={section.lead} />
        <Reveal delay={100} className="mt-12">
          <ul
            className="divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70 bg-card dark:border-white/[0.08]"
            aria-label={`What ${rival} does that Open Sunsama doesn't`}
          >
            {items.map((item) => (
              <li key={item.title} className="grid gap-2 px-5 py-5 sm:grid-cols-[240px_1fr] sm:gap-8 sm:px-7 sm:py-6">
                <h3 className="flex items-start gap-2.5 text-[15.5px] font-semibold leading-snug tracking-[-0.01em]">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground" aria-hidden>
                    <X className="h-3 w-3" strokeWidth={2.75} />
                  </span>
                  {item.title}
                </h3>
                <div className="min-w-0 pl-[30px] text-[14.5px] leading-relaxed text-muted-foreground sm:pl-0">
                  <p>
                    <RichText text={item.body} />
                  </p>
                  {item.link && (
                    <SmartLink
                      href={item.link.href}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-sm text-[13.5px] font-medium text-foreground/80 transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {item.link.label}
                      <ArrowRight className="h-3.5 w-3.5" />
                    </SmartLink>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
        <p className="mt-5 text-center text-[13.5px] text-muted-foreground">
          Need one of these?{" "}
          <SmartLink
            href="https://github.com/ShadowWalker2014/open-sunsama/issues"
            className="rounded-sm font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Ask for it on GitHub
          </SmartLink>
          , or have your agent build it: the code is public.
        </p>
      </div>
    </section>
  );
}

function copyOf(page: MarketingPageContent, id: string): SectionCopy {
  const section = page.sections.find((s) => s.id === id);
  if (!section || section.kind === "stats") throw new Error(`${page.path}: no section "${id}"`);
  return { id: section.id, eyebrow: section.eyebrow, heading: section.heading, lead: section.lead };
}

/** Slots for MarketingPageView: the verdict cards and the give-up list. */
export function alternativeSlots(page: MarketingPageContent, extras: AlternativeExtras): SectionSlots {
  return {
    verdict: <VerdictSection section={copyOf(page, "verdict")} verdict={extras.verdict} />,
    "give-up": <GiveUpSection section={copyOf(page, "give-up")} items={extras.giveUps} rival={extras.verdict.rival} />,
  };
}
