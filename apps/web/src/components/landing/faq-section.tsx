/**
 * Home page FAQ. Answers are always visible (no accordion) and the same text
 * feeds the FAQPage JSON-LD, so what search engines read matches the page.
 */

import { Link } from "@tanstack/react-router";
import { FAQSchema } from "@/components/seo";
import type { FAQItem } from "@/lib/structured-data";
import { Reveal } from "./motion";

const FAQS: Array<FAQItem & { link?: { label: string; to: string; splat?: string } }> = [
  {
    question: "Is Open Sunsama open source?",
    answer:
      "Yes. The code is public on GitHub. It uses a non-commercial license: you can read it, run it and self-host it for personal use. Companies need a commercial license.",
    link: { label: "See the code on GitHub", to: "https://github.com/ShadowWalker2014/open-sunsama" },
  },
  {
    question: "Does it work with Claude and ChatGPT?",
    answer:
      "Yes. Add https://api.opensunsama.com/mcp as a connector and sign in once. Claude, ChatGPT, Cursor or any MCP app can then read your plan, add tasks and block time.",
    link: { label: "Connect your AI", to: "/docs/$", splat: "mcp/overview" },
  },
  {
    question: "Can I self-host it?",
    answer: "Yes. You can run it on your own server with Docker. The self-hosting guide walks you through each step.",
    link: { label: "Self-hosting guide", to: "/docs/$", splat: "self-hosting/docker" },
  },
  {
    question: "How is it different from Sunsama?",
    answer:
      "Both give you a calm daily plan with a board and time blocks, and both work with AI agents. Open Sunsama's code is public, you can self-host it, and it has a public REST API. Sunsama has no public API.",
    link: { label: "Compare the two", to: "/alternative/sunsama" },
  },
  {
    question: "Does it sync with Google Calendar and Outlook?",
    answer:
      "Yes. Connect Google Calendar, Outlook or iCloud. Your events show up next to your tasks and time blocks.",
    link: { label: "How calendar sync works", to: "/features/calendar-sync" },
  },
  {
    question: "Is there a phone app?",
    answer:
      "Not in the app stores yet. On your phone, open Open Sunsama in the browser. It works as a mobile web app and syncs with your other devices. Desktop apps are ready for Mac, Windows and Linux.",
    link: { label: "Get the desktop app", to: "/download" },
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="scroll-mt-16 border-t border-border/50 py-24 md:py-28">
      <FAQSchema items={FAQS.map(({ question, answer }) => ({ question, answer }))} />
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16">
        <Reveal className="lg:sticky lg:top-24 lg:self-start">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary">FAQ</p>
          <h2 className="mt-3 text-[32px] font-semibold leading-[1.08] tracking-[-0.03em] md:text-[44px]">
            Questions people ask.
          </h2>
          <p className="mt-4 max-w-sm text-[16px] leading-relaxed text-muted-foreground">
            Something missing? Read the{" "}
            <Link to="/docs" className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline">
              docs
            </Link>{" "}
            or ask on{" "}
            <a
              href="https://github.com/ShadowWalker2014/open-sunsama/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-foreground underline-offset-4 hover:text-primary hover:underline"
            >
              GitHub
            </a>
            .
          </p>
        </Reveal>

        <dl className="divide-y divide-border/70 border-y border-border/70">
          {FAQS.map((item) => (
            <Reveal key={item.question} className="py-6 md:py-7">
              <dt className="text-[17px] font-semibold leading-snug tracking-[-0.01em] md:text-[18px]">{item.question}</dt>
              <dd className="mt-2.5 text-[15px] leading-relaxed text-muted-foreground md:text-[15.5px]">
                {item.answer}
                {item.link && (
                  <>
                    {" "}
                    {item.link.to.startsWith("http") ? (
                      <a
                        href={item.link.to}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="whitespace-nowrap font-medium text-primary hover:underline"
                      >
                        {item.link.label} →
                      </a>
                    ) : (
                      <Link
                        to={item.link.to}
                        params={item.link.splat ? { _splat: item.link.splat } : undefined}
                        className="whitespace-nowrap font-medium text-primary hover:underline"
                      >
                        {item.link.label} →
                      </Link>
                    )}
                  </>
                )}
              </dd>
            </Reveal>
          ))}
        </dl>
      </div>
    </section>
  );
}
