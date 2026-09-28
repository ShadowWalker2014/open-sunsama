import { MarketingPageView } from "@/components/marketing";
import page from "@/content/marketing/features/time-blocking";

/**
 * /features/time-blocking, built entirely from the marketing kit. The copy
 * lives in src/content/marketing/features/time-blocking.ts, which the build
 * also prerenders for crawlers (scripts/prerender-marketing.ts).
 */
export default function TimeBlockingFeaturePage() {
  return <MarketingPageView page={page} />;
}
