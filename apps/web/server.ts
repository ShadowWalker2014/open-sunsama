/**
 * Production static server for the web app (see Dockerfile.web).
 *
 * Serves dist/ with an SPA fallback, like `serve -s`, but first checks for a
 * pre-rendered page: /blog/<slug> is served from dist/blog/<slug>.html so
 * crawlers that don't run JavaScript still see that post's meta tags
 * (see scripts/prerender-blog-meta.ts).
 */

import path from "node:path";

const DIST_DIR = path.resolve(import.meta.dir, "dist");
const PORT = 3000;

const COMPRESSIBLE = /\.(html|js|mjs|css|json|svg|xml|txt|webmanifest|map)$/;
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
  // Vite fingerprints everything under /assets
  if (filePath.startsWith(path.join(DIST_DIR, "assets") + path.sep)) {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=86400";
}

async function respond(req: Request) {
  let pathname: string;
  try {
    pathname = decodeURIComponent(new URL(req.url).pathname);
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const found =
    (await findFile(pathname)) ?? (await findFile("/index.html"))!;
  const { file, filePath } = found;
  const headers = new Headers({
    "Content-Type": file.type,
    "Cache-Control": cacheControl(filePath),
  });

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
    return new Response(cached.body, { headers });
  }

  return new Response(file, { headers });
}

Bun.serve({ port: PORT, fetch: respond });
console.log(`Serving ${DIST_DIR} on port ${PORT}`);
