/**
 * Marketing home page. Sections live in components/landing. The hero uses a
 * real screenshot (fast first paint); the sections below use real recordings
 * of the app from src/lib/blog-media.json.
 */

import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { AiSection } from "@/components/landing/ai-section";
import { FaqSection } from "@/components/landing/faq-section";
import { Hero } from "@/components/landing/hero";
import {
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
        <StorySection />
        <AiSection />
        <FeaturesSection />
        <OpenSourceSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
