/**
 * Production static server for the web app (see Dockerfile.web).
 *
 * Serves dist/ with an SPA fallback, like `serve -s`, but first checks for a
 * pre-rendered page: /blog/<slug> is served from dist/blog/<slug>.html so
 * crawlers that don't run JavaScript still see that post's meta tags
 * (see scripts/prerender-blog-meta.ts).
 *
 * Uncompressed files answer Range requests (Safari won't play <video> without
 * them). /blog-media/ names are content-hashed, so they cache for a year.
 *
 * Requests from AI assistants and search crawlers are reported to DataFast's
 * Bot traffic card, since those bots skip the browser script in index.html.
 */

import path from "node:path";
import { trackAICrawlerResponse } from "@datafast/ai-crawl";

const DIST_DIR = path.resolve(import.meta.dir, "dist");
const PORT = Number(process.env.PORT || 3000);

const PRIVATE_PAGE = /^(?:\/app(?:\/|$)|\/(?:login|register|forgot-password|reset-password|oauth\/consent)$)/;
const AUTH_PAGE = /^\/(?:login|register|forgot-password|reset-password|oauth\/consent)$/;

const COMPRESSIBLE = /\.(html|js|mjs|css|json|svg|xml|txt|vtt|webmanifest|map)$/;
const IMMUTABLE_DIRS = ["assets", "blog-media"].map((dir) => path.join(DIST_DIR, dir) + path.sep);
const gzipCache = new Map<string, { mtime: number; body: Uint8Array }>();

async function findFile(pathname: string) {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const candidates =
    clean === "/"
      ? ["/index.html"]
      : [clean, `${clean}.html`, `${clean}/index.html`];

  for (const candidate of candidates) {
    const filePath = path.join(DIST_DIR, candidate);
    if (!filePath.startsWith(DIST_DIR + path.sep)) return null;
    const file = Bun.file(filePath);
    try {
      if ((await file.stat()).isFile()) return { file, filePath };
    } catch {
      // Not found; try the next candidate
    }
  }
  return null;
}

function cacheControl(filePath: string) {
  if (filePath.endsWith(".html")) return "no-cache";
  // Vite fingerprints /assets; the media recorder content-hashes /blog-media
  if (IMMUTABLE_DIRS.some((dir) => filePath.startsWith(dir))) {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=86400";
}

function contentType(file: ReturnType<typeof Bun.file>, filePath: string) {
  return filePath.endsWith(".vtt") ? "text/vtt; charset=utf-8" : file.type;
}

/**
 * Parses a single "bytes=start-end" range. Returns null to serve the whole
 * file (no or multi-part Range) and "unsatisfiable" for a range outside it.
 */
function parseRange(header: string | null, size: number) {
  const match = header?.match(/^bytes=(\d*)-(\d*)$/);
  if (!match) return null;
  const [, from = "", to = ""] = match;
  if (!from && !to) return "unsatisfiable";
  const start = from ? Number(from) : Math.max(0, size - Number(to)); // "-N" = last N bytes
  const end = from && to ? Math.min(Number(to), size - 1) : size - 1;
  return start > end || start >= size ? "unsatisfiable" : { start, end };
}

async function respond(req: Request) {
  if (new URL(req.url).pathname === "/health") {
    return Response.json({ status: "ok" }, { headers: { "X-Robots-Tag": "noindex" } });
  }
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(req.url).pathname);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }
  if (pathname === "/free-time-blocking-app") {
    return new Response(null, { status: 301, headers: { Location: "/features/time-blocking" + new URL(req.url).search } });
  }

  // One public URL per document; preserve query strings through redirects.
  const canonicalPath = pathname === "/index.html" ? "/" : pathname.replace(/\.html$/, "").replace(/\/+$/, "") || "/";
  if (pathname !== canonicalPath && await findFile(canonicalPath)) {
    const url = new URL(req.url);
    url.pathname = canonicalPath;
    return new Response(null, { status: 308, headers: { Location: url.pathname + url.search } });
  }

  let found = await findFile(pathname);
  let status = 200;
  if (!found) {
    // Known client-side routes still boot the app. Unknown public pages and
    // missing assets must not look like successful homepage documents.
    const appPage = pathname === "/app" || pathname.startsWith("/app/");
    if (!appPage && !AUTH_PAGE.test(pathname)) status = 404;
    if (status === 404 && /\.[a-z0-9]+$/i.test(pathname)) return new Response("Not Found", { status, headers: { "X-Robots-Tag": "noindex" } });
    found = (await findFile("/index.html"))!;
  }
  const { file, filePath } = found;
  const headers = new Headers({
    "Content-Type": contentType(file, filePath),
    "Cache-Control": cacheControl(filePath),
  });
  if (status === 404 || PRIVATE_PAGE.test(pathname)) headers.set("X-Robots-Tag", "noindex, nofollow");
  if (status === 404) headers.set("Cache-Control", "no-store");

  const acceptsGzip = req.headers.get("accept-encoding")?.includes("gzip");
  if (acceptsGzip && COMPRESSIBLE.test(filePath)) {
    const mtime = file.lastModified;
    let cached = gzipCache.get(filePath);
    if (!cached || cached.mtime !== mtime) {
      cached = { mtime, body: Bun.gzipSync(await file.bytes()) };
      gzipCache.set(filePath, cached);
    }
    headers.set("Content-Encoding", "gzip");
    headers.set("Vary", "Accept-Encoding");
    return new Response(cached.body, { status, headers });
  }

  headers.set("Accept-Ranges", "bytes");
  const range = status === 200 ? parseRange(req.headers.get("range"), file.size) : null;
  if (range === "unsatisfiable") {
    headers.set("Content-Range", `bytes */${file.size}`);
    return new Response(null, { status: 416, headers });
  }
  if (range) {
    headers.set("Content-Range", `bytes ${range.start}-${range.end}/${file.size}`);
    return new Response(file.slice(range.start, range.end + 1), { status: 206, headers });
  }
  return new Response(file, { status, headers });
}

// Only the hosted site reports bots, so self-hosted copies send nothing
const PUBLIC_HOST = "opensunsama.com";
const BOT_TRACKING = {
  websiteId: "dfid_jPL5UjXncdpECKfScGiHQ",
  // Railway reaches this server over http; the public site is https
  publicOrigin: `https://${PUBLIC_HOST}`,
};

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const res = await respond(req);
    if (new URL(req.url).hostname === PUBLIC_HOST) {
      // Sends in the background; never awaited, so pages don't wait on DataFast
      trackAICrawlerResponse(req, res, BOT_TRACKING);
    }
    return res;
  },
});
console.log(`Serving ${DIST_DIR} on port ${server.port}`);
