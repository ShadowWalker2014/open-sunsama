/**
 * Marketing home page. Sections live in components/landing; the shell
 * (header, footer, skip link) is the marketing kit's, shared by every public
 * page. The hero uses a real screenshot (fast first paint); the sections below
 * use real recordings of the app from src/lib/blog-media.json.
 */

import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { MarketingLayout } from "@/components/marketing/marketing-layout";
import { AiSection } from "@/components/landing/ai-section";
import { FaqSection } from "@/components/landing/faq-section";
import { Hero } from "@/components/landing/hero";
import { FeaturesSection, FinalCta, OpenSourceSection } from "@/components/landing/sections";
import { StorySection } from "@/components/landing/story-section";

export default function LandingPage() {
  useSEO(SEO_CONFIGS.landing);

  return (
    <MarketingLayout backdrop={false}>
      <Hero />
      <StorySection />
      <AiSection />
      <FeaturesSection />
      <OpenSourceSection />
      <FaqSection />
      <FinalCta />
    </MarketingLayout>
  );
}
