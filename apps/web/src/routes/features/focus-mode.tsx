import { MarketingPageView } from "@/components/marketing";
import page from "@/content/marketing/features/focus-mode";

/**
 * /features/focus-mode, built entirely from the marketing kit. The copy lives in
 * src/content/marketing/features/focus-mode.ts, which the build also prerenders for
 * crawlers (scripts/prerender-marketing.ts).
 */
export default function FocusModeFeaturePage() {
  return <MarketingPageView page={page} />;
}
