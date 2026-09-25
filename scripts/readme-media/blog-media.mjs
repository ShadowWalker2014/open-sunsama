/**
 * Records the product media that blog posts embed with <Shot>, <Clip> and
 * <DemoVideo>: light + dark screenshots, short silent loops, and two narrated
 * walkthroughs. Runs against a LOCAL stack seeded with seed-demo.ts, re-seeding
 * between takes so every recording starts from the same workday, with the page
 * clock frozen mid-morning (DEMO_NOW).
 *
 *   cd scripts/readme-media && bun add playwright sharp   # once
 *   WEB_URL=http://localhost:3107 API_URL=http://localhost:3101 \
 *   DEMO_PASSWORD='...' VO_DIR=/path/to/vo CAPTION_FONT=/path/to/Geist-Medium.ttf \
 *   node blog-media.mjs
 *
 * Env:
 *   WEB_URL, API_URL   local web + API (never production: every take re-seeds the account)
 *   DEMO_EMAIL         demo account (default alex@example.com)
 *   DEMO_PASSWORD      demo account password (required)
 *   DEMO_TODAY         seeded "today" (default 2026-09-24)
 *   DEMO_NOW           frozen page clock (default 2026-09-24T10:40:00-07:00)
 *   ONLY               comma list of kinds (shots, clips, videos), ids (board, plan-day, tour), or
 *                      kind:id (clips:focus) where a shot and a clip share an id
 *   THEMES             comma list (default light,dark)
 *   VO_DIR             narration for the videos: <VO_DIR>/<video>/vo1.mp3... one clip per scene,
 *                      spoken from the `line`s in VIDEOS below (ElevenLabs "Bella - Professional, Bright, Warm",
 *                      eleven_multilingual_v2), and <VO_DIR>/<video>/timings/voN.json word timings:
 *                      whisper voN.mp3 --model base.en --word_timestamps True --output_format json
 *   CAPTIONS_PY        record-demo-video skill's captions.py (default ~/.claude/skills/...)
 *   PYTHON             python with Pillow for captions.py (default python3)
 *   CAPTION_FONT       the app's font (Geist Medium) as .ttf/.woff2
 *   RAW_DIR            scratch folder for raw recordings (default $TMPDIR/opensunsama-blog-media)
 *
 * Writes content-hashed files to apps/web/public/blog-media/ (removing the
 * superseded file of the same name) and the manifest apps/web/src/lib/blog-media.json.
 * A partial run (ONLY=...) keeps the manifest entries it did not touch. Needs bun (for the
 * seed), ffmpeg and Python 3 with Pillow; a full run takes about 12 minutes.
 */

import { chromium } from "playwright";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { createHash, randomBytes } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, statSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import path from "node:path";

const HERE = import.meta.dirname;
const ROOT = path.resolve(HERE, "../..");
const WEB = process.env.WEB_URL ?? "http://localhost:3107";
const API = process.env.API_URL ?? "http://localhost:3101";
const EMAIL = process.env.DEMO_EMAIL ?? "alex@example.com";
const PASSWORD = process.env.DEMO_PASSWORD;
const TODAY = process.env.DEMO_TODAY ?? "2026-09-24";
const NOW = new Date(process.env.DEMO_NOW ?? "2026-09-24T10:40:00-07:00");
const END_OF_DAY = new Date(`${TODAY}T17:25:00-07:00`);
const PUBLIC_MCP_URL = "https://api.opensunsama.com/mcp";
const OUT = path.join(ROOT, "apps/web/public/blog-media");
const MANIFEST = path.join(ROOT, "apps/web/src/lib/blog-media.json");
const RAW = process.env.RAW_DIR ?? path.join(tmpdir(), "opensunsama-blog-media");
const VO_DIR = process.env.VO_DIR;
const CAPTIONS_PY = process.env.CAPTIONS_PY ?? path.join(homedir(), ".claude/skills/record-demo-video/scripts/captions.py");
const PYTHON = process.env.PYTHON ?? "python3";
const CAPTION_FONT = process.env.CAPTION_FONT;
const THEMES = (process.env.THEMES ?? "light,dark").split(",");
const ONLY = new Set((process.env.ONLY ?? "").split(",").filter(Boolean));
const want = (kind, id) => ONLY.size === 0 || ONLY.has(kind) || ONLY.has(id) || ONLY.has(`${kind}:${id}`);

if (!PASSWORD) throw new Error("DEMO_PASSWORD is required");
if (/opensunsama\.com/.test(API)) throw new Error("Refusing to run against production: every take re-seeds the account");
mkdirSync(OUT, { recursive: true });
mkdirSync(RAW, { recursive: true });

// ---------------------------------------------------------------------------
// Data: seed, API, MCP
// ---------------------------------------------------------------------------

let TOKEN = "";

/** Reset the demo workspace to the seeded workday and refresh the session token. */
function seed() {
  const out = execFileSync("bun", ["run", "seed-demo.ts"], {
    cwd: HERE,
    env: { ...process.env, DEMO_API_URL: API, DEMO_EMAIL: EMAIL, DEMO_PASSWORD: PASSWORD, DEMO_TODAY: TODAY, DEMO_RESET: "1" },
    encoding: "utf8",
  });
  TOKEN = out.match(/^TOKEN=(.+)$/m)[1].trim();
}

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

const allTasks = () => api("GET", "/tasks?limit=500");
const blocksOn = (date) => api("GET", `/time-blocks?from=${date}&to=${date}`);
async function taskByTitle(prefix) {
  const task = (await allTasks()).find((t) => t.title.startsWith(prefix));
  if (!task) throw new Error(`no task "${prefix}"`);
  return task;
}
/** Remove today's blocks that start at or after `from` (HH:MM), leaving their tasks unscheduled. */
async function clearBlocksFrom(from, date = TODAY) {
  for (const block of await blocksOn(date)) {
    if (block.startTime.slice(0, 5) >= from && block.title !== "Lunch") await api("DELETE", `/time-blocks/${block.id}`);
  }
}

const pkce = () => {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
};

function authorizeUrl(clientId, redirectUri, challenge = pkce().challenge) {
  const url = new URL(`${API}/oauth/authorize`);
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

/** The real OAuth flow a connector runs: authorize → consent (allow) → token. Returns the access token. */
async function connectApp(clientId, redirectUri) {
  const { verifier, challenge } = pkce();
  const hop = await fetch(authorizeUrl(clientId, redirectUri, challenge), { redirect: "manual" });
  const request = new URL(hop.headers.get("location")).searchParams.get("request");
  const { redirectTo } = await api("POST", "/oauth/consent", { request, decision: "allow" });
  const code = new URL(redirectTo).searchParams.get("code");
  const res = await fetch(`${API}/oauth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "authorization_code", code, client_id: clientId, redirect_uri: redirectUri, code_verifier: verifier }),
  });
  if (!res.ok) throw new Error(`token exchange for ${clientId} failed: ${await res.text()}`);
  return (await res.json()).access_token;
}

const CLAUDE = ["https://claude.ai/oauth/mcp-oauth-client-metadata", "https://claude.ai/api/mcp/auth_callback"];
const CHATGPT = ["https://chatgpt.com/oauth/client.json", "https://chatgpt.com/connector_platform_oauth_redirect"];

let claudeToken = null;
/** Connect Claude and ChatGPT once per run, so Settings → MCP lists them and the agent has a token. */
async function ensureConnectedApps() {
  if (claudeToken) return;
  claudeToken = await connectApp(...CLAUDE);
  await mcp("tools/list", {});
  const chatgptToken = await connectApp(...CHATGPT);
  await mcp("tools/list", {}, chatgptToken);
}

let rpcId = 0;
/** One JSON-RPC call to the remote MCP endpoint, authenticated the way Claude is. */
async function mcp(method, params, token = claudeToken) {
  const res = await fetch(`${API}/mcp`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
    body: JSON.stringify({ jsonrpc: "2.0", id: ++rpcId, method, params }),
  });
  const json = await res.json();
  if (json.error || json.result?.isError) throw new Error(`MCP ${method} failed: ${JSON.stringify(json.error ?? json.result)}`);
  return json.result;
}
const callTool = async (name, args) => (await mcp("tools/call", { name, arguments: args })).content?.[0]?.text ?? "";
const idFrom = (text) => text.match(/ID: (\S+)/)?.[1];

// ---------------------------------------------------------------------------
// Browser
// ---------------------------------------------------------------------------

const browser = await chromium.launch();

/** Fake cursor: headless recordings have none, and a demo without one is hard to follow. */
const CURSOR_SCRIPT = () => {
  const install = () => {
    if (document.getElementById("__demo_cursor")) return;
    const cursor = document.createElement("div");
    cursor.id = "__demo_cursor";
    cursor.innerHTML =
      '<svg width="22" height="26" viewBox="0 0 22 26" xmlns="http://www.w3.org/2000/svg"><path d="M2 1.5v19.2l5.1-4.6 3.3 7.6 3.6-1.6-3.3-7.4h6.9L2 1.5z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    Object.assign(cursor.style, {
      position: "fixed", left: "-40px", top: "-40px", zIndex: "2147483647", pointerEvents: "none",
      transformOrigin: "2px 2px", transition: "transform 120ms ease", filter: "drop-shadow(0 1px 2px rgb(0 0 0 / 0.35))",
    });
    document.documentElement.appendChild(cursor);
    const move = (e) => { cursor.style.left = `${e.clientX - 2}px`; cursor.style.top = `${e.clientY - 2}px`; };
    window.addEventListener("mousemove", move, true);
    window.addEventListener("pointermove", move, true);
    window.addEventListener("mousedown", () => (cursor.style.transform = "scale(0.86)"), true);
    window.addEventListener("mouseup", () => (cursor.style.transform = "scale(1)"), true);
    const last = window.__demoCursorAt;
    if (last) move(last);
  };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", install);
  else install();
};

async function newPage({ theme = "light", width = 1440, height = 900, scale = 2, video = null, mobile = false, now = NOW, cursor = !!video, backlog = false } = {}) {
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
    permissions: ["clipboard-read", "clipboard-write"],
    ...(video ? { recordVideo: { dir: video, size: { width, height } } } : {}),
  });
  await context.addInitScript(
    ({ token, user, localMcp, publicMcp, backlog }) => {
      localStorage.setItem("open_sunsama_token", token);
      localStorage.setItem("open_sunsama_user", JSON.stringify(user));
      localStorage.setItem("open-sunsama-backlog-pinned", String(backlog));
      // Always load fresh data: takes change the account between page loads.
      localStorage.removeItem("open_sunsama_rq_cache_v1");
      // The local stack renders its own API URL; show the hosted one in every frame.
      const rewrite = (root) => {
        const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (node.nodeValue.includes(localMcp)) node.nodeValue = node.nodeValue.replaceAll(localMcp, publicMcp);
        }
      };
      new MutationObserver(() => rewrite(document.body ?? document.documentElement)).observe(document, {
        childList: true, subtree: true, characterData: true,
      });
    },
    { token: TOKEN, user: me, localMcp: `${API}/mcp`, publicMcp: PUBLIC_MCP_URL, backlog }
  );
  if (cursor) await context.addInitScript(CURSOR_SCRIPT);
  // Timers are stamped with the server's real time; shift them onto the page's frozen clock.
  let skew = 0;
  await context.route(`${API}/tasks**`, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /"timerStartedAt":"([^"]+)"/g,
      (_, iso) => `"timerStartedAt":"${new Date(Date.parse(iso) + skew).toISOString()}"`
    );
    await route.fulfill({ response, body });
  });
  const page = await context.newPage();
  skew = now.getTime() - Date.now();
  await page.clock.install({ time: now });
  return { context, page };
}

async function settle(page, ms = 1200) {
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(ms);
}

async function go(page, route, ms = 1500) {
  await page.goto(`${WEB}${route}`);
  await settle(page, ms);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** A mouse that moves like a hand: eased, slightly curved, never teleporting. */
function humanMouse(page) {
  const vp = page.viewportSize();
  let at = { x: vp.width * 0.62, y: vp.height * 0.55 };
  const self = {
    get at() { return at; },
    async place(x, y) {
      at = { x, y };
      await page.mouse.move(x, y);
    },
    async move(x, y, ms) {
      const dist = Math.hypot(x - at.x, y - at.y);
      ms ??= Math.min(800, 220 + dist * 0.7);
      const arc = Math.min(36, dist * 0.08) * (x > at.x ? -1 : 1);
      const from = at;
      const started = Date.now();
      for (;;) {
        const t = Math.min(1, (Date.now() - started) / ms);
        const e = ease(t);
        await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e + Math.sin(Math.PI * t) * arc);
        if (t >= 1) break;
        await sleep(10);
      }
      at = { x, y };
    },
    async click(x, y, { hold = 90, before = 140 } = {}) {
      await self.move(x, y);
      await sleep(before);
      await page.mouse.down();
      await sleep(hold);
      await page.mouse.up();
    },
    async clickOn(locator, opts) {
      const { x, y } = await center(locator, opts);
      await self.click(x, y, opts);
    },
    async hoverOn(locator, opts) {
      const { x, y } = await center(locator, opts);
      await self.move(x, y, opts?.ms);
    },
    /** Press, lift past the drag threshold, glide to the target, settle, drop. */
    async drag(from, to, { ms = 1100, hover = 350 } = {}) {
      await self.move(from.x, from.y);
      await sleep(160);
      await page.mouse.down();
      await sleep(140);
      await self.move(from.x + 8, from.y + 6, 120);
      await self.move(to.x, to.y, ms);
      await sleep(hover);
      await page.mouse.up();
    },
  };
  return self;
}

async function center(locator, { dx = 0, dy = 0, fx = 0.5, fy = 0.5 } = {}) {
  const box = await locator.boundingBox();
  if (!box) throw new Error(`not visible: ${locator}`);
  return { x: box.x + box.width * fx + dx, y: box.y + box.height * fy + dy };
}

/** Center of a board card by its title. */
const card = (page, title) => page.locator("[data-task-id]").filter({ hasText: title }).first();
const dayHeading = (page, name) => page.getByText(name, { exact: true }).first();

/** y (viewport px) of a time of day on the calendar, interpolated from the hour labels. */
async function timeY(page, hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  const label = (hour) => {
    const h12 = ((hour + 11) % 12) + 1;
    const ampm = hour < 12 ? "am" : "pm";
    return new RegExp(`^${h12}\\s?${ampm}$`, "i");
  };
  const a = await center(page.getByText(label(h)).first());
  const b = await center(page.getByText(label(h + 1)).first());
  return a.y + (b.y - a.y) * (m / 60);
}

/** Scroll the calendar so `hour` sits at the top of the timeline. */
async function scrollCalendarTo(page, hour, { smooth = false } = {}) {
  const h12 = ((hour + 11) % 12) + 1;
  const ampm = hour < 12 ? "am" : "pm";
  await page.getByText(new RegExp(`^${h12}\\s?${ampm}$`, "i")).first().evaluate((el, smooth) => {
    let scroller = el.parentElement;
    while (scroller && !(scroller.scrollHeight > scroller.clientHeight + 4 && /auto|scroll/.test(getComputedStyle(scroller).overflowY))) {
      scroller = scroller.parentElement;
    }
    if (!scroller) return;
    const top = el.getBoundingClientRect().top - scroller.getBoundingClientRect().top + scroller.scrollTop;
    scroller.scrollTo({ top: top - 12, behavior: smooth ? "smooth" : "instant" });
  }, smooth);
  await sleep(smooth ? 900 : 400);
}

/** A chat-style chip showing which agent is driving and what it is doing. */
async function showAgentChip(page, { agent = "Claude", prompt, theme }) {
  await page.evaluate(
    ({ agent, prompt, dark }) => {
      document.getElementById("__agent_chip")?.remove();
      const chip = document.createElement("div");
      chip.id = "__agent_chip";
      const fg = dark ? "#f4f4f5" : "#18181b";
      const sub = dark ? "#a1a1aa" : "#71717a";
      Object.assign(chip.style, {
        position: "fixed", right: "24px", bottom: "24px", zIndex: "2147483646", pointerEvents: "none",
        width: "372px", padding: "14px 16px", borderRadius: "14px", fontFamily: "Geist, Inter, system-ui, sans-serif",
        background: dark ? "rgba(24,24,27,0.96)" : "rgba(255,255,255,0.97)",
        border: `1px solid ${dark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)"}`,
        boxShadow: dark ? "0 18px 40px -12px rgba(0,0,0,0.7)" : "0 18px 40px -14px rgba(0,0,0,0.28)",
        opacity: "0", transform: "translateY(12px)", transition: "opacity 320ms ease, transform 320ms ease",
      });
      chip.innerHTML = `
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <div style="width:22px;height:22px;border-radius:6px;background:#D97757;display:grid;place-items:center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><path d="M12 2l1.9 6.1L20 10l-6.1 1.9L12 18l-1.9-6.1L4 10l6.1-1.9z"/></svg>
          </div>
          <span style="font-size:13px;font-weight:600;color:${fg}">${agent}</span>
          <span style="font-size:12px;color:${sub}">· via Open Sunsama MCP</span>
        </div>
        <div id="__agent_prompt" style="font-size:14px;line-height:1.4;color:${fg};min-height:20px"></div>
        <div id="__agent_status" style="display:flex;align-items:center;gap:7px;margin-top:10px;font-size:12px;color:${sub};min-height:16px;white-space:nowrap;overflow:hidden;font-family:'Geist Mono',ui-monospace,monospace"></div>`;
      document.documentElement.appendChild(chip);
      requestAnimationFrame(() => { chip.style.opacity = "1"; chip.style.transform = "translateY(0)"; });
      const el = chip.querySelector("#__agent_prompt");
      let i = 0;
      const tick = () => { el.textContent = prompt.slice(0, ++i); if (i < prompt.length) setTimeout(tick, 28); };
      setTimeout(tick, 250);
    },
    { agent, prompt, dark: theme === "dark" }
  );
}

async function setAgentStatus(page, text, { done = false } = {}) {
  await page.evaluate(
    ({ text, done }) => {
      const el = document.getElementById("__agent_status");
      if (!el) return;
      const dot = done
        ? '<span style="width:8px;height:8px;border-radius:50%;background:#22c55e;display:inline-block"></span>'
        : '<span style="width:8px;height:8px;border-radius:50%;background:#f97316;display:inline-block;animation:__pulse 900ms ease-in-out infinite"></span>';
      if (!document.getElementById("__pulse_style")) {
        const style = document.createElement("style");
        style.id = "__pulse_style";
        style.textContent = "@keyframes __pulse{0%,100%{opacity:1}50%{opacity:.35}}";
        document.head.appendChild(style);
      }
      el.innerHTML = `${dot}<span>${text}</span>`;
    },
    { text, done }
  );
}

async function hideAgentChip(page) {
  await page.evaluate(() => {
    const chip = document.getElementById("__agent_chip");
    if (chip) { chip.style.opacity = "0"; chip.style.transform = "translateY(12px)"; }
  });
}

/** Closing card for the narrated videos. */
async function showEndCard(page, theme) {
  await page.evaluate((dark) => {
    const card = document.createElement("div");
    Object.assign(card.style, {
      position: "fixed", inset: "0", zIndex: "2147483645", display: "grid", placeItems: "center", pointerEvents: "none",
      background: dark ? "rgba(9,9,11,0.94)" : "rgba(255,255,255,0.95)", opacity: "0", transition: "opacity 600ms ease",
      fontFamily: "Geist, Inter, system-ui, sans-serif", color: dark ? "#fafafa" : "#18181b", textAlign: "center",
    });
    card.innerHTML = `<div>
      <div style="display:flex;align-items:center;justify-content:center;gap:14px;font-size:44px;font-weight:600;letter-spacing:-0.02em">
        <img src="/apple-touch-icon.png" onerror="this.remove()" style="width:52px;height:52px;border-radius:12px"/>Open Sunsama</div>
      <div style="margin-top:14px;font-size:22px;opacity:.7">Open source. Works with any AI agent.</div>
      <div style="margin-top:26px;font-size:24px;font-weight:600;color:#f97316">opensunsama.com</div></div>`;
    document.documentElement.appendChild(card);
    requestAnimationFrame(() => (card.style.opacity = "1"));
  }, theme === "dark");
}

// ---------------------------------------------------------------------------
// Output: hashing, manifest
// ---------------------------------------------------------------------------

const hash8 = (file) => createHash("sha256").update(readFileSync(file)).digest("hex").slice(0, 8);

/** Move `tmp` to blog-media/<base>.<hash>.<ext>, deleting older hashes of the same base. Returns the public URL. */
function publish(tmp, base) {
  const ext = path.extname(tmp).slice(1);
  const name = `${base}.${hash8(tmp)}.${ext}`;
  const stale = new RegExp(`^${base.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.[0-9a-f]{8}\\.${ext}$`);
  for (const file of readdirSync(OUT)) if (stale.test(file) && file !== name) rmSync(path.join(OUT, file));
  renameSync(tmp, path.join(OUT, name));
  return `/blog-media/${name}`;
}

const manifest = (() => {
  const empty = { shots: {}, clips: {}, videos: {} };
  if (!existsSync(MANIFEST)) return empty;
  const data = JSON.parse(readFileSync(MANIFEST, "utf8"));
  // Keep only entries whose files this recorder produced and that still exist.
  const real = (url) => typeof url === "string" && url.startsWith("/blog-media/") && existsSync(path.join(ROOT, "apps/web/public", url));
  const out = { shots: {}, clips: {}, videos: {} };
  for (const [id, s] of Object.entries(data.shots ?? {})) if (real(s.light) && real(s.dark)) out.shots[id] = s;
  for (const [id, c] of Object.entries(data.clips ?? {})) if (real(c.light?.mp4) && real(c.dark?.mp4)) out.clips[id] = c;
  for (const [id, v] of Object.entries(data.videos ?? {})) if (real(v.mp4)) out.videos[id] = v;
  return out;
})();

function saveManifest() {
  const sort = (obj) => Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
  writeFileSync(
    MANIFEST,
    `${JSON.stringify({ shots: sort(manifest.shots), clips: sort(manifest.clips), videos: sort(manifest.videos) }, null, 2)}\n`
  );
}

const ffmpeg = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: ["ignore", "inherit", "inherit"] });
const probeDuration = (file) =>
  Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", file], { encoding: "utf8" }).trim());
const kb = (file) => Math.round(statSync(file).size / 1024);

/** Encode a WebP no wider than maxWidth, lowering quality until it fits the byte budget. */
async function webp(input, file, { maxWidth = 1600, budgetKB = 120, quality = 80, pre } = {}) {
  let image = sharp(input);
  if (pre) image = await pre(image);
  const meta = await sharp(await image.clone().toBuffer()).metadata();
  const width = Math.min(maxWidth, meta.width);
  let buf;
  for (let q = quality; q >= 50; q -= 6) {
    buf = await image.clone().resize({ width, kernel: "lanczos3" }).webp({ quality: q, effort: 6, smartSubsample: true }).toBuffer();
    if (buf.length / 1024 <= budgetKB) break;
  }
  writeFileSync(file, buf);
  const out = await sharp(buf).metadata();
  return { width: out.width, height: out.height, kb: Math.round(buf.length / 1024) };
}

// ---------------------------------------------------------------------------
// Shots
// ---------------------------------------------------------------------------

/** Screenshot a dialog plus some of the dimmed page around it, so it reads at blog width. */
async function aroundClip(page, locator, margin = { x: 120, y: 90 }) {
  const box = await locator.boundingBox();
  const vp = page.viewportSize();
  const x = Math.max(0, box.x - margin.x);
  const y = Math.max(0, box.y - margin.y);
  return { x, y, width: Math.min(vp.width - x, box.width + margin.x * 2), height: Math.min(vp.height - y, box.height + margin.y * 2) };
}

/** Trim the empty page around a centered card, then add even breathing room in the page color. */
async function trimToCard(image) {
  const buf = await image.toBuffer();
  const { data } = await sharp(buf).extract({ left: 2, top: 2, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  const background = { r: data[0], g: data[1], b: data[2], alpha: 1 };
  const trimmed = await sharp(buf).trim({ threshold: 12 }).toBuffer();
  return sharp(trimmed).extend({ top: 96, bottom: 96, left: 96, right: 96, background });
}

const SHOTS = {
  board: async (page) => {
    await go(page, "/app/board", 2000);
    await scrollCalendarTo(page, 8);
  },
  "calendar-week": async (page) => {
    await go(page, "/app/calendar");
    await page.getByRole("tab", { name: "Week", exact: true }).click();
    await settle(page, 1200);
    await scrollCalendarTo(page, 8);
  },
  "calendar-day": async (page) => {
    await go(page, "/app/calendar");
    await page.getByRole("tab", { name: "Day", exact: true }).click();
    await settle(page, 1000);
    await scrollCalendarTo(page, 8);
  },
  "task-detail": async (page) => {
    await go(page, "/app/board", 1800);
    await page.getByText("Finalize Q4 roadmap for leadership review").first().click();
    await settle(page, 1200);
    return { clip: await aroundClip(page, page.getByRole("dialog").first()) };
  },
  focus: async (page) => {
    const roadmap = await taskByTitle("Finalize Q4 roadmap");
    await api("PATCH", `/tasks/${roadmap.id}`, { actualMins: 42 });
    await go(page, `/app/focus/${roadmap.id}`, 1800);
    return { clip: { x: 300, y: 0, width: 840, height: 700 } };
  },
  "command-palette": async (page) => {
    await go(page, "/app/board", 1800);
    await page.keyboard.press("Meta+k");
    await sleep(500);
    await page.keyboard.type("review", { delay: 60 });
    await sleep(1000);
    return { clip: await aroundClip(page, page.getByRole("dialog").first(), { x: 160, y: 70 }) };
  },
  ideas: async (page) => {
    await go(page, "/app/ideas", 1800);
  },
  "mcp-settings": async (page) => {
    await page.setViewportSize({ width: 1180, height: 1000 });
    await go(page, "/app/settings?tab=mcp", 1800);
    return { clip: { x: 0, y: 0, width: 800, height: 900 } };
  },
};

async function captureShots() {
  const ids = [...Object.keys(SHOTS), "consent-claude", "consent-chatgpt", "mobile-tasks"].filter((id) => want("shots", id));
  if (!ids.length) return;
  seed();
  await ensureConnectedApps();
  const results = {};
  for (const theme of THEMES) {
    const { context, page } = await newPage({ theme });
    for (const id of ids.filter((id) => SHOTS[id])) {
      await page.setViewportSize({ width: 1440, height: 900 });
      const opts = (await SHOTS[id](page)) ?? {};
      const png = await page.screenshot(opts.clip ? { clip: opts.clip } : {});
      const tmp = path.join(RAW, `${id}-${theme}.webp`);
      (results[id] ??= {})[theme] = { tmp, ...(await webp(png, tmp)) };
      console.log("shot", id, theme, results[id][theme].kb, "KB");
    }
    await context.close();

    for (const [id, client] of [["consent-claude", CLAUDE], ["consent-chatgpt", CHATGPT]]) {
      if (!ids.includes(id)) continue;
      const { context, page } = await newPage({ theme, width: 560, height: 760 });
      await page.goto(authorizeUrl(...client));
      await settle(page, 1500);
      const tmp = path.join(RAW, `${id}-${theme}.webp`);
      (results[id] ??= {})[theme] = { tmp, ...(await webp(await page.screenshot(), tmp, { pre: trimToCard })) };
      console.log("shot", id, theme, results[id][theme].kb, "KB");
      await context.close();
    }

    if (ids.includes("mobile-tasks")) {
      const { context, page } = await newPage({ theme, width: 390, height: 844, scale: 2, mobile: true });
      await go(page, "/app/tasks", 2000);
      const tmp = path.join(RAW, `mobile-tasks-${theme}.webp`);
      (results["mobile-tasks"] ??= {})[theme] = { tmp, ...(await webp(await page.screenshot(), tmp)) };
      console.log("shot mobile-tasks", theme, results["mobile-tasks"][theme].kb, "KB");
      await context.close();
    }
  }
  for (const [id, byTheme] of Object.entries(results)) {
    const entry = { width: byTheme.light?.width ?? byTheme.dark.width, height: byTheme.light?.height ?? byTheme.dark.height };
    for (const theme of THEMES) entry[theme] = publish(byTheme[theme].tmp, `${id}-${theme}`);
    manifest.shots[id] = { ...manifest.shots[id], ...entry };
  }
  saveManifest();
}

// ---------------------------------------------------------------------------
// Scenes: each drives the app like a person would. Clips and videos share them.
// ---------------------------------------------------------------------------

/** A keycap hint for keyboard shortcuts, since viewers can't see keys being pressed. */
async function showKeys(page, keys, theme, ms = 1400) {
  await page.evaluate(
    ({ keys, dark, ms }) => {
      const el = document.createElement("div");
      Object.assign(el.style, {
        position: "fixed", left: "50%", bottom: "36px", transform: "translateX(-50%) translateY(8px)", zIndex: "2147483646",
        display: "flex", gap: "6px", pointerEvents: "none", opacity: "0", transition: "opacity 200ms ease, transform 200ms ease",
      });
      for (const key of keys) {
        const cap = document.createElement("span");
        cap.textContent = key;
        Object.assign(cap.style, {
          minWidth: "34px", padding: "6px 10px", borderRadius: "8px", textAlign: "center",
          font: "600 17px Geist, Inter, system-ui, sans-serif",
          background: dark ? "rgba(39,39,42,0.96)" : "rgba(255,255,255,0.98)", color: dark ? "#fafafa" : "#18181b",
          border: `1px solid ${dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.12)"}`,
          boxShadow: dark ? "0 6px 18px -6px rgba(0,0,0,.8)" : "0 6px 18px -8px rgba(0,0,0,.35)",
        });
        el.appendChild(cap);
      }
      document.documentElement.appendChild(el);
      requestAnimationFrame(() => { el.style.opacity = "1"; el.style.transform = "translateX(-50%)"; });
      setTimeout(() => { el.style.opacity = "0"; setTimeout(() => el.remove(), 300); }, ms);
    },
    { keys, dark: theme === "dark", ms }
  );
}

/** Top edge of a board card, where a dropped card lands above it. */
async function aboveCard(page, title) {
  const box = await card(page, title).boundingBox();
  return { x: box.x + box.width / 2, y: box.y + 18 };
}

const SCENES = {
  /** Board overview: the eye moves across today, tomorrow and the calendar. */
  async boardTour({ page, mouse }) {
    await mouse.hoverOn(card(page, "Finalize Q4 roadmap"), { fx: 0.6, fy: 0.75, ms: 1000 });
    await sleep(1000);
    await mouse.hoverOn(page.getByText("Customer call: Acme onboarding feedback").first(), { dy: 14, ms: 900 });
    await sleep(900);
    await mouse.hoverOn(page.getByText("Deep work: Q4 roadmap").first(), { ms: 1000 });
    await sleep(900);
  },

  /** Pull tasks from the backlog and tomorrow into Today. */
  async planDay({ page, mouse }, { count = 3 } = {}) {
    await sleep(250);
    await mouse.drag(await center(page.getByText("Plan the team offsite agenda").first()), await aboveCard(page, "Finalize Q4 roadmap"), { ms: 1200 });
    await sleep(550);
    await mouse.drag(await center(page.getByText("Customer call: Acme onboarding feedback").first()), await aboveCard(page, "1:1 with Priya"), { ms: 1100 });
    await sleep(550);
    if (count > 2) {
      await mouse.drag(await center(page.getByText("Research AI meeting note-takers").first()), await aboveCard(page, "1:1 with Priya"), { ms: 1100 });
      await sleep(500);
    }
  },

  /** Drag an unscheduled task onto the day's timeline, then stretch the block. */
  async timeBlock({ page, mouse }) {
    await sleep(400);
    const task = page.getByText("Write hiring plan for 2 senior engineers").first();
    const from = await center(task);
    const timeline = await page.getByText("Lunch", { exact: true }).first().boundingBox();
    await mouse.drag(from, { x: timeline.x + 220, y: (await timeY(page, "14:00")) + 3 }, { ms: 1200 });
    await sleep(900);
    const handles = page.locator("[data-resize='bottom']");
    // The new block is the one whose top sits at 2 PM.
    const y2 = await timeY(page, "15:00");
    let handle = null;
    for (let i = 0; i < (await handles.count()); i++) {
      const box = await handles.nth(i).boundingBox();
      if (box && Math.abs(box.y + box.height / 2 - y2) < 10) handle = box;
    }
    if (!handle) throw new Error("new block's resize handle not found");
    await mouse.drag({ x: handle.x + handle.width / 2, y: handle.y + handle.height / 2 }, { x: handle.x + handle.width / 2, y: (await timeY(page, "15:30")) - 2 }, { ms: 800, hover: 250 });
    await sleep(1000);
  },

  /** Open a task, expand it into focus mode, start the timer, tick a step. */
  async focus({ page, mouse, theme }) {
    await sleep(300);
    await mouse.clickOn(page.getByText("Finalize Q4 roadmap for leadership review").first());
    await page.getByRole("dialog").first().waitFor();
    await sleep(900);
    await mouse.clickOn(page.locator("button[title='Focus mode (F)']").first());
    await page.getByRole("button", { name: /Start/ }).first().waitFor();
    await sleep(900);
    await mouse.clickOn(page.getByRole("button", { name: /Start/ }).first());
    await sleep(1500);
    await mouse.clickOn(page.getByText("Draft the one-page narrative").first(), { fx: 0, dx: -17 });
    await sleep(1200);
  },

  /** Cmd+K, type, jump to a result. */
  async commandPalette({ page, mouse, theme }, { query = "offsite" } = {}) {
    await mouse.move(mouse.at.x - 60, mouse.at.y + 20, 500);
    await sleep(300);
    await showKeys(page, ["⌘", "K"], theme);
    await page.keyboard.press("Meta+k");
    await sleep(700);
    await page.keyboard.type(query, { delay: 45 });
    await sleep(900);
    await page.keyboard.press("ArrowDown");
    await sleep(350);
    await page.keyboard.press("ArrowUp");
    await sleep(500);
    await showKeys(page, ["↵"], theme, 900);
    await page.keyboard.press("Enter");
    await sleep(1800);
  },

  /** Someone asks their agent (in Claude) to plan the afternoon; the chip shows the prompt. */
  async agentAsk({ page, theme }) {
    await showAgentChip(page, { prompt: "Plan my afternoon around the launch review", theme });
    await sleep(2100);
  },

  /** The agent works over MCP: real tools/call requests; the calendar updates through live sync. */
  async agentAct({ page }, { pace = 1 } = {}) {
    const wait = (ms) => sleep(ms * pace);
    await setAgentStatus(page, "get_schedule_for_day");
    await callTool("get_schedule_for_day", { date: TODAY });
    await wait(900);
    const pr = await taskByTitle("Review PR #482");
    const investor = await taskByTitle("Reply to investor update");
    await setAgentStatus(page, "create_task · Prep launch review deck");
    const prep = idFrom(await callTool("create_task", { title: "Prep launch review deck", scheduledDate: TODAY, estimatedMins: 45, priority: "P0" }));
    await wait(800);
    const blocks = [
      { title: "Prep: launch review deck", startTime: "13:00", endTime: "13:45", taskId: prep, color: "#F59E0B" },
      { title: "Launch review", startTime: "14:00", endTime: "15:00", color: "#EF4444" },
      { title: "PR review: onboarding redesign", startTime: "15:15", endTime: "16:00", taskId: pr.id, color: "#3B82F6" },
      { title: "Investor update reply", startTime: "16:15", endTime: "16:45", taskId: investor.id, color: "#8B5CF6" },
    ];
    for (const block of blocks) {
      const [h, m] = block.startTime.split(":").map(Number);
      const label = `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
      await setAgentStatus(page, `create_time_block · ${block.title.split(":")[0]}, ${label}`);
      await callTool("create_time_block", { date: TODAY, ...block });
      await wait(950);
    }
    await setAgentStatus(page, "Done: 1 task, 4 time blocks this afternoon", { done: true });
    await wait(1500);
  },

  async aiPlan(ctx, opts) {
    await SCENES.agentAsk(ctx);
    await SCENES.agentAct(ctx, opts);
  },

  /** Ideas board: park a someday idea in another column. */
  async ideas({ page, mouse }) {
    await sleep(300);
    await mouse.hoverOn(page.getByText("Voice capture on mobile").first(), { ms: 700 });
    await sleep(400);
    const target = await center(page.getByText("Auto-schedule P0s into open calendar slots").first());
    await mouse.drag(await center(page.getByText("Slack message → task capture").first()), { x: target.x, y: target.y + 70 }, { ms: 1100 });
    await sleep(900);
  },

  /** Settings → MCP: the connector URL and the copy button. */
  async settingsMcp({ page, mouse }) {
    await sleep(300);
    await mouse.clickOn(page.getByText("MCP", { exact: true }).first());
    await page.getByText("Connector URL").first().waitFor();
    await sleep(900);
    await mouse.hoverOn(page.getByText(PUBLIC_MCP_URL).first(), { ms: 700 });
    await sleep(500);
    await mouse.clickOn(page.getByRole("button", { name: /^Copy/ }).first());
    await sleep(900);
  },

  /** The consent screen an agent opens: what it may do, and Allow access. */
  async consent({ page, mouse }) {
    await sleep(500);
    await mouse.hoverOn(page.getByText("Tasks and subtasks").first(), { ms: 900 });
    await sleep(700);
    await mouse.hoverOn(page.getByText("Calendar time blocks").first(), { ms: 500 });
    await sleep(700);
    await mouse.hoverOn(page.getByRole("button", { name: "Allow access" }).first(), { ms: 800 });
    await sleep(1200);
  },

  /** After the agent: nudge one of its blocks by hand. */
  async inCharge({ page, mouse }) {
    await hideAgentChip(page);
    await sleep(400);
    const title = page.getByText("Investor update reply", { exact: true }).first();
    const from = await center(title);
    const shift = (await timeY(page, "16:45")) - (await timeY(page, "16:15"));
    await mouse.drag(from, { x: from.x + 40, y: from.y + shift }, { ms: 1000 });
    await sleep(900);
  },

  /** End of day: tick off what got done. */
  async shutdown({ page, mouse, count = 4 }) {
    await sleep(400);
    for (const title of ["Finalize Q4 roadmap", "1:1 with Priya", "Review PR #482", "Reply to investor update"].slice(0, count)) {
      const box = await card(page, title).boundingBox();
      await mouse.click(box.x + 20, box.y + 22);
      await sleep(750);
    }
    await sleep(900);
  },

  /**
   * Plan next week on the board: step ahead to Monday, then move tasks across days.
   * (The calendar's week view only moves external events, so the board is where tasks change days.)
   */
  async weekPlan({ page, mouse }) {
    await sleep(150);
    const next = page.locator("button[title='Next day']").first();
    await mouse.hoverOn(next);
    for (let i = 0; i < 4; i++) {
      await mouse.click(mouse.at.x, mouse.at.y, { before: 40, hold: 70 });
      await sleep(240);
    }
    await page.getByText("Book the team offsite venue").first().waitFor();
    await sleep(500);
    await mouse.drag(await center(page.getByText("Book the team offsite venue").first()), await aboveCard(page, "Sprint retro and demo day"), { ms: 1000 });
    await sleep(550);
    await mouse.drag(await center(page.getByText("Weekly review: plan next week").first()), await aboveCard(page, "Board deck: product section"), { ms: 1000 });
    await sleep(500);
  },
};

// ---------------------------------------------------------------------------
// Clips: short silent loops, light + dark
// ---------------------------------------------------------------------------

const CLIPS = {
  "plan-day": {
    route: "/app/board", backlog: true, poster: 0.72,
    run: (ctx) => SCENES.planDay(ctx),
  },
  "time-block": {
    setup: async () => api("DELETE", `/time-blocks/${(await blocksOn(TODAY)).find((b) => b.title === "Hiring plan").id}`),
    route: "/app/calendar", view: "Day", scrollTo: 10, poster: 0.8,
    run: (ctx) => SCENES.timeBlock(ctx),
  },
  focus: {
    setup: async () => api("PATCH", `/tasks/${(await taskByTitle("Finalize Q4 roadmap")).id}`, { actualMins: 42 }),
    route: "/app/board", poster: 0.75,
    run: (ctx) => SCENES.focus(ctx),
  },
  "command-palette": {
    route: "/app/board", poster: 0.5,
    run: (ctx) => SCENES.commandPalette(ctx),
  },
  "ai-plan": {
    setup: async () => { await ensureConnectedApps(); await clearBlocksFrom("13:00"); },
    route: "/app/calendar", view: "Day", scrollTo: 10, poster: 0.9, cursor: false,
    run: (ctx) => SCENES.aiPlan(ctx),
  },
  shutdown: {
    route: "/app/board", now: END_OF_DAY, poster: 0.85,
    run: (ctx) => SCENES.shutdown(ctx),
  },
  "week-plan": {
    route: "/app/board", poster: 0.85,
    run: (ctx) => SCENES.weekPlan(ctx),
  },
  ideas: {
    route: "/app/ideas", poster: 0.8,
    run: async (ctx) => {
      await SCENES.ideas(ctx);
      await ctx.mouse.hoverOn(ctx.page.getByText("Habit streaks for recurring tasks").first(), { ms: 900 });
      await sleep(1600);
    },
  },
};


/** Prepare a page at the clip's start state; returns once it is on screen and still. */
async function openAt(page, spec) {
  await go(page, spec.route, 1800);
  if (spec.view) {
    await page.getByRole("tab", { name: spec.view, exact: true }).click();
    await settle(page, 900);
  }
  if (spec.scrollTo) await scrollCalendarTo(page, spec.scrollTo);
}

async function recordClip(id, theme) {
  const spec = CLIPS[id];
  seed();
  claudeToken = null;
  if (spec.setup) await spec.setup();
  const dir = path.join(RAW, `clip-${id}-${theme}`);
  rmSync(dir, { recursive: true, force: true });
  const { context, page } = await newPage({ theme, width: 1280, height: 800, scale: 1, video: dir, now: spec.now ?? NOW, backlog: !!spec.backlog, cursor: spec.cursor ?? true });
  const t0 = Date.now();
  const mouse = humanMouse(page);
  await openAt(page, spec);
  if (spec.cursor !== false) await mouse.place(mouse.at.x, mouse.at.y);
  await sleep(300);
  const start = (Date.now() - t0) / 1000;
  try {
    await spec.run({ page, mouse, theme });
  } catch (error) {
    await page.screenshot({ path: path.join(RAW, `debug-${id}-${theme}.png`) });
    throw error;
  }
  const end = (Date.now() - t0) / 1000 + 0.2;
  await sleep(400);
  const video = page.video();
  await context.close();
  const raw = path.join(dir, "raw.webm");
  renameSync(await video.path(), raw);
  return { raw, start, end };
}

/** Trim and encode small; dip to the page color at both ends so the loop point is invisible. */
async function encodeClip(id, theme, { raw, start, end }) {
  const D = end - start;
  const probe = path.join(RAW, `${id}-${theme}-bg.png`);
  ffmpeg(["-ss", (start + 0.2).toFixed(2), "-i", raw, "-frames:v", "1", probe]);
  const { data } = await sharp(probe).extract({ left: 640, top: 796, width: 1, height: 1 }).raw().toBuffer({ resolveWithObject: true });
  const color = `0x${[...data.subarray(0, 3)].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  const mp4 = path.join(RAW, `${id}-${theme}.mp4`);
  for (let crf = 27; ; crf += 2) {
    ffmpeg([
      "-ss", start.toFixed(3), "-t", D.toFixed(3), "-i", raw,
      "-vf", `fps=25,scale=1280:800:flags=lanczos,setsar=1,fade=t=in:st=0:d=0.35:color=${color},fade=t=out:st=${(D - 0.45).toFixed(3)}:d=0.45:color=${color},format=yuv420p`,
      "-an", "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-tune", "animation",
      "-movflags", "+faststart", mp4,
    ]);
    if (kb(mp4) <= 700 || crf >= 33) break;
  }
  const duration = probeDuration(mp4);
  const frame = path.join(RAW, `${id}-${theme}-poster.png`);
  ffmpeg(["-ss", (duration * CLIPS[id].poster).toFixed(2), "-i", mp4, "-frames:v", "1", frame]);
  const posterTmp = path.join(RAW, `${id}-poster-${theme}.webp`);
  await webp(frame, posterTmp, { maxWidth: 1280, budgetKB: 60, quality: 78 });
  console.log("clip", id, theme, `${duration.toFixed(1)}s`, kb(mp4), "KB, poster", kb(posterTmp), "KB");
  return { mp4, posterTmp, duration };
}

async function captureClips() {
  for (const id of Object.keys(CLIPS).filter((id) => want("clips", id))) {
    const entry = { width: 1280, height: 800, duration: 0 };
    for (const theme of THEMES) {
      const out = await encodeClip(id, theme, await recordClip(id, theme));
      entry[theme] = { mp4: publish(out.mp4, `${id}-${theme}`), poster: publish(out.posterTmp, `${id}-poster-${theme}`) };
      entry.duration = Math.max(entry.duration, Math.round(out.duration * 10) / 10);
    }
    manifest.clips[id] = { ...manifest.clips[id], ...entry };
    saveManifest();
  }
}

// ---------------------------------------------------------------------------
// Narrated videos
// ---------------------------------------------------------------------------

/** Each line is one voiceover clip (VO_DIR/<id>/voN.mp3); captions use this text verbatim. */
const VIDEOS = {
  tour: {
    title: "Plan your whole day in one place with Open Sunsama",
    description:
      "A one-minute tour of Open Sunsama, the open source daily planner: pull tasks into today on the board, time block them on the calendar, work in focus mode, find anything with Command K, and let an AI agent like Claude plan your afternoon over MCP.",
    scenes: [
      { line: "This is Open Sunsama, an open source planner for your whole day. Your tasks, your calendar, and your AI agent all live in one place.",
        prepare: async (page) => { await go(page, "/app/board", 1800); await scrollCalendarTo(page, 8); },
        run: (ctx) => SCENES.boardTour(ctx) },
      { line: "Start the morning on the board. Drag a few tasks from your backlog into Today. Each card shows how long it will take, so you can see if your day fits.",
        run: (ctx) => SCENES.planDay(ctx, { count: 2 }) },
      { line: "Next, give your work a time. Drag a task onto the calendar, then stretch the block to fit.",
        prepare: async (page) => {
          await api("DELETE", `/time-blocks/${(await blocksOn(TODAY)).find((b) => b.title === "Hiring plan").id}`);
          await go(page, "/app/calendar", 1500);
          await page.getByRole("tab", { name: "Day", exact: true }).click();
          await settle(page, 900);
          await scrollCalendarTo(page, 10);
        },
        run: (ctx) => SCENES.timeBlock(ctx) },
      { line: "When it is time to work, open focus mode. Start the timer, and check off each step as you go.",
        prepare: async (page) => { await go(page, "/app/board", 1500); },
        run: (ctx) => SCENES.focus(ctx) },
      { line: "Need something fast? Press Command K, type a few letters, and jump right to it.",
        prepare: async (page) => { await go(page, "/app/board", 1500); },
        run: (ctx) => SCENES.commandPalette(ctx) },
      { line: "Big ideas that are not for today go on your ideas board, so your day stays clear.",
        prepare: async (page) => { await go(page, "/app/ideas", 1500); },
        run: (ctx) => SCENES.ideas(ctx) },
      { line: "Open Sunsama works with any AI agent. Ask Claude to plan your afternoon, and new tasks and time blocks show up in the app right away.",
        prepare: async (page, mouse) => {
          await clearBlocksFrom("13:00");
          await go(page, "/app/calendar", 1500);
          await page.getByRole("tab", { name: "Day", exact: true }).click();
          await settle(page, 900);
          await scrollCalendarTo(page, 10);
          await mouse.place(150, 860);
        },
        run: (ctx) => SCENES.aiPlan(ctx, { pace: 0.8 }) },
      { line: "At the end of the day, check off what you finished. Open Sunsama is open source. Try it at opensunsama.com.",
        prepare: async (page) => { await page.clock.setSystemTime(END_OF_DAY); await go(page, "/app/board", 1500); },
        run: async (ctx) => { await SCENES.shutdown({ ...ctx, count: 3 }); await showEndCard(ctx.page, ctx.theme); },
        hold: 2.6 },
    ],
  },
  ai: {
    title: "Let Claude or ChatGPT plan your day with Open Sunsama",
    description:
      "Connect Claude, ChatGPT, Cursor or any MCP client to Open Sunsama, the open source daily planner. Add the connector URL, sign in once and allow access, then ask your agent to plan your afternoon and watch tasks and time blocks appear live.",
    // Poster: the agent's plan landing on the calendar.
    posterScene: 4,
    posterOffset: 6.5,
    scenes: [
      { line: "Open Sunsama works with any AI agent. Claude, ChatGPT, Cursor, and more can plan your day with you.",
        prepare: async (page) => { await go(page, "/app/board", 1800); await scrollCalendarTo(page, 8); },
        run: (ctx) => SCENES.boardTour(ctx) },
      { line: "In Settings, open the MCP tab. Copy the connector URL.",
        prepare: async (page) => { await go(page, "/app/settings", 1500); },
        run: (ctx) => SCENES.settingsMcp(ctx) },
      { line: "Paste it into Claude or ChatGPT as a new connector. Sign in once, then choose Allow access. There is no API key to paste.",
        prepare: async (page) => { await page.goto(authorizeUrl(...CLAUDE)); await settle(page, 1500); },
        // The consent card is small on a wide screen; frame it the way a camera would.
        zoom: (page) => page.getByText("Claude wants to access your Open Sunsama account").first(),
        run: (ctx) => SCENES.consent(ctx) },
      { line: "Now just ask. Plan my afternoon around the launch review.",
        prepare: async (page, mouse) => {
          await clearBlocksFrom("13:00");
          await go(page, "/app/calendar", 1500);
          await page.getByRole("tab", { name: "Day", exact: true }).click();
          await settle(page, 900);
          await scrollCalendarTo(page, 10);
          await mouse.place(150, 860);
        },
        run: (ctx) => SCENES.agentAsk(ctx) },
      { line: "The agent reads your day first. Then it adds tasks and time blocks, and they appear in the app as it works.",
        run: (ctx) => SCENES.agentAct(ctx, { pace: 0.75 }) },
      { line: "You stay in charge. Move or change anything you like. And since Open Sunsama is open source, you can see exactly what your agent is allowed to do.",
        run: async (ctx) => { await SCENES.inCharge(ctx); await sleep(1200); await showEndCard(ctx.page, ctx.theme); },
        hold: 2.4 },
    ],
  },
};

const VIDEO_W = 1600;
const VIDEO_H = 900;
const SCENE_GAP = 0.9; // seconds of footage after each line, before the next scene
const VO_LEAD = 0.35; // narration starts this long into its scene

async function recordVideo(id) {
  const spec = VIDEOS[id];
  const vo = spec.scenes.map((_, i) => path.join(VO_DIR, id, `vo${i + 1}.mp3`));
  for (const file of vo) if (!existsSync(file)) throw new Error(`missing narration ${file}`);
  const voDur = vo.map(probeDuration);

  seed();
  claudeToken = null;
  await ensureConnectedApps();
  const dir = path.join(RAW, `video-${id}`);
  rmSync(dir, { recursive: true, force: true });
  const theme = "light";
  const { context, page } = await newPage({ theme, width: VIDEO_W, height: VIDEO_H, scale: 1, video: dir, backlog: true });
  const t0 = Date.now();
  const mouse = humanMouse(page);
  const cuts = [];
  for (const [i, scene] of spec.scenes.entries()) {
    if (scene.prepare) await scene.prepare(page, mouse);
    if (mouse.at && i === 0) await mouse.place(mouse.at.x, mouse.at.y);
    let crop = null;
    if (scene.zoom) {
      // A 16:9 window at 1.3x zoom with the element a third of the way down, clear of the captions.
      const box = await scene.zoom(page).boundingBox();
      const w = Math.round(VIDEO_W / 1.3), h = Math.round(VIDEO_H / 1.3);
      const x = Math.max(0, Math.min(VIDEO_W - w, box.x + box.width / 2 - w / 2));
      const y = Math.max(0, Math.min(VIDEO_H - h, box.y + box.height / 2 - h * 0.3));
      crop = { w, h, x: Math.round(x), y: Math.round(y) };
    }
    await sleep(250);
    const start = (Date.now() - t0) / 1000;
    try {
      await scene.run({ page, mouse, theme });
    } catch (error) {
      await page.screenshot({ path: path.join(RAW, `debug-${id}-${i + 1}.png`) });
      throw error;
    }
    const minEnd = start + VO_LEAD + voDur[i] + (scene.hold ?? SCENE_GAP);
    const now = (Date.now() - t0) / 1000;
    if (now < minEnd) await sleep((minEnd - now) * 1000);
    cuts.push({ start, end: (Date.now() - t0) / 1000, crop });
    console.log(`  scene ${i + 1}: ${(cuts[i].end - cuts[i].start).toFixed(1)}s (voice ${voDur[i].toFixed(1)}s)`);
  }
  const video = page.video();
  await context.close();
  const raw = path.join(dir, "raw.webm");
  renameSync(await video.path(), raw);
  return { raw, cuts, vo, voDur };
}

async function produceVideo(id, { raw, cuts, vo }) {
  const spec = VIDEOS[id];
  const work = path.join(RAW, `video-${id}`);
  // 1. Cut each scene out of the raw recording and join them.
  const list = [];
  for (const [i, cut] of cuts.entries()) {
    const seg = path.join(work, `seg${String(i + 1).padStart(2, "0")}.mp4`);
    ffmpeg(["-ss", cut.start.toFixed(3), "-t", (cut.end - cut.start).toFixed(3), "-i", raw, "-an",
      "-vf", `fps=25,${cut.crop ? `crop=${cut.crop.w}:${cut.crop.h}:${cut.crop.x}:${cut.crop.y},` : ""}scale=1920:1080:flags=lanczos,setsar=1,format=yuv420p`,
      "-c:v", "libx264", "-preset", "fast", "-crf", "14", seg]);
    list.push(`file '${seg}'`);
  }
  writeFileSync(path.join(work, "list.txt"), `${list.join("\n")}\n`);
  const base = path.join(work, "base.mp4");
  ffmpeg(["-f", "concat", "-safe", "0", "-i", path.join(work, "list.txt"), "-c", "copy", base]);
  const segDur = list.map((line) => probeDuration(line.slice(6, -1)));
  const total = probeDuration(base);

  // 2. Captions: words from the script, timing from the voice (record-demo-video's captions.py).
  let offset = 0;
  const delays = segDur.map((d) => { const at = Math.round((offset + VO_LEAD) * 1000); offset += d; return at; });
  writeFileSync(path.join(work, "script.txt"), `${spec.scenes.map((s) => s.line).join("\n")}\n`);
  writeFileSync(path.join(work, "delays.txt"), delays.join(" "));
  const captions = path.join(work, "captions");
  rmSync(captions, { recursive: true, force: true });
  execFileSync(PYTHON, [CAPTIONS_PY, "--script", path.join(work, "script.txt"), "--timings", path.join(VO_DIR, id, "timings"),
    "--delays", path.join(work, "delays.txt"), "--duration", String(total), "--font", CAPTION_FONT,
    "--size", "1920x1080", "--font-px", "30", "--bottom", "118", "--out", captions], { stdio: "inherit" });

  // 3. Mix: video + caption overlay + narration, fade in/out, small enough for the web.
  const mp4 = path.join(RAW, `${id}.mp4`);
  const inputs = vo.flatMap((file) => ["-i", file]);
  const audio = vo.map((_, i) => `[${i + 2}:a]adelay=${delays[i]}|${delays[i]}[a${i}]`).join(";");
  const mix = `${vo.map((_, i) => `[a${i}]`).join("")}amix=inputs=${vo.length}:normalize=0,apad,afade=t=out:st=${(total - 0.6).toFixed(2)}:d=0.6[a]`;
  for (let crf = 21; ; crf += 2) {
    ffmpeg(["-i", base, "-f", "concat", "-safe", "0", "-i", path.join(captions, "overlay.ffconcat"), ...inputs,
      "-filter_complex",
      `[1:v]fps=25,format=rgba[c];[0:v][c]overlay=0:0:eof_action=pass:format=auto,fade=t=in:st=0:d=0.4,fade=t=out:st=${(total - 0.6).toFixed(2)}:d=0.6,format=yuv420p[v];${audio};${mix}`,
      "-map", "[v]", "-map", "[a]", "-t", total.toFixed(3), "-c:v", "libx264", "-preset", "slow", "-crf", String(crf), "-tune", "animation",
      "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-movflags", "+faststart", mp4]);
    if (kb(mp4) <= 8000 || crf >= 29) break;
  }

  // 4. WebVTT for the <track>, and a poster from the board scene.
  const srt = readFileSync(path.join(captions, "captions.srt"), "utf8");
  const vtt = path.join(RAW, `${id}.vtt`);
  writeFileSync(vtt, `WEBVTT\n\n${srt.replace(/\r/g, "").replace(/(\d\d:\d\d:\d\d),(\d\d\d)/g, "$1.$2")}`);
  const frame = path.join(work, "poster.png");
  const posterAt = segDur.slice(0, spec.posterScene ?? 1).reduce((a, b) => a + b, 0) + (spec.posterOffset ?? 3);
  ffmpeg(["-ss", posterAt.toFixed(2), "-i", base, "-frames:v", "1", frame]);
  const posterTmp = path.join(RAW, `${id}-poster.webp`);
  await webp(frame, posterTmp, { maxWidth: 1920, budgetKB: 120, quality: 80 });
  const duration = Math.round(probeDuration(mp4) * 10) / 10;
  console.log("video", id, `${duration}s`, kb(mp4), "KB");
  manifest.videos[id] = {
    width: 1920, height: 1080, duration,
    mp4: publish(mp4, id), poster: publish(posterTmp, `${id}-poster`), captions: publish(vtt, id),
    title: spec.title, description: spec.description, uploadDate: TODAY,
  };
  saveManifest();
}

async function captureVideos() {
  for (const id of Object.keys(VIDEOS).filter((id) => want("videos", id))) {
    if (!VO_DIR || !CAPTION_FONT) throw new Error("VO_DIR and CAPTION_FONT are required for the narrated videos");
    console.log("recording video", id);
    await produceVideo(id, await recordVideo(id));
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

try {
  await captureShots();
  await captureClips();
  await captureVideos();
} finally {
  await browser.close();
}
