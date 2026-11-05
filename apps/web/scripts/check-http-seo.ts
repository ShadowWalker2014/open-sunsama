import assert from "node:assert/strict";
import path from "node:path";

const child = Bun.spawn([process.execPath, "server.ts"], {
  cwd: path.resolve(import.meta.dir, ".."),
  env: { ...process.env, PORT: "0" },
  stdout: "pipe",
  stderr: "inherit",
});
try {
  const reader = child.stdout.getReader();
  const first = await reader.read();
  const port = new TextDecoder().decode(first.value).match(/on port (\d+)/)?.[1];
  assert.ok(port, "Server must start and report its port");
  reader.releaseLock();
  const origin = `http://localhost:${port}`;
  const get = (url: string, headers?: HeadersInit) => fetch(origin + url, { redirect: "manual", ...(headers ? { headers } : {}) });
  const health = await get("/health");
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { status: "ok" });
  assert.match(health.headers.get("x-robots-tag") ?? "", /noindex/);
  for (const pathname of ["/", "/docs", "/docs/mcp/overview", "/alternative/sunsama", "/download"]) {
    const response = await get(pathname);
    assert.equal(response.status, 200, pathname);
    assert.equal(response.headers.get("x-robots-tag"), null, pathname);
    assert.match(await response.text(), /<noscript>[\s\S]*<h1/);
  }
  for (const pathname of ["/missing-seo-test", "/docs/missing-seo-test", "/blog/missing-seo-test", "/missing.js", "/landing/missing.webp", "/blog-media/missing.mp4"]) {
    const response = await get(pathname);
    assert.equal(response.status, 404, pathname);
    assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/, pathname);
  }
  for (const pathname of ["/app", "/app/calendar", "/login", "/register", "/oauth/consent", "/reset-password?token=test"]) {
    const response = await get(pathname);
    assert.equal(response.status, 200, pathname);
    assert.match(response.headers.get("x-robots-tag") ?? "", /noindex/, pathname);
  }
  for (const [pathname, location, status] of [
    ["/docs/", "/docs", 308],
    ["/docs/mcp/overview.html?source=test", "/docs/mcp/overview?source=test", 308],
    ["/index.html", "/", 308],
    ["/free-time-blocking-app?source=test", "/features/time-blocking?source=test", 301],
  ] as const) {
    const response = await get(pathname);
    assert.equal(response.status, status, pathname);
    assert.equal(response.headers.get("location"), location, pathname);
  }
  // Safari media seeking and compressed HTML must retain their HTTP behavior.
  const partial = await get("/robots.txt", { Range: "bytes=0-9", "Accept-Encoding": "identity" });
  assert.equal(partial.status, 206);
  assert.equal((await partial.arrayBuffer()).byteLength, 10);
  const missingRange = await get("/missing-seo-test", { Range: "bytes=0-9", "Accept-Encoding": "identity" });
  assert.equal(missingRange.status, 404);
  const compressed = await get("/docs", { "Accept-Encoding": "gzip" });
  assert.equal(compressed.headers.get("content-encoding"), "gzip");
  assert.equal(compressed.headers.get("vary"), "Accept-Encoding");
  assert.match(await compressed.text(), /Open Sunsama Documentation/);
  const font = await get("/fonts/geist-regular.woff2");
  assert.equal(font.status, 200);
  assert.equal(new TextDecoder().decode((await font.arrayBuffer()).slice(0, 4)), "wOF2");
  console.log("HTTP SEO checks passed: public pages, 404s, private routes, redirects, ranges and gzip");
} finally {
  child.kill();
  await child.exited;
}
