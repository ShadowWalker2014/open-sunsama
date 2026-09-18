/**
 * Marketing home page. Sections live in components/landing; every product
 * screen is a real screenshot of the demo workspace (scripts/readme-media).
 */

import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { AiSection } from "@/components/landing/ai-section";
import { Hero } from "@/components/landing/hero";
import {
  ComparisonSection,
  FeaturesSection,
  FinalCta,
  OpenSourceSection,
  SiteFooter,
  SiteHeader,
} from "@/components/landing/sections";
import { StorySection } from "@/components/landing/story-section";

export default function LandingPage() {
  useSEO(SEO_CONFIGS.landing);

  return (
    <div className="min-h-screen overflow-x-clip bg-background font-sans text-foreground antialiased">
      <SiteHeader />
      <main>
        <Hero />
        <FeaturesSection />
        <StorySection />
        <AiSection />
        <OpenSourceSection />
        <ComparisonSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
