import { useId, type ReactNode } from "react";
import { BookOpen, Code2, Globe, TriangleAlert } from "lucide-react";
import {
  formatStars,
  getOssApp,
  isInactive,
  licenseShort,
  licenseUrl,
  mcpLabel,
  monthYear,
  outboundLink,
  type OssApp as OssAppData,
  platformList,
  STATUS_LABELS,
} from "@/lib/oss-apps";
import { FRAME_CLASS, warnMissing } from "./hooks";
import { useOssListEntry } from "./oss-list";

interface OssAppProps {
  id: string;
  /** Position in the post's ranking; also orders the ItemList JSON-LD */
  rank?: number;
  /** One line: who should pick this app */
  bestFor?: string;
}

/**
 * Tall screenshots (phone apps) stay under ~520px high, and small official
 * images are never scaled past their own width.
 */
const shotSize = (width: number, height: number) => ({
  aspectRatio: `${width} / ${height}`,
  maxWidth: `${Math.min(width, Math.round((520 * width) / height))}px`,
});

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="oss-fact">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Mcp({ app }: { app: OssAppData }) {
  const label = mcpLabel(app);
  if (!app.mcp.url) return <>{label}</>;
  return (
    <a {...outboundLink(app.mcp.url)} title={app.mcp.note}>
      {label}
    </a>
  );
}

/**
 * One ranked open source app: name, tagline, a real screenshot with its
 * source, facts pulled from the repo (see src/content/oss-apps.json) and links
 * to its code, site and docs. Usable in MDX without an import:
 *
 *   <OssApp id="vikunja" rank={2} bestFor="A self-hosted Todoist with kanban and Gantt views." />
 */
export function OssApp({ id, rank, bestFor }: OssAppProps) {
  const key = useId();
  useOssListEntry(key, { kind: "card", id, rank });
  const app = getOssApp(id);
  if (!app) {
    warnMissing("OssApp", id);
    return null;
  }

  const shot = app.screenshot;
  const checked = monthYear(app.checkedAt);
  const img = {
    width: shot.width,
    height: shot.height,
    alt: `${app.name} screenshot`,
    loading: "lazy" as const,
    decoding: "async" as const,
  };

  return (
    <section
      id={`app-${app.id}`}
      aria-label={rank ? `${rank}. ${app.name}` : app.name}
      className={`oss-card${isInactive(app) ? " oss-card-inactive" : ""}`}
    >
      <div className="px-5 pt-5 md:px-6 md:pt-6">
        <div className="flex items-start gap-3.5">
          {rank != null && (
            <span aria-hidden className="oss-rank">
              {rank}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <p className="oss-name">{app.name}</p>
              {app.status !== "active" && (
                <span className={`oss-pill ${isInactive(app) ? "oss-pill-warn" : ""}`}>
                  {STATUS_LABELS[app.status]}
                </span>
              )}
            </div>
            <p className="oss-tagline">{app.tagline}</p>
          </div>
        </div>

        {bestFor && (
          <p className="oss-bestfor">
            <span>Best for:</span> {bestFor}
          </p>
        )}
        {app.caveat && (
          <p className="oss-caveat">
            <TriangleAlert aria-hidden className="mt-[3px] h-3.5 w-3.5 shrink-0" />
            <span>{app.caveat}</span>
          </p>
        )}
      </div>

      {shot.light && (
        <figure className="mt-5 px-5 md:px-6">
          <div className={FRAME_CLASS} style={shotSize(shot.width, shot.height)}>
            <img {...img} src={shot.light} className={`block h-auto w-full${shot.dark ? " dark:hidden" : ""}`} />
            {shot.dark && <img {...img} src={shot.dark} className="hidden h-auto w-full dark:block" />}
          </div>
          <figcaption className="oss-credit">
            {shot.sourceUrl ? (
              <a {...outboundLink(shot.sourceUrl)}>
                {shot.source}
              </a>
            ) : (
              shot.source
            )}
          </figcaption>
        </figure>
      )}

      <dl className="oss-facts">
        <Fact label="License">
          <a
            {...outboundLink(licenseUrl(app))}
            className={`oss-license${app.license.spdx.startsWith("LicenseRef-") ? " oss-license-custom" : ""}`}
            title={app.license.name}
          >
            {licenseShort(app)}
          </a>
        </Fact>
        <Fact label="Stars">
          <span className="tabular-nums">★ {formatStars(app.stars)}</span>
          <span className="oss-sub">as of {checked}</span>
        </Fact>
        <Fact label="Latest release">
          {app.latestRelease ? (
            <>
              <span className="break-all">{app.latestRelease.version}</span>
              <span className="oss-sub">{monthYear(app.latestRelease.date)}</span>
            </>
          ) : (
            "No tagged releases"
          )}
        </Fact>
        <Fact label="Language">{app.primaryLanguage ?? "n/a"}</Fact>
        <Fact label="Platforms">{platformList(app)}</Fact>
        <Fact label="Self-host">{app.selfHost ?? "No server"}</Fact>
        <Fact label="API">{app.api.length ? app.api.join(", ") : "None"}</Fact>
        <Fact label="MCP">
          <Mcp app={app} />
        </Fact>
      </dl>

      <div className="oss-links">
        <a {...outboundLink(app.repo, true)} className="oss-btn oss-btn-primary">
          <Code2 aria-hidden className="h-4 w-4" />
          Source code
        </a>
        <a {...outboundLink(app.website)} className="oss-btn">
          <Globe aria-hidden className="h-4 w-4" />
          Website
        </a>
        {app.docs && (
          <a {...outboundLink(app.docs)} className="oss-btn">
            <BookOpen aria-hidden className="h-4 w-4" />
            Docs
          </a>
        )}
        <span className="oss-checked">Facts checked {checked}</span>
      </div>
    </section>
  );
}
