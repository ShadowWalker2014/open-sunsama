import * as React from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bot,
  Check,
  ChevronDown,
  Code,
  Database,
  Github,
  Minus,
  Server,
  Terminal,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";
import { Breadcrumbs, FAQSchema, ProductComparisonSchema } from "@/components/seo";
import { SiteFooter, SiteHeader } from "@/components/landing/sections";
import { Reveal } from "@/components/landing/motion";
import { Clip, DemoVideo, Shot } from "@/components/blog/media";
import { BLOG_MEDIA } from "@/lib/blog-media";

const GITHUB_URL = "https://github.com/ShadowWalker2014/open-sunsama";
const MCP_URL = "https://api.opensunsama.com/mcp";

const H2 = "text-[26px] font-semibold leading-[1.15] tracking-[-0.03em] md:text-[36px]";
const LEAD = "mt-3 text-[16px] leading-relaxed text-muted-foreground";
const EYEBROW = "text-[12px] font-semibold uppercase tracking-[0.14em] text-primary";

/** Media components add their own vertical margin for blog prose; landing grids set their own. */
const MEDIA_WRAP = "min-w-0 [&_figure]:my-0";

/**
 * A clip when it has been recorded, else a still. Keeps every row illustrated
 * while the media recorder catches up.
 */
function ClipOrShot({ clip, shot, alt, caption }: { clip: string; shot: string; alt: string; caption: string }) {
  if (BLOG_MEDIA.clips[clip]) return <Clip id={clip} caption={caption} />;
  return <Shot id={shot} alt={alt} caption={caption} />;
}

function DocsLink({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <Link
      to="/docs/$"
      params={{ _splat: path }}
      className="font-medium text-foreground underline decoration-border underline-offset-4 hover:text-primary hover:decoration-primary"
    >
      {children}
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Should you switch?
// ---------------------------------------------------------------------------

const SWITCH_IF = [
  "You love Sunsama's board and calendar but want to own the app you plan in.",
  "You ask Claude, ChatGPT or Cursor to plan your day, and want a planner your agent can read, write and even extend.",
  "You want to self-host, or you need a public REST API for your own scripts.",
  "You like to plan fast from the keyboard, without a set ritual each morning.",
];

const STAY_IF = [
  "The guided daily planning and shutdown ritual is what keeps you on track.",
  "You pull tasks from Asana, Jira, Slack or Gmail every day and want that built in.",
  "Your team shares a Sunsama workspace.",
];

function SwitchSection() {
  return (
    <section className="border-t border-border/50 py-16 md:py-20">
      <div className="container mx-auto max-w-5xl px-4">
        <Reveal className="max-w-2xl">
          <h2 className={H2}>Switch if you want to own your planner</h2>
          <p className={LEAD}>
            Both apps help you plan a calm, realistic day. The real choice is between a guided, closed app and an open one
            you control.
          </p>
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <Reveal className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-6">
            <h3 className="text-[17px] font-semibold">Switch to Open Sunsama if…</h3>
            <ul className="mt-4 space-y-3">
              {SWITCH_IF.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed">
                  <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal delay={100} className="rounded-2xl border border-border/70 bg-card p-6">
            <h3 className="text-[17px] font-semibold">Stay with Sunsama if…</h3>
            <ul className="mt-4 space-y-3">
              {STAY_IF.map((item) => (
                <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-foreground/85">
                  <Minus className="mt-1 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// The daily loop, shown
// ---------------------------------------------------------------------------

const LOOP = [
  {
    title: "Plan your day on a board of days",
    body: "Today, tomorrow and your backlog sit side by side, like in Sunsama. Drag a task to the day you will do it. Anything you don't finish rolls over to the next day on its own.",
    media: { clip: "plan-day", shot: "board", alt: "Open Sunsama board with Today, Tomorrow and the backlog", caption: "Drag tasks from the backlog into Today." },
  },
  {
    title: "Time-block your real calendar",
    body: "Drag a task onto the calendar to give it a time slot, then drag the edge to set how long it takes. Your Google, Outlook and iCloud events sit right next to your blocks.",
    media: { clip: "time-block", shot: "calendar-day", alt: "Open Sunsama day view with time blocks next to meetings", caption: "Drop a task on the calendar and resize the block." },
  },
  {
    title: "Focus on one task and see planned vs actual",
    body: "Focus mode hides everything but the task in front of you. The timer tracks how long it really took, so tomorrow's plan is more honest.",
    media: { clip: "focus", shot: "focus", alt: "Open Sunsama focus mode with a running timer", caption: "Start focus mode and the timer tracks actual time." },
  },
  {
    title: "Do it all from the keyboard",
    body: "Press Cmd+K to find a task, jump to a day or run a command. Most actions have a shortcut, so a full plan takes a few minutes.",
    media: { clip: "command-palette", shot: "command-palette", alt: "Open Sunsama command palette open over the board", caption: "Cmd+K finds any task or command." },
  },
];

function LoopSection() {
  return (
    <section className="border-t border-border/50 py-16 md:py-24">
      <div className="container mx-auto max-w-5xl px-4">
        <Reveal className="max-w-2xl">
          <p className={EYEBROW}>The daily loop you know</p>
          <h2 className={cn(H2, "mt-3")}>Board, calendar, focus mode and rollover work like Sunsama</h2>
          <p className={LEAD}>
            The core of your day moves over as it is. Here is each part in the real app, not a mockup.
          </p>
        </Reveal>

        <div className="mt-12 space-y-14 md:space-y-20">
          {LOOP.map((row, i) => (
            <div key={row.title} className="grid items-center gap-6 md:grid-cols-5 md:gap-10">
              <Reveal className={cn("md:col-span-2", i % 2 === 1 && "md:order-2")}>
                <h3 className="text-[20px] font-semibold tracking-[-0.02em] md:text-[22px]">{row.title}</h3>
                <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{row.body}</p>
              </Reveal>
              <Reveal delay={100} className={cn(MEDIA_WRAP, "md:col-span-3", i % 2 === 1 && "md:order-1")}>
                <ClipOrShot {...row.media} />
              </Reveal>
            </div>
          ))}

          <div className="grid items-center gap-6 md:grid-cols-5 md:gap-10">
            <Reveal className="md:col-span-3">
              <h3 className="text-[20px] font-semibold tracking-[-0.02em] md:text-[22px]">Take your plan with you</h3>
              <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
                Use Open Sunsama on the web, as a desktop app for Mac, Windows and Linux, or in your phone's browser. Changes sync
                across devices in real time, so the plan you made at your desk is in your pocket.
              </p>
              <Button variant="outline" size="sm" className="mt-5 h-9 px-4 text-[13px]" asChild>
                <Link to="/download">
                  Download the desktop app
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </Reveal>
            <Reveal delay={100} className={cn(MEDIA_WRAP, "mx-auto w-full max-w-[260px] md:col-span-2")}>
              <Shot id="mobile-tasks" alt="Open Sunsama task list on a phone" caption="Your day on your phone." />
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// AI agents
// ---------------------------------------------------------------------------

const AGENT_PROMPTS = [
  "Plan my day around my meetings. Put my top three tasks in focus blocks.",
  "Yesterday went off track. Move what's left into free slots this week.",
  "Turn this brain dump into tasks for Thursday.",
];

function AgentSection() {
  return (
    <section className="border-t border-border/50 py-16 md:py-24">
      <div className="container mx-auto max-w-5xl px-4">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <Reveal className="min-w-0">
            <p className={EYEBROW}>AI native</p>
            <h2 className={cn(H2, "mt-3")}>Any AI agent can plan your day in Open Sunsama</h2>
            <p className={LEAD}>
              Paste one URL into Claude, ChatGPT, Cursor, Claude Code or any MCP client, then sign in. No API key needed.
              Your agent gets 24 tools for tasks, subtasks, time blocks and your calendar meetings, so it sees your
              meetings and tasks in one call and plans around them.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed text-muted-foreground">
              Sunsama has an MCP server too, and it works well. The difference is what sits behind it. Our code is public,
              so your agent can read it and even add the feature you want. And you can run the whole thing, agent access
              included, on your own server.
            </p>
            <p className="mt-4 text-[14px] text-muted-foreground">
              Setup guides: <DocsLink path="mcp/claude">Claude</DocsLink>, <DocsLink path="mcp/chatgpt">ChatGPT</DocsLink>,{" "}
              <DocsLink path="mcp/cursor">Cursor</DocsLink>, <DocsLink path="mcp/overview">any MCP client</DocsLink>.
            </p>
          </Reveal>

          <Reveal delay={120} className="min-w-0">
            <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-[0_24px_64px_-32px_hsl(var(--shadow-color)/0.35)]">
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2.5 text-[12px] text-muted-foreground">
                <Terminal className="h-3.5 w-3.5" />
                MCP server URL
              </div>
              <div className="overflow-x-auto px-4 py-4 font-mono text-[13px] text-foreground sm:text-[14px]">{MCP_URL}</div>
              <div className="border-t border-border/60 px-4 py-4">
                <p className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground">Then just ask</p>
                <ul className="mt-3 space-y-2">
                  {AGENT_PROMPTS.map((prompt) => (
                    <li key={prompt} className="flex gap-2.5 rounded-lg bg-muted/50 px-3 py-2 text-[14px] leading-snug">
                      <Bot className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{prompt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Reveal>
        </div>

        {BLOG_MEDIA.clips["ai-plan"] && (
          <Reveal className={cn(MEDIA_WRAP, "mx-auto mt-12 max-w-4xl")}>
            <Clip id="ai-plan" caption="An agent plans the afternoon over MCP. Tasks and time blocks appear live." />
          </Reveal>
        )}
      </div>
    </section>
  );
}

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

function CellValue({ value, primary }: { value: Cell; primary?: boolean }) {
  if (value === true) {
    return (
      <>
        <Check className={cn("mx-auto h-4 w-4", primary ? "text-primary" : "text-foreground/60")} />
        <span className="sr-only">Yes</span>
      </>
    );
  }
  if (value === false) {
    return (
      <>
        <X className="mx-auto h-4 w-4 text-muted-foreground/50" />
        <span className="sr-only">No</span>
      </>
    );
  }
  return <span className={cn("text-[12.5px] leading-snug sm:text-[13px]", primary ? "font-medium text-foreground" : "text-muted-foreground")}>{value}</span>;
}

function FeatureTableSection() {
  return (
    <section className="border-t border-border/50 py-16 md:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <Reveal className="text-center">
          <h2 className={H2}>Open Sunsama vs Sunsama, feature by feature</h2>
          <p className={LEAD}>Same daily loop. Sunsama has more guidance and integrations. Open Sunsama gives you the code, the API and the server.</p>
        </Reveal>
        <Reveal delay={100} className="mt-10 overflow-hidden rounded-2xl border border-border/70">
          <table className="w-full table-fixed text-[14px]">
            <colgroup>
              <col className="w-[46%] sm:w-[50%]" />
              <col className="w-[27%] sm:w-[25%]" />
              <col className="w-[27%] sm:w-[25%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border/70 bg-muted/40 text-[11px] uppercase tracking-wider sm:text-[12px]">
                <th scope="col" className="px-3 py-3 text-left font-medium text-muted-foreground sm:px-5">
                  Feature
                </th>
                <th scope="col" className="px-2 py-3 text-center font-semibold text-primary sm:px-4">
                  Open Sunsama
                </th>
                <th scope="col" className="px-2 py-3 text-center font-medium text-muted-foreground sm:px-4">
                  Sunsama
                </th>
              </tr>
            </thead>
            <tbody>
              {FEATURES.map((row) => (
                <tr key={row.name} className="border-b border-border/50 last:border-0">
                  <th scope="row" className="px-3 py-3 text-left text-[13px] font-normal leading-snug text-foreground/85 sm:px-5 sm:text-[14px]">
                    {row.name}
                  </th>
                  <td className="px-2 py-3 text-center sm:px-4">
                    <CellValue value={row.os} primary />
                  </td>
                  <td className="px-2 py-3 text-center sm:px-4">
                    <CellValue value={row.sunsama} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Reveal>
        <p className="mt-4 text-center text-[12px] text-muted-foreground">
          Sunsama features from{" "}
          <a href="https://www.sunsama.com/pricing" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
            sunsama.com
          </a>{" "}
          and its{" "}
          <a href="https://help.sunsama.com/docs/mcp-model-context-protocol" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-foreground">
            help center
          </a>
          , checked September 2026.
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// What you get / what you give up
// ---------------------------------------------------------------------------

const GAINS = [
  {
    icon: Code,
    title: "Code you can read and change",
    body: "The whole app is on GitHub. You, or your AI agent, can add the feature you need instead of filing a request and waiting.",
  },
  {
    icon: Server,
    title: "Run it on your own server",
    body: "Self-host with Docker, and your tasks never leave your machine. The hosted app works too if you'd rather not run a server.",
  },
  {
    icon: Terminal,
    title: "A public REST API",
    body: "Create an API key and script anything: n8n flows, Home Assistant, your own tools. A Sunsama API has been on its public roadmap since 2019.",
  },
  {
    icon: Database,
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

function TradeOffsSection() {
  return (
    <section className="border-t border-border/50 py-16 md:py-24">
      <div className="container mx-auto max-w-5xl px-4">
        <Reveal className="max-w-2xl">
          <h2 className={H2}>What you get that Sunsama doesn't offer</h2>
          <p className={LEAD}>Each one gives you more control over your planner and your data.</p>
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {GAINS.map((gain, i) => (
            <Reveal key={gain.title} delay={i * 80} className="rounded-2xl border border-border/70 bg-card p-6">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <gain.icon className="h-[18px] w-[18px]" />
              </div>
              <h3 className="mt-4 text-[16px] font-semibold">{gain.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{gain.body}</p>
            </Reveal>
          ))}
        </div>

        <Reveal className="mt-20 max-w-2xl">
          <h2 className={H2}>What you give up when you leave Sunsama</h2>
          <p className={LEAD}>Sunsama is a good app. Here is what it does that Open Sunsama doesn't, so you can decide with clear eyes.</p>
        </Reveal>
        <div className="mt-8 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/70">
          {GIVE_UPS.map((item) => (
            <Reveal key={item.title} className="grid gap-1 px-5 py-5 sm:grid-cols-[220px_1fr] sm:gap-6 sm:px-6">
              <h3 className="text-[15px] font-semibold">{item.title}</h3>
              <p className="text-[14.5px] leading-relaxed text-muted-foreground">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// How to switch
// ---------------------------------------------------------------------------

function StepsSection() {
  const steps = [
    {
      title: "Create an account, or self-host",
      body: (
        <>
          Sign up on the web and you are ready in a minute. Prefer your own server? Follow the{" "}
          <DocsLink path="self-hosting/docker">Docker guide</DocsLink>.
        </>
      ),
    },
    {
      title: "Connect your calendars",
      body: <>Add Google, Outlook or iCloud in Settings. Your meetings show up next to your tasks, so you can see what really fits in the day.</>,
    },
    {
      title: "Bring your tasks over",
      body: (
        <>
          There is no one-click import yet. Add your open tasks by hand, or connect both Sunsama's and Open Sunsama's MCP
          servers to Claude and ask it to move them. Check the result before you cancel Sunsama.
        </>
      ),
    },
  ];

  return (
    <section className="border-t border-border/50 py-16 md:py-24">
      <div className="container mx-auto max-w-5xl px-4">
        <Reveal className="max-w-2xl">
          <h2 className={H2}>Switch from Sunsama in 3 steps</h2>
          <p className={LEAD}>You can plan your first day in Open Sunsama the same morning you sign up.</p>
        </Reveal>
        <ol className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => (
            <Reveal as="li" key={step.title} delay={i * 100} className="rounded-2xl border border-border/70 bg-card p-6">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-[14px] font-semibold text-primary-foreground">
                {i + 1}
              </span>
              <h3 className="mt-4 text-[16px] font-semibold">{step.title}</h3>
              <p className="mt-2 text-[14.5px] leading-relaxed text-muted-foreground">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// License
// ---------------------------------------------------------------------------

function LicenseSection() {
  return (
    <section className="border-t border-border/50 py-16 md:py-20">
      <div className="container mx-auto max-w-3xl px-4">
        <Reveal className="rounded-2xl border border-border/70 bg-muted/30 p-6 md:p-8">
          <h2 className="text-[22px] font-semibold tracking-[-0.02em] md:text-[26px]">The license, in plain words</h2>
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
            className="mt-4 inline-flex items-center gap-1.5 text-[14px] font-medium text-primary underline-offset-4 hover:underline"
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

const FAQS = [
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

function FAQSection() {
  return (
    <section className="border-t border-border/50 py-16 md:py-24">
      <div className="container mx-auto max-w-2xl px-4">
        <Reveal className="text-center">
          <h2 className={H2}>Questions before you switch</h2>
        </Reveal>
        <div className="mt-10 space-y-2">
          {FAQS.map((faq, i) => (
            <details
              key={faq.question}
              open={i === 0}
              className="group rounded-xl border border-border/70 bg-card [&_summary::-webkit-details-marker]:hidden"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-3.5 text-left text-[15px] font-medium hover:bg-muted/30 sm:px-5">
                {faq.question}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="px-4 pb-4 text-[14.5px] leading-relaxed text-muted-foreground sm:px-5">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Final CTA
// ---------------------------------------------------------------------------

function FinalCTASection() {
  return (
    <section className="relative overflow-hidden border-t border-border/50 py-20 md:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[360px] w-[720px] max-w-full -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.14),transparent)] blur-2xl" />
      </div>
      <Reveal className="container mx-auto max-w-2xl px-4 text-center">
        <h2 className="text-[30px] font-semibold leading-[1.1] tracking-[-0.035em] md:text-[44px]">Plan tomorrow in Open Sunsama</h2>
        <p className="mx-auto mt-4 max-w-lg text-[16px] leading-relaxed text-muted-foreground">
          Drag your tasks onto a board, block time on your calendar, and let the AI agent you already use help run the day.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
          <Button size="lg" className="h-11 w-full rounded-lg px-5 text-[14px] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] sm:w-auto" asChild>
            <Link to="/register">
              Get started
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" size="lg" className="h-11 w-full rounded-lg px-5 text-[14px] sm:w-auto" asChild>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
              <Github className="h-4 w-4" />
              View the code on GitHub
            </a>
          </Button>
        </div>
        <p className="mt-4 text-[12px] text-muted-foreground">Open source · Works with Claude, ChatGPT and any MCP client · Self-host anytime</p>
        <p className="mt-6 text-[13px] text-muted-foreground">
          Still comparing? Read{" "}
          <Link to="/blog/$slug" params={{ slug: "best-calendar-apps-time-blocking" }} className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline">
            the 9 best time blocking apps
          </Link>{" "}
          or{" "}
          <Link to="/blog/$slug" params={{ slug: "motion-vs-sunsama" }} className="font-medium text-foreground/80 underline-offset-4 hover:text-primary hover:underline">
            Motion vs Sunsama
          </Link>
          .
        </p>
      </Reveal>
    </section>
  );
}

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
    <>
      <FAQSchema items={FAQS} />
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
      <div className="min-h-screen overflow-x-clip bg-background font-sans text-foreground antialiased">
        <SiteHeader />

        <main className="relative">
          <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] overflow-hidden">
            <div className="absolute left-1/2 top-[-120px] h-[420px] w-[820px] max-w-[120vw] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,hsl(var(--primary)/0.12),transparent)] blur-2xl" />
          </div>

          <div className="container mx-auto max-w-5xl px-4 pt-6">
            <Breadcrumbs items={[{ label: "Alternatives" }, { label: "Sunsama" }]} />
          </div>

          {/* Hero */}
          <section className="pb-12 pt-8 md:pb-16 md:pt-12">
            <div className="container mx-auto max-w-3xl px-4 text-center">
              <Reveal>
                <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[12px] font-semibold text-primary">
                  Open source · AI native
                </p>
              </Reveal>
              <Reveal delay={60}>
                <h1 className="mt-5 text-[34px] font-semibold leading-[1.08] tracking-[-0.035em] sm:text-[44px] md:text-[54px]">
                  The open-source <span className="text-primary">Sunsama alternative</span>
                </h1>
              </Reveal>
              <Reveal delay={120}>
                <p className="mx-auto mt-5 max-w-2xl text-[17px] leading-relaxed text-foreground/85 md:text-[19px]">
                  Open Sunsama is an open-source daily planner that works like Sunsama and connects to any AI agent.
                </p>
                <p className="mx-auto mt-3 max-w-xl text-[15px] leading-relaxed text-muted-foreground md:text-[16px]">
                  Plan your day on a board, time-block your calendar, and let Claude, ChatGPT or Cursor help. The code is
                  public, and you can run it on your own server.
                </p>
              </Reveal>
              <Reveal delay={180} className="mt-8 flex flex-col items-center justify-center gap-2.5 sm:flex-row">
                <Button size="lg" className="h-11 w-full rounded-lg px-5 text-[14px] shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] sm:w-auto" asChild>
                  <Link to="/register">
                    Get started
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="h-11 w-full rounded-lg px-5 text-[14px] sm:w-auto" asChild>
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">
                    <Github className="h-4 w-4" />
                    View on GitHub
                  </a>
                </Button>
              </Reveal>
              <Reveal delay={240} className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
                {["Public code on GitHub", "Works with any MCP client", "Self-host with Docker", "Web, desktop and mobile web"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5">
                    <Check className="h-3.5 w-3.5 text-primary" />
                    {item}
                  </span>
                ))}
              </Reveal>
            </div>

            <Reveal delay={200} y={24} className={cn(MEDIA_WRAP, "container mx-auto mt-12 max-w-4xl px-4")}>
              {BLOG_MEDIA.videos.tour ? (
                <DemoVideo id="tour" />
              ) : (
                <Shot id="board" alt="Open Sunsama board with tasks planned across days" caption="Your week on a board of days, with the calendar one click away." />
              )}
            </Reveal>
          </section>

          <SwitchSection />
          <LoopSection />
          <AgentSection />
          <FeatureTableSection />
          <TradeOffsSection />
          <StepsSection />
          <LicenseSection />
          <FAQSection />
          <FinalCTASection />
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
