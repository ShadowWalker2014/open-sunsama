import { Link } from "@tanstack/react-router";
import { Command, Github } from "lucide-react";
import { GITHUB_URL } from "./site-header";

const FOOTER_COLUMNS: Array<{ title: string; links: Array<[string, string]> }> = [
  {
    title: "Product",
    links: [
      ["Time blocking", "/features/time-blocking"],
      ["Kanban board", "/features/kanban"],
      ["Focus mode", "/features/focus-mode"],
      ["Calendar sync", "/features/calendar-sync"],
      ["AI and MCP", "/features/ai-integration"],
      ["Command palette", "/features/command-palette"],
      ["Download", "/download"],
    ],
  },
  {
    title: "Compare",
    links: [
      ["Sunsama alternative", "/alternative/sunsama"],
      ["Motion alternative", "/alternative/motion"],
      ["Akiflow alternative", "/alternative/akiflow"],
      ["Reclaim alternative", "/alternative/reclaim"],
      ["Todoist alternative", "/alternative/todoist"],
    ],
  },
  {
    title: "For",
    links: [
      ["Developers", "/for/developers"],
      ["Remote workers", "/for/remote-workers"],
      ["ADHD", "/for/adhd"],
      ["Open-source task manager", "/open-source-task-manager"],
    ],
  },
  {
    title: "Resources",
    links: [
      ["Docs", "/docs"],
      ["Connect your AI", "/docs/mcp/overview"],
      ["Self-hosting", "/docs/self-hosting/docker"],
      ["Blog", "/blog"],
      ["Privacy", "/privacy"],
      ["Terms", "/terms"],
    ],
  },
];

const LINK =
  "rounded-sm text-[13px] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/** The one footer for every public page. */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/60 py-14">
      <div className="container mx-auto grid max-w-6xl gap-10 px-4 sm:grid-cols-2 md:grid-cols-[1.3fr_repeat(4,1fr)]">
        <div className="sm:col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2">
            <img src="/open-sunsama-logo.png" alt="Open Sunsama" className="h-7 w-7 rounded-lg object-cover" />
            <span className="text-[14px] font-semibold">Open Sunsama</span>
          </Link>
          <p className="mt-3 max-w-[240px] text-[13px] leading-relaxed text-muted-foreground">
            The open-source daily planner you can control from any AI agent.
          </p>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 text-[13px] text-muted-foreground hover:text-foreground"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="text-[12px] font-semibold uppercase tracking-wider text-foreground/70">{column.title}</p>
            <ul className="mt-3 space-y-2">
              {column.links.map(([label, href]) => (
                <li key={href}>
                  <Link to={href} search={href === "/blog" ? {} : undefined} className={LINK}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="container mx-auto mt-12 flex max-w-6xl flex-col items-center justify-between gap-2 border-t border-border/50 px-4 pt-6 text-[12px] text-muted-foreground sm:flex-row">
        <span>© {new Date().getFullYear()} Open Sunsama</span>
        <span className="flex items-center gap-1.5">
          <Command className="h-3 w-3" />
          Built in the open
        </span>
      </div>
    </footer>
  );
}
