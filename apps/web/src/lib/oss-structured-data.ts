/**
 * ItemList JSON-LD for posts that rank open source apps with <OssApp>. Kept
 * out of structured-data.ts so pages without app lists don't bundle the
 * registry. Relative imports only: scripts/prerender-blog-meta.ts uses it.
 */

import { CATEGORY_LABELS, licenseUrl, type OssApp, PLATFORM_LABELS } from "./oss-apps";
import { SITE_URL } from "./structured-data";

const absolute = (url: string) => (url.startsWith("http") ? url : `${SITE_URL}${url}`);

/**
 * ItemList of the apps a "best open source X" post ranks, each a
 * SoftwareApplication with its license, source repo (sameAs) and version.
 * `apps` is already in rank order.
 */
export function ossItemListJsonLd(apps: OssApp[], list: { name: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: list.name,
    url: `${SITE_URL}/blog/${list.slug}`,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: apps.length,
    itemListElement: apps.map((app, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "SoftwareApplication",
        name: app.name,
        url: app.website,
        description: app.tagline,
        applicationCategory: "BusinessApplication",
        applicationSubCategory: app.categories.map((c) => CATEGORY_LABELS[c]).join(", "),
        operatingSystem: app.platforms
          .filter((p) => p !== "server")
          .map((p) => PLATFORM_LABELS[p])
          .join(", "),
        license: licenseUrl(app),
        sameAs: [app.repo],
        ...(app.latestRelease ? { softwareVersion: app.latestRelease.version.replace(/^v(?=\d)/, "") } : {}),
        ...(app.screenshot.light ? { screenshot: absolute(app.screenshot.light) } : {}),
      },
    })),
  };
}
