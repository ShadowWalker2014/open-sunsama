import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/landing/motion";
import {
  AgentPanel,
  BenefitGrid,
  Breadcrumbs,
  CARD,
  ComparisonSection,
  CONTAINER,
  CtaBand,
  FaqSection,
  GITHUB_URL,
  MarketingLayout,
  MediaRows,
  PageHero,
  RelatedLinks,
  SECTION,
  SectionHeading,
  StepsSection,
} from "@/components/marketing";
import { GiveUpSection, VerdictSection } from "@/components/alternative/compare-parts";
import { ProductComparisonSchema } from "@/components/seo";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import type { ComparisonRow, MarketingFaq, MediaRow, PageHeroContent, RelatedLink } from "@/content/marketing/types";
import { cn } from "@/lib/utils";

/*
 * /alternative/sunsama: the first compare page. Its copy predates the
 * content-module pattern and stays here as is; the layout uses the marketing
 * kit so it matches /alternative/akiflow, /motion, /reclaim and /todoist.
 */

const HERO: PageHeroContent = {
  eyebrow: "Open source · AI native",
  title: "The open-source Sunsama alternative",
  accent: "Sunsama alternative",
  answer:
    "Open Sunsama is an open-source daily planner that works like Sunsama and connects to any AI agent. Plan your day on a board, time-block your calendar, and let Claude, ChatGPT or Cursor help. The code is public, and you can run it on your own server.",
  media: { video: "tour" },
  secondary: { label: "View on GitHub", href: GITHUB_URL },
};

// ---------------------------------------------------------------------------
// Should you switch?
// ---------------------------------------------------------------------------

const VERDICT = {
  rival: "Sunsama",
  switchIf: [
    "You love Sunsama's board and calendar but want to own the app you plan in.",
    "You ask Claude, ChatGPT or Cursor to plan your day, and want a planner your agent can read, write and even extend.",
    "You want to self-host, or you need a public REST API for your own scripts.",
    "You like to plan fast from the keyboard, without a set ritual each morning.",
  ],
  stayIf: [
    "The guided daily planning and shutdown ritual is what keeps you on track.",
    "You pull tasks from Asana, Jira, Slack or Gmail every day and want that built in.",
    "Your team shares a Sunsama workspace.",
  ],
};

// ---------------------------------------------------------------------------
// The daily loop, shown
// ---------------------------------------------------------------------------

const LOOP: MediaRow[] = [
  {
    title: "Plan your day on a board of days",
    body: [
      "Today, tomorrow and your backlog sit side by side, like in Sunsama. Drag a task to the day you will do it. Anything you don't finish rolls over to the next day on its own.",
    ],
    media: { clip: "plan-day", alt: "Open Sunsama board with Today, Tomorrow and the backlog", caption: "Drag tasks from the backlog into Today." },
  },
  {
    title: "Time-block your real calendar",
    body: [
      "Drag a task onto the calendar to give it a time slot, then drag the edge to set how long it takes. Your Google, Outlook and iCloud events sit right next to your blocks.",
    ],
    media: { clip: "time-block", alt: "Open Sunsama day view with time blocks next to meetings", caption: "Drop a task on the calendar and resize the block." },
  },
  {
    title: "Focus on one task and see planned vs actual",
    body: [
      "Focus mode hides everything but the task in front of you. The timer tracks how long it really took, so tomorrow's plan is more honest.",
    ],
    media: { clip: "focus", alt: "Open Sunsama focus mode with a running timer", caption: "Start focus mode and the timer tracks actual time." },
  },
  {
    title: "Do it all from the keyboard",
    body: [
      "Press Cmd+K to find a task, jump to a day or run a command. Most actions have a shortcut, so a full plan takes a few minutes.",
    ],
    media: { clip: "command-palette", alt: "Open Sunsama command palette open over the board", caption: "Cmd+K finds any task or command." },
  },
  {
    title: "Take your plan with you",
    body: [
      "Use Open Sunsama on the web, as a desktop app for Mac, Windows and Linux, or in your phone's browser. Changes sync across devices in real time, so the plan you made at your desk is in your pocket.",
    ],
    media: { shot: "mobile-tasks", alt: "Open Sunsama task list on a phone", caption: "Your day on your phone." },
    link: { label: "Download the desktop app", href: "/download" },
  },
];

// ---------------------------------------------------------------------------
// Feature table
// ---------------------------------------------------------------------------

type Cell = boolean | string;

const FEATURES: Array<{ name: string; os: Cell; sunsama: Cell }> = [
  { name: "Kanban board of days and a backlog", os: true, sunsama: true },
  { name: "Time blocking on your calendar", os: true, sunsama: true },
  { name: "Google, Outlook and iCloud calendars", os: true, sunsama: true },
  { name: "Focus mode with a timer", os: true, sunsama: true },
  { name: "Planned vs actual time", os: true, sunsama: true },
  { name: "Tasks roll over to the next day", os: true, sunsama: true },
  { name: "Recurring tasks", os: true, sunsama: true },
  { name: "Command palette and shortcuts", os: true, sunsama: true },
  { name: "Guided planning and shutdown ritual", os: false, sunsama: true },
  { name: "Weekly planning and review", os: false, sunsama: true },
  { name: "Built-in task integrations", os: "Via API or agent", sunsama: "About 20 tools" },
  { name: "Team workspace", os: false, sunsama: true },
  { name: "AI assistant", os: "Bring any agent", sunsama: "Sunny" },
  { name: "MCP server for AI agents", os: true, sunsama: true },
  { name: "Public REST API with API keys", os: true, sunsama: false },
  { name: "Source code you can read and change", os: true, sunsama: false },
  { name: "Self-hosting", os: "Docker", sunsama: false },
  { name: "Apps", os: "Web, Mac, Windows, Linux, mobile web", sunsama: "Web, Mac, Windows, Linux, iOS, Android" },
];

const toCell = (value: Cell) => (value === true ? "yes" : value === false ? "no" : { text: value });

const FEATURE_ROWS: ComparisonRow[] = FEATURES.map((row) => ({ feature: row.name, cells: [toCell(row.os), toCell(row.sunsama)] }));

// ---------------------------------------------------------------------------
// What you get / what you give up
// ---------------------------------------------------------------------------

const GAINS = [
  {
    icon: "code" as const,
    title: "Code you can read and change",
    body: "The whole app is on GitHub. You, or your AI agent, can add the feature you need instead of filing a request and waiting.",
  },
  {
    icon: "server" as const,
    title: "Run it on your own server",
    body: "Self-host with Docker, and your tasks never leave your machine. The hosted app works too if you'd rather not run a server.",
  },
  {
    icon: "terminal" as const,
    title: "A public REST API",
    body: "Create an API key and script anything: n8n flows, Home Assistant, your own tools. A Sunsama API has been on its public roadmap since 2019.",
  },
  {
    icon: "database" as const,
    title: "Your data stays yours",
    body: "Pull every task out through the API, or keep it all in your own database. We don't sell your personal information.",
  },
];

const GIVE_UPS = [
  {
    title: "A guided planning ritual",
    body: "Sunsama walks you through a plan each morning, a shutdown each evening and a weekly review. Open Sunsama gives you the board and calendar, and you set your own rhythm. Or ask your agent to run it.",
  },
  {
    title: "Built-in task integrations",
    body: "Sunsama pulls tasks from about 20 tools, like Asana, Jira, Linear, Notion, Trello, Slack and Gmail. Open Sunsama syncs your calendars only. Other tasks come in through the REST API or your AI agent.",
  },
  {
    title: "Native phone apps",
    body: "Sunsama has iOS and Android apps. Open Sunsama runs on your phone in the browser, and it has desktop apps for Mac, Windows and Linux.",
  },
  {
    title: "Auto-scheduling",
    body: "Sunsama can drop a task into the next open slot for you. In Open Sunsama you place each block yourself, or ask your agent to do it.",
  },
  {
    title: "Team workspaces",
    body: "Sunsama lets teammates share a workspace and see each other's plans. Open Sunsama is built for one person's day.",
  },
  {
    title: "Years of polish",
    body: "Sunsama has a large community, SOC 2 compliance and a long track record. Open Sunsama is younger and still growing.",
  },
];

// ---------------------------------------------------------------------------
// How to switch
// ---------------------------------------------------------------------------

const STEPS = [
  {
    title: "Create an account, or self-host",
    body: "Sign up on the web and you are ready in a minute. Prefer your own server? Follow the [Docker guide](/docs/self-hosting/docker).",
  },
  {
    title: "Connect your calendars",
    body: "Add Google, Outlook or iCloud in Settings. Your meetings show up next to your tasks, so you can see what really fits in the day.",
  },
  {
    title: "Bring your tasks over",
    body: "There is no one-click import yet. Add your open tasks by hand, or connect both Sunsama's and Open Sunsama's MCP servers to Claude and ask it to move them. Check the result before you cancel Sunsama.",
  },
];

// ---------------------------------------------------------------------------
// License
// ---------------------------------------------------------------------------

function LicenseSection() {
  return (
    <section id="license" className={cn(SECTION, "py-14 md:py-16")} aria-labelledby="license-heading">
      <div className={cn(CONTAINER, "max-w-3xl")}>
        <Reveal className={cn(CARD, "bg-muted/30 p-6 md:p-8")}>
          <h2 id="license-heading" className="text-[22px] font-semibold tracking-[-0.02em] md:text-[26px]">
            The license, in plain words
          </h2>
          <p className="mt-3 text-[15px] leading-relaxed text-foreground/85">
            The code is public on GitHub. It uses a non-commercial license: you can read it, run it and self-host it for
            personal use. Companies need a commercial license.
          </p>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
            Education, non-profit and other open-source projects are covered too. It is not an OSI license like MIT or GPL,
            so we say so up front.
          </p>
          <a
            href={`${GITHUB_URL}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-sm text-[14px] font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Read the full license
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </Reveal>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

const FAQS: MarketingFaq[] = [
  {
    question: "What is the best open-source Sunsama alternative?",
    answer:
      "Open Sunsama. It covers Sunsama's daily loop: a board of days, time blocking, focus mode, rollover and calendar sync. The code is public on GitHub, you can self-host it, and any AI agent can run it over MCP.",
  },
  {
    question: "Does Sunsama have an MCP server?",
    answer:
      "Yes. Sunsama's MCP server and its Sunny assistant are live and come with its Pro plan. Open Sunsama has an MCP server too, plus a public REST API, public code and self-hosting.",
  },
  {
    question: "Can I control Open Sunsama from Claude or ChatGPT?",
    answer:
      "Yes. Paste https://api.opensunsama.com/mcp into Claude, ChatGPT, Cursor, Claude Code or any MCP client, then sign in. You don't need an API key. Your agent can then read your meetings and tasks, create tasks and time-block your day around your meetings.",
  },
  {
    question: "Can I import my tasks from Sunsama?",
    answer:
      "Not with one click yet. Add your open tasks by hand, or connect both apps' MCP servers to Claude and ask it to move them. Your meetings come across when you connect Google, Outlook or iCloud.",
  },
  {
    question: "Can I self-host Open Sunsama?",
    answer:
      "Yes. Run it with Docker on your own server; the self-hosting guide walks you through it. The license allows self-hosting for personal, educational and non-profit use.",
  },
  {
    question: "Is Open Sunsama really open source?",
    answer:
      "The code is public on GitHub. It uses a non-commercial license: you can read it, run it and self-host it for personal use. Companies need a commercial license.",
  },
  {
    question: "Is my data private?",
    answer:
      "We don't sell your personal information. You can export your tasks, and when you delete your account your data is removed within 30 days. For full control, self-host it.",
  },
];

const RELATED: RelatedLink[] = [
  {
    kind: "compare",
    title: "Open Sunsama vs Motion",
    description: "Plan by hand, or with your agent, instead of an auto-scheduler.",
    href: "/alternative/motion",
  },
  {
    kind: "compare",
    title: "Open Sunsama vs Akiflow",
    description: "Keyboard-first time blocking with a public API.",
    href: "/alternative/akiflow",
  },
  {
    kind: "compare",
    title: "Open Sunsama vs Reclaim",
    description: "A planner you run, not a layer that moves blocks.",
    href: "/alternative/reclaim",
  },
  {
    kind: "compare",
    title: "Open Sunsama vs Todoist",
    description: "Plan when, not just what.",
    href: "/alternative/todoist",
  },
  {
    kind: "guide",
    title: "9 best Sunsama alternatives",
    description: "Every serious option, compared.",
    href: "/blog/best-free-sunsama-alternatives",
  },
  {
    kind: "guide",
    title: "Motion vs Sunsama",
    description: "Autopilot or a calm, manual plan.",
    href: "/blog/motion-vs-sunsama",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

/**
 * Open-source Sunsama alternative landing page.
 * Targets "open source sunsama alternative" and "sunsama alternative".
 */
export default function AlternativeSunsamaPage() {
  useSEO(SEO_CONFIGS.alternative.sunsama);

  return (
    <MarketingLayout>
      <ProductComparisonSchema
        mainProduct={{
          name: "Open Sunsama",
          description:
            "Open-source daily planner with a kanban board of days, time blocking, focus mode and calendar sync. Works with Claude, ChatGPT and any MCP client.",
          url: "https://opensunsama.com",
        }}
        comparedProducts={[
          {
            name: "Sunsama",
            description: "Guided daily planner with time blocking, calendar sync and task integrations.",
            url: "https://sunsama.com",
          },
        ]}
        articleTitle="Open Sunsama vs Sunsama: Open-Source Alternative Comparison"
        articleUrl="https://opensunsama.com/alternative/sunsama"
      />

      <PageHero
        hero={HERO}
        before={
          <Breadcrumbs items={[{ label: "Alternatives" }, { label: "Sunsama" }]} path="/alternative/sunsama" className="mb-8 md:mb-10" />
        }
      />

      <VerdictSection
        section={{
          id: "verdict",
          heading: "Switch if you want to own your planner",
          lead: "Both apps help you plan a calm, realistic day. The real choice is between a guided, closed app and an open one you control.",
        }}
        verdict={VERDICT}
      />

      <MediaRows
        id="how-it-works"
        eyebrow="The daily loop you know"
        heading="Board, calendar, focus mode and rollover work like Sunsama"
        lead="The core of your day moves over as it is. Here is each part in the real app, not a mockup."
        rows={LOOP}
      />

      <AgentPanel
        id="ai"
        heading="Any AI agent can plan your day in Open Sunsama"
        lead="Paste one URL into Claude, ChatGPT, Cursor, Claude Code or any MCP client, then sign in. No API key needed. Your agent gets 24 tools for tasks, subtasks, time blocks and your calendar meetings, so it sees your meetings and tasks in one call and plans around them."
        body={[
          "Sunsama has an MCP server too, and it works well. The difference is what sits behind it. Our code is public, so your agent can read it and even add the feature you want. And you can run the whole thing, agent access included, on your own server.",
        ]}
        prompts={[
          "Plan my day around my meetings. Put my top three tasks in focus blocks.",
          "Yesterday went off track. Move what's left into free slots this week.",
          "Turn this brain dump into tasks for Thursday.",
        ]}
        clip="ai-plan"
        clipCaption="An agent plans the afternoon over MCP. Tasks and time blocks appear live."
        links={[
          { label: "Claude", href: "/docs/mcp/claude" },
          { label: "ChatGPT", href: "/docs/mcp/chatgpt" },
          { label: "Cursor", href: "/docs/mcp/cursor" },
          { label: "Any MCP client", href: "/docs/mcp/overview" },
        ]}
      />

      <ComparisonSection
        id="compare"
        heading="Open Sunsama vs Sunsama, feature by feature"
        lead="Same daily loop. Sunsama has more guidance and integrations. Open Sunsama gives you the code, the API and the server."
        columns={["Open Sunsama", "Sunsama"]}
        rows={FEATURE_ROWS}
        sources="Sunsama features from [sunsama.com](https://www.sunsama.com/pricing) and its [help center](https://help.sunsama.com/docs/mcp-model-context-protocol), checked September 2026."
      />

      {/* Four gains: a 2 x 2 grid, so the kit's 3-column grid doesn't leave an empty cell. */}
      <section id="gains" className={SECTION} aria-labelledby="gains-heading">
        <div className={cn(CONTAINER, "max-w-5xl")}>
          <SectionHeading
            id="gains-heading"
            heading="What you get that Sunsama doesn't offer"
            lead="Each one gives you more control over your planner and your data."
          />
          <div className="mt-12 lg:[&>div]:grid-cols-2">
            <BenefitGrid items={GAINS} />
          </div>
        </div>
      </section>

      <GiveUpSection
        section={{
          id: "give-up",
          heading: "What you give up when you leave Sunsama",
          lead: "Sunsama is a good app. Here is what it does that Open Sunsama doesn't, so you can decide with clear eyes.",
        }}
        items={GIVE_UPS}
        rival="Sunsama"
      />

      <StepsSection
        id="switch"
        heading="Switch from Sunsama in 3 steps"
        lead="You can plan your first day in Open Sunsama the same morning you sign up."
        steps={STEPS}
      />

      <LicenseSection />

      <FaqSection
        heading="Questions before you switch"
        lead="Still comparing? Read [the 9 best time blocking apps](/blog/best-calendar-apps-time-blocking) or [Motion vs Sunsama](/blog/motion-vs-sunsama)."
        items={FAQS}
      />

      <RelatedLinks heading="Keep comparing" links={RELATED} />

      <CtaBand
        heading="Plan tomorrow in Open Sunsama"
        body="Drag your tasks onto a board, block time on your calendar, and let the AI agent you already use help run the day."
        shot="board"
        shotAlt="Open Sunsama board with tasks planned across days"
      />
    </MarketingLayout>
  );
}
