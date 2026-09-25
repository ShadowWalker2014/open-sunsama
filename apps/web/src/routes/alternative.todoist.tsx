import { MarketingPageView } from "@/components/marketing";
import { alternativeSlots } from "@/components/alternative/compare-parts";
import page, { extras } from "@/content/marketing/alternatives/todoist";

/**
 * /alternative/todoist, built from the marketing kit. The copy lives in
 * src/content/marketing/alternatives/todoist.ts, which the build also prerenders
 * for crawlers (scripts/prerender-marketing.ts).
 */
export default function AlternativeTodoistPage() {
  return <MarketingPageView page={page} slots={alternativeSlots(page, extras)} />;
}
