import { MarketingPageView } from "@/components/marketing";
import page from "@/content/marketing/features/calendar-sync";

/**
 * /features/calendar-sync, built entirely from the marketing kit. The copy
 * lives in src/content/marketing/features/calendar-sync.ts, which the build
 * also prerenders for crawlers (scripts/prerender-marketing.ts).
 */
export default function CalendarSyncFeaturePage() {
  return <MarketingPageView page={page} />;
}
