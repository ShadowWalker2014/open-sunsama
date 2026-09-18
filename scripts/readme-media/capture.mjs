/**
 * Captures the README screenshots and demo video from a running local stack
 * seeded with seed-demo.ts. Uses a frozen, mid-morning clock so "today", the
 * calendar, and the now-line look like a real workday.
 *
 *   cd scripts/readme-media && bun add playwright sharp
 *   DEMO_TOKEN=<jwt from seed-demo.ts> WEB_URL=http://localhost:3000 API_URL=http://localhost:3001 node capture.mjs
 *
 * Writes optimized PNGs, demo.gif, and demo.mp4 to docs/images/readme/.
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

const WEB = process.env.WEB_URL ?? "http://localhost:3000";
const API = process.env.API_URL ?? "http://localhost:3001";
const TOKEN = process.env.DEMO_TOKEN;
const NOW = new Date(process.env.DEMO_NOW ?? "2026-09-22T10:40:00-07:00");
const PUBLIC_MCP_URL = "https://api.opensunsama.com/mcp";
const OUT = path.resolve(import.meta.dirname, "../../docs/images/readme");
const RAW = process.env.RAW_DIR ?? path.join(tmpdir(), "opensunsama-readme-media");

if (!TOKEN) throw new Error("DEMO_TOKEN is required (printed by seed-demo.ts)");
mkdirSync(OUT, { recursive: true });
rmSync(RAW, { recursive: true, force: true });
mkdirSync(RAW, { recursive: true });

async function api(method, route, body) {
  const res = await fetch(`${API}${route}`, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${route} → ${res.status} ${JSON.stringify(json)}`);
  return json.data ?? json;
}

const pkce = () => {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
};

function authorizeUrl(clientId, redirectUri) {
  const url = new URL(`${API}/oauth/authorize`);
  const { challenge } = pkce();
  for (const [k, v] of Object.entries({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    code_challenge: challenge,
    code_challenge_method: "S256",
    state: "demo",
    resource: `${API}/mcp`,
  })) url.searchParams.set(k, v);
  return url.toString();
}

/** Run the real OAuth flow so Settings → Connected apps lists Claude and ChatGPT. */
async function connectApp(clientId, redirectUri) {
  const { verifier, challenge } = pkce();
  const url = new URL(authorizeUrl(clientId, redirectUri));
  url.searchParams.set("code_challenge", challenge);
  const hop = await fetch(url, { redirect: "manual" });
  const request = new URL(hop.headers.get("location")).searchParams.get("request");
  const { redirectTo } = await api("POST", "/oauth/consent", { request, decision: "allow" });
  const code = new URL(redirectTo).searchParams.get("code");
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      redirect_uri: redirectUri,
      code_verifier: verifier,
    }),
  });
  if (!res.ok) throw new Error(`token exchange for ${clientId} failed: ${await res.text()}`);
  // Mark it used so "Last used" reads like a real connection.
  const { access_token } = await res.json();
  await fetch(`${API}/mcp`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${access_token}`,
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
  });
}

const CLAUDE = ["https://claude.ai/oauth/mcp-oauth-client-metadata", "https://claude.ai/api/mcp/auth_callback"];
const CHATGPT = ["https://chatgpt.com/oauth/client.json", "https://chatgpt.com/connector_platform_oauth_redirect"];

const browser = await chromium.launch();

async function newPage({ theme = "light", width = 1440, height = 900, scale = 2, video = false, mobile = false } = {}) {
  await api("PATCH", "/auth/me", { preferences: { themeMode: theme, colorTheme: "default", fontFamily: "geist", workStartHour: 8, workEndHour: 18 } });
  const me = await api("GET", "/auth/me");
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: scale,
    colorScheme: theme === "dark" ? "dark" : "light",
    timezoneId: "America/Los_Angeles",
    locale: "en-US",
    isMobile: mobile,
    hasTouch: mobile,
    ...(video ? { recordVideo: { dir: RAW, size: { width, height } } } : {}),
  });
  await context.addInitScript(
    ({ token, user, localMcp, publicMcp }) => {
      localStorage.setItem("open_sunsama_token", token);
      localStorage.setItem("open_sunsama_user", JSON.stringify(user));
      // The local stack renders its own API URL; show the hosted one in every frame.
      const rewrite = (root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (node.nodeValue.includes(localMcp)) node.nodeValue = node.nodeValue.replaceAll(localMcp, publicMcp);
        }
      };
      new MutationObserver(() => rewrite(document.body ?? document.documentElement)).observe(document, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    },
    { token: TOKEN, user: me, localMcp: `${API}/mcp`, publicMcp: PUBLIC_MCP_URL }
  );
  const page = await context.newPage();
  await page.clock.install({ time: NOW });
  return { context, page };
}

async function settle(page, ms = 1200) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

/** Week view opens at midnight; start it at the beginning of the workday. */
async function scrollCalendarToMorning(page) {
  await page.getByText("7 AM", { exact: true }).first().evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.waitForTimeout(400);
}

async function shot(page, name, options = {}) {
  await page.screenshot({ path: path.join(RAW, `${name}.png`), ...options });
  console.log("captured", name);
}

/** Screenshot a dialog plus some of the dimmed page around it, so it reads at README size. */
async function shotAround(page, name, locator, margin = { x: 120, y: 90 }) {
  const box = await locator.boundingBox();
  const viewport = page.viewportSize();
  const x = Math.max(0, box.x - margin.x);
  const y = Math.max(0, box.y - margin.y);
  await shot(page, name, {
    clip: {
      x,
      y,
      width: Math.min(viewport.width - x, box.width + margin.x * 2),
      height: Math.min(viewport.height - y, box.height + margin.y * 2),
    },
  });
}

const tasks = await api("GET", "/tasks?date=2026-09-22");
const roadmap = tasks.find((t) => t.title.startsWith("Finalize Q4 roadmap"));

/**
 * Full-frame light + dark WebP assets for the marketing site
 * (apps/web/public/landing/). Run with ONLY=web to skip the README pass.
 */
async function captureWebAssets() {
  const webOut = path.resolve(import.meta.dirname, "../../apps/web/public/landing");
  mkdirSync(webOut, { recursive: true });
  for (const theme of ["light", "dark"]) {
    const { context, page } = await newPage({ theme });
    const save = async (name) => {
      const buf = await page.screenshot();
      await sharp(buf).webp({ quality: 84, effort: 6 }).toFile(path.join(webOut, `${name}-${theme}.webp`));
      console.log("web asset", `${name}-${theme}`);
    };
    await page.goto(`${WEB}/app/board`);
    await settle(page, 2000);
    await save("board");
    await page.getByText("Finalize Q4 roadmap for leadership review").first().click();
    await settle(page, 1200);
    await save("task-detail");
    await page.keyboard.press("Escape");
    await page.goto(`${WEB}/app/calendar`);
    await settle(page);
    await page.getByRole("tab", { name: "Week", exact: true }).click();
    await settle(page, 1500);
    await scrollCalendarToMorning(page);
    await save("calendar-week");
    await page.goto(`${WEB}/app/board`);
    await settle(page, 1500);
    await page.keyboard.press("Meta+k");
    await page.waitForTimeout(500);
    await page.keyboard.type("review", { delay: 40 });
    await page.waitForTimeout(1000);
    await save("command-palette");
    await page.keyboard.press("Escape");
    await page.goto(`${WEB}/app/focus/${roadmap.id}`);
    await settle(page, 1500);
    await save("focus");
    await page.goto(`${WEB}/app/ideas`);
    await settle(page);
    await save("ideas");
    await context.close();
  }
  // Restore the light theme the README shots expect.
  await newPage().then(({ context }) => context.close());
}

if (process.env.ONLY === "web") {
  await captureWebAssets();
  await browser.close();
  process.exit(0);
}

// Set CONNECT_APPS=0 on re-runs so Connected apps isn't duplicated.
if (process.env.CONNECT_APPS !== "0") {
  await connectApp(...CLAUDE);
  await connectApp(...CHATGPT);
}

// --- Light app views -------------------------------------------------------
{
  const { context, page } = await newPage();
  await page.goto(`${WEB}/app/board`);
  await settle(page, 2000);
  await shot(page, "board");

  await page.getByText("Finalize Q4 roadmap for leadership review").first().click();
  await settle(page, 1200);
  await shotAround(page, "task-detail", page.getByRole("dialog").first());
  await page.keyboard.press("Escape");

  await page.goto(`${WEB}/app/calendar`);
  await settle(page);
  await page.getByRole("tab", { name: "Week", exact: true }).click();
  await settle(page, 1500);
  await scrollCalendarToMorning(page);
  await shot(page, "calendar-week");

  await page.goto(`${WEB}/app/tasks`);
  await settle(page);
  await shot(page, "tasks");

  await page.goto(`${WEB}/app/ideas`);
  await settle(page);
  await shot(page, "ideas");

  await page.goto(`${WEB}/app/board`);
  await settle(page, 1500);
  await page.keyboard.press("Meta+k");
  await page.waitForTimeout(500);
  await page.keyboard.type("review", { delay: 60 });
  await page.waitForTimeout(1000);
  await shotAround(page, "command-palette", page.getByRole("dialog").first(), { x: 160, y: 70 });
  await page.keyboard.press("Escape");

  // Timer state is server-side; start it in the DB relative to DEMO_NOW for a running timer.
  await page.goto(`${WEB}/app/focus/${roadmap.id}`);
  await settle(page, 1500);
  await shot(page, "focus");

  await page.setViewportSize({ width: 1100, height: 900 });
  await page.goto(`${WEB}/app/settings?tab=mcp`);
  await settle(page, 1500);
  await shot(page, "mcp-settings", { clip: { x: 0, y: 0, width: 780, height: 900 } });
  await context.close();
}

// --- Dark hero ---------------------------------------------------------------
{
  const { context, page } = await newPage({ theme: "dark" });
  await page.goto(`${WEB}/app/board`);
  await settle(page, 2000);
  await shot(page, "board-dark");
  await context.close();
}

// --- Consent screens (real authorize → consent hand-off) ---------------------
for (const [name, client] of [["consent-claude", CLAUDE], ["consent-chatgpt", CHATGPT]]) {
  const { context, page } = await newPage({ width: 560, height: 760 });
  await page.goto(authorizeUrl(...client));
  await settle(page, 1500);
  await shot(page, name);
  await context.close();
}

// --- Mobile -------------------------------------------------------------------
{
  const { context, page } = await newPage({ width: 390, height: 844, scale: 3, mobile: true });
  await page.goto(`${WEB}/app/tasks`);
  await settle(page, 2000);
  await shot(page, "mobile-tasks");
  await context.close();
}

// --- Demo video ---------------------------------------------------------------
{
  const { context, page } = await newPage({ width: 1440, height: 900, scale: 1, video: true });
  const pause = (ms) => page.waitForTimeout(ms);
  await page.goto(`${WEB}/app/board`);
  await settle(page, 1800);

  await page.getByRole("button", { name: /Add task/ }).first().click();
  await pause(500);
  await page.keyboard.type("Prep talking points for Thursday's board meeting", { delay: 35 });
  await pause(400);
  await page.keyboard.press("Enter");
  await pause(1600);
  await page.keyboard.press("Escape");
  await pause(300);

  await page.getByText("Finalize Q4 roadmap for leadership review").first().click();
  await pause(2200);
  await page.keyboard.press("Escape");
  await pause(600);

  await page.getByRole("link", { name: "Calendar" }).first().click();
  await pause(1200);
  await page.getByRole("tab", { name: "Week", exact: true }).click();
  await pause(600);
  await scrollCalendarToMorning(page);
  await pause(1800);

  await page.getByRole("link", { name: "Tasks" }).first().click();
  await pause(1800);
  await page.getByRole("link", { name: "Ideas" }).first().click();
  await pause(1800);

  await page.keyboard.press("Meta+k");
  await pause(500);
  await page.keyboard.type("connect ai", { delay: 70 });
  await pause(900);
  await page.keyboard.press("Enter");
  await pause(3700);

  const video = page.video();
  await context.close();
  renameSync(await video.path(), path.join(RAW, "demo.webm"));
}

await browser.close();

// --- Optimize ------------------------------------------------------------------
for (const file of readdirSync(RAW).filter((f) => f.endsWith(".png"))) {
  let image = sharp(path.join(RAW, file));
  if (file.startsWith("consent-")) {
    // Trim the empty page around the consent card, then add even breathing room.
    const trimmed = await image.trim({ threshold: 12 }).toBuffer();
    image = sharp(trimmed).extend({ top: 56, bottom: 56, left: 56, right: 56, background: "#ffffff" });
  }
  await image.png({ palette: true, quality: 92, effort: 10, compressionLevel: 9 }).toFile(path.join(OUT, file));
}

const webm = path.join(RAW, "demo.webm");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", webm, "-vf", "fps=30,scale=1440:-2", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "22", "-movflags", "+faststart", path.join(OUT, "demo.mp4")]);
execFileSync("ffmpeg", [
  "-loglevel", "error", "-y", "-i", webm,
  "-vf", "fps=12,scale=1100:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=192:stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle",
  path.join(OUT, "demo.gif"),
]);

for (const file of readdirSync(OUT)) {
  console.log(file);
}
