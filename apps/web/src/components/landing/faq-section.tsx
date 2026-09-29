/**
 * Home page FAQ, drawn by the marketing kit's FaqSection: answers always
 * visible, and the same text feeds the FAQPage JSON-LD.
 */

import { FaqSection as KitFaqSection } from "@/components/marketing/faq-section";
import type { MarketingFaq } from "@/content/marketing/types";

const FAQS: MarketingFaq[] = [
  {
    question: "Is Open Sunsama open source?",
    answer:
      "Yes. The code is public on GitHub. It uses a non-commercial license: you can read it, run it and self-host it for personal use. Companies need a commercial license.",
    link: { label: "See the code on GitHub", href: "https://github.com/ShadowWalker2014/open-sunsama" },
  },
  {
    question: "Does it work with Claude and ChatGPT?",
    answer:
      "Yes. Add https://api.opensunsama.com/mcp as a connector and sign in once. Claude, ChatGPT, Cursor or any MCP app can then read your plan, add tasks and block time.",
    link: { label: "Connect your AI", href: "/docs/mcp/overview" },
  },
  {
    question: "Can I self-host it?",
    answer: "Yes. You can run it on your own server with Docker. The self-hosting guide walks you through each step.",
    link: { label: "Self-hosting guide", href: "/docs/self-hosting/docker" },
  },
  {
    question: "How is it different from Sunsama?",
    answer:
      "Both give you a calm daily plan with a board and time blocks, and both work with AI agents. Open Sunsama's code is public, you can self-host it, and it has a public REST API. Sunsama has no public API.",
    link: { label: "Compare the two", href: "/alternative/sunsama" },
  },
  {
    question: "Does it sync with Google Calendar and Outlook?",
    answer: "Yes. Connect Google Calendar, Outlook or iCloud. Your events show up next to your tasks and time blocks.",
    link: { label: "How calendar sync works", href: "/features/calendar-sync" },
  },
  {
    question: "Is there a phone app?",
    answer:
      "Not in the app stores yet. On your phone, open Open Sunsama in the browser. It works as a mobile web app and syncs with your other devices. Desktop apps are ready for Mac, Windows and Linux.",
    link: { label: "Get the desktop app", href: "/download" },
  },
];

export function FaqSection() {
  return (
    <KitFaqSection
      heading="Questions people ask."
      lead="Something missing? Read the [docs](/docs) or ask on [GitHub](https://github.com/ShadowWalker2014/open-sunsama/issues)."
      items={FAQS}
      className="py-24"
    />
  );
}
