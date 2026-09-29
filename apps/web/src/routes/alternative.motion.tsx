import { MarketingPageView } from "@/components/marketing";
import { alternativeSlots } from "@/components/alternative/compare-parts";
import page, { extras } from "@/content/marketing/alternatives/motion";

/**
 * /alternative/motion, built from the marketing kit. The copy lives in
 * src/content/marketing/alternatives/motion.ts, which the build also prerenders
 * for crawlers (scripts/prerender-marketing.ts).
 */
export default function AlternativeMotionPage() {
  return <MarketingPageView page={page} slots={alternativeSlots(page, extras)} />;
}
