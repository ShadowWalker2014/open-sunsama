import { MarketingPageView } from "@/components/marketing";
import { alternativeSlots } from "@/components/alternative/compare-parts";
import page, { extras } from "@/content/marketing/alternatives/akiflow";

/**
 * /alternative/akiflow, built from the marketing kit. The copy lives in
 * src/content/marketing/alternatives/akiflow.ts, which the build also prerenders
 * for crawlers (scripts/prerender-marketing.ts).
 */
export default function AlternativeAkiflowPage() {
  return <MarketingPageView page={page} slots={alternativeSlots(page, extras)} />;
}
