import { MarketingPageView } from "@/components/marketing";
import { alternativeSlots } from "@/components/alternative/compare-parts";
import page, { extras } from "@/content/marketing/alternatives/reclaim";

/**
 * /alternative/reclaim, built from the marketing kit. The copy lives in
 * src/content/marketing/alternatives/reclaim.ts, which the build also prerenders
 * for crawlers (scripts/prerender-marketing.ts).
 */
export default function AlternativeReclaimPage() {
  return <MarketingPageView page={page} slots={alternativeSlots(page, extras)} />;
}
