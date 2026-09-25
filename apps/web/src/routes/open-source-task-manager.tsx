import { MarketingLayout, MarketingSeo, SectionRenderer, FaqSection, RelatedLinks } from "@/components/marketing";
import { OpenSourceComparison } from "@/components/marketing/pages/open-source/comparison";
import { OpenSourceCta } from "@/components/marketing/pages/open-source/cta";
import { ExtendSection } from "@/components/marketing/pages/open-source/extend-section";
import { OpenSourceHero } from "@/components/marketing/pages/open-source/hero";
import { LicenseSection } from "@/components/marketing/pages/open-source/license-section";
import { SelfHostSection } from "@/components/marketing/pages/open-source/self-host-section";
import page from "@/content/marketing/pages/open-source-task-manager";
import type { MarketingSection } from "@/content/marketing/types";

/**
 * /open-source-task-manager. The copy lives in
 * src/content/marketing/pages/open-source-task-manager.ts, which the build
 * also prerenders for crawlers. This page swaps in its own hero (live repo
 * bar), its own "Own it", "Extend it" and "License" blocks, a comparison with
 * followed repo links, and a CTA whose second path is self-hosting.
 */
function Section({ section }: { section: MarketingSection }) {
  if (section.kind === "comparison") return <OpenSourceComparison section={section} />;
  if (section.kind === "custom") {
    if (section.id === "self-host") return <SelfHostSection section={section} />;
    if (section.id === "extend") return <ExtendSection section={section} />;
    if (section.id === "license") return <LicenseSection section={section} />;
  }
  return <SectionRenderer section={section} />;
}

export default function OpenSourceTaskManagerPage() {
  return (
    <MarketingLayout>
      <MarketingSeo page={page} />
      <OpenSourceHero page={page} />
      {page.sections.map((section) => (
        <Section key={section.id} section={section} />
      ))}
      <FaqSection heading={page.faqs.heading} lead={page.faqs.lead} items={page.faqs.items} />
      <RelatedLinks heading={page.related.heading} lead={page.related.lead} links={page.related.links} />
      <OpenSourceCta cta={page.cta} />
    </MarketingLayout>
  );
}
