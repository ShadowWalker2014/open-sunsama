import { useId } from "react";
import {
  formatStars,
  licenseShort,
  mcpLabel,
  monthYear,
  outboundLink,
  platformList,
  STATUS_LABELS,
  tableOrder,
} from "@/lib/oss-apps";
import { CAPTION_CLASS } from "./hooks";
import { useOssListEntry } from "./oss-list";

/**
 * A compact comparison table built from src/content/oss-apps.json, Open
 * Sunsama first when included. Usable in MDX without an import:
 *
 *   <OssTable ids={["open-sunsama", "vikunja", "super-productivity"]} />
 */
export function OssTable({ ids }: { ids: string[] }) {
  const key = useId();
  useOssListEntry(key, { kind: "table", ids });
  const apps = tableOrder(ids);
  if (!apps.length) return null;
  const checked = monthYear(apps.map((a) => a.checkedAt).sort()[0]);

  return (
    <figure className="oss-table my-8">
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th scope="col">App</th>
              <th scope="col">License</th>
              <th scope="col">Stars</th>
              <th scope="col">Latest release</th>
              <th scope="col">Platforms</th>
              <th scope="col">Self-host</th>
              <th scope="col">API</th>
              <th scope="col">MCP</th>
            </tr>
          </thead>
          <tbody>
            {apps.map((app) => (
              <tr key={app.id}>
                <td>
                  <a {...outboundLink(app.repo, true)}>{app.name}</a>
                  {app.status !== "active" && <span className="oss-table-status">{STATUS_LABELS[app.status]}</span>}
                </td>
                <td>{licenseShort(app)}</td>
                <td className="tabular-nums">{formatStars(app.stars)}</td>
                <td>{app.latestRelease ? `${app.latestRelease.version} (${monthYear(app.latestRelease.date)})` : "None"}</td>
                <td>{platformList(app)}</td>
                <td>{app.selfHost ?? "No"}</td>
                <td>{app.api.length ? app.api.join(", ") : "None"}</td>
                <td>{mcpLabel(app)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <figcaption className={CAPTION_CLASS}>
        Stars, licenses and releases from each project's repository, checked {checked}. App names link to the source code.
      </figcaption>
    </figure>
  );
}
