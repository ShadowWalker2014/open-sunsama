import { MarketingPageView } from "@/components/marketing";
import page from "@/content/marketing/features/kanban";

/**
 * /features/kanban, built entirely from the marketing kit. The copy lives in
 * src/content/marketing/features/kanban.ts, which the build also prerenders for
 * crawlers (scripts/prerender-marketing.ts).
 */
export default function KanbanFeaturePage() {
  return <MarketingPageView page={page} />;
}
