/**
 * Renders a whole marketing page from its content module
 * (src/content/marketing/*). Use <MarketingPageView page={…} /> for a standard
 * page, or compose the kit parts yourself and use <MarketingSeo> +
 * <SectionRenderer> for the data-driven bits.
 */

import type { ReactNode } from "react";
import { JsonLd } from "@/components/seo";
import { useSEO } from "@/hooks/useSEO";
import { JSON_LD_IDS, softwareJsonLd } from "@/content/marketing/json-ld";
import type { MarketingPageContent, MarketingSection } from "@/content/marketing/types";
import { AgentPanel } from "./agent-panel";
import { AnswerBlock } from "./answer-block";
import { BenefitsSection } from "./benefit-grid";
import { Breadcrumbs } from "./breadcrumbs";
import { ComparisonSection } from "./comparison-table";
import { CtaBand } from "./cta-band";
import { FaqSection } from "./faq-section";
import { ICONS } from "./icons";
import { MarketingLayout } from "./marketing-layout";
import { MediaRows } from "./media-row";
import { PageHero } from "./page-hero";
import { RelatedLinks } from "./related-links";
import { SectionHeading } from "./section-heading";
import { StatsStrip } from "./stats-strip";
import { StepsSection } from "./steps";
import { StoryPinned } from "./story-pinned";
import { CONTAINER, SECTION } from "./tokens";

/** Title, description, canonical and Open Graph tags, plus SoftwareApplication JSON-LD when the page asks for it. */
export function MarketingSeo({ page }: { page: MarketingPageContent }) {
  useSEO({
    title: page.seo.title,
    description: page.seo.description,
    canonical: page.path,
    ...(page.seo.ogImage ? { ogImage: page.seo.ogImage } : {}),
  });
  return page.software ? <JsonLd id={JSON_LD_IDS.software} data={softwareJsonLd(page)} /> : null;
}

/** Custom sections are rendered by the page: pass them by section id. */
export type SectionSlots = Record<string, ReactNode>;

export function SectionRenderer({ section, slots }: { section: MarketingSection; slots?: SectionSlots }) {
  switch (section.kind) {
    case "answer":
      return (
        <AnswerBlock
          id={section.id}
          eyebrow={section.eyebrow}
          heading={section.heading}
          body={section.body}
          points={section.points}
          pointsTitle={section.pointsTitle}
        />
      );
    case "story":
      return (
        <StoryPinned
          id={section.id}
          eyebrow={section.eyebrow}
          heading={section.heading}
          lead={section.lead}
          steps={section.steps.map((step) => ({
            key: step.clip,
            icon: step.icon ? ICONS[step.icon] : undefined,
            eyebrow: step.eyebrow,
            title: step.title,
            body: step.body,
            clip: step.clip,
            link: step.link,
          }))}
        />
      );
    case "media-rows":
      return <MediaRows id={section.id} eyebrow={section.eyebrow} heading={section.heading} lead={section.lead} rows={section.rows} />;
    case "benefits":
      return (
        <BenefitsSection id={section.id} eyebrow={section.eyebrow} heading={section.heading} lead={section.lead} items={section.items} />
      );
    case "comparison":
      return (
        <ComparisonSection
          id={section.id}
          eyebrow={section.eyebrow}
          heading={section.heading}
          lead={section.lead}
          columns={section.columns}
          rows={section.rows}
          sources={section.sources}
        />
      );
    case "steps":
      return <StepsSection id={section.id} eyebrow={section.eyebrow} heading={section.heading} lead={section.lead} steps={section.steps} />;
    case "stats":
      return <StatsStrip items={section.items} />;
    case "agent":
      return (
        <AgentPanel
          id={section.id}
          eyebrow={section.eyebrow}
          heading={section.heading}
          lead={section.lead}
          body={section.body}
          prompts={section.prompts}
          tools={section.tools}
          clip={section.clip}
          clipCaption={section.clipCaption}
          links={section.links}
        />
      );
    case "custom":
      return (
        slots?.[section.id] ?? (
          <section id={section.id} className={SECTION}>
            <div className={CONTAINER}>
              <SectionHeading eyebrow={section.eyebrow} heading={section.heading} lead={section.lead} />
            </div>
          </section>
        )
      );
  }
}

/**
 * A complete marketing page: layout, breadcrumbs, hero, every section in
 * order, FAQ, related links and the closing CTA band.
 */
export function MarketingPageView({ page, slots }: { page: MarketingPageContent; slots?: SectionSlots }) {
  return (
    <MarketingLayout>
      <MarketingSeo page={page} />
      <PageHero hero={page.hero} before={<Breadcrumbs items={page.breadcrumbs} path={page.path} className="mb-8 md:mb-10" />} />
      {page.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} slots={slots} />
      ))}
      <FaqSection heading={page.faqs.heading} lead={page.faqs.lead} items={page.faqs.items} />
      <RelatedLinks heading={page.related.heading} lead={page.related.lead} links={page.related.links} />
      <CtaBand heading={page.cta.heading} body={page.cta.body} shot={page.cta.shot} shotAlt={page.cta.shotAlt} />
    </MarketingLayout>
  );
}
