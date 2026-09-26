/**
 * Reads blog posts for the build scripts (prerender-blog-meta.ts,
 * generate-sitemap.ts): the frontmatter object, and the MDX body as plain
 * semantic HTML for crawlers that don't run JavaScript.
 */

import fs from "node:fs";
import path from "node:path";
import type { Element, ElementContent, Root as HastRoot } from "hast";
import type { Root as MdastRoot, RootContent } from "mdast";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { BLOG_MEDIA } from "../src/lib/blog-media";
import {
  formatStars,
  getOssApp,
  licenseShort,
  licenseUrl,
  mcpLabel,
  monthYear,
  type OssApp,
  outboundLink,
  platformList,
  STATUS_LABELS,
  tableOrder,
} from "../src/lib/oss-apps";

export const BLOG_DIR = path.resolve(import.meta.dir, "../src/content/blog");

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  updated?: string;
  author: string;
  tags?: string[];
  image?: string;
  readingTime?: number;
  faqs?: { question: string; answer: string }[];
}

export interface BlogSource {
  slug: string;
  file: string;
  source: string;
  frontmatter: PostFrontmatter;
}

/** Frontmatter is a JS object literal: `export const frontmatter = {...};` */
export function readFrontmatter(source: string, file: string): PostFrontmatter {
  const match = source.match(/export const frontmatter = (\{[\s\S]*?\n\});/);
  if (!match?.[1]) throw new Error(`No frontmatter export in ${file}`);
  const data = new Function(`return (${match[1]});`)() as PostFrontmatter;
  if (!data.title || !data.description || !data.date) {
    throw new Error(`Frontmatter in ${file} is missing title, description or date`);
  }
  return data;
}

export function readBlogPosts(): BlogSource[] {
  return fs
    .readdirSync(BLOG_DIR)
    .map((slug) => ({ slug, file: path.join(BLOG_DIR, slug, "index.mdx") }))
    .filter(({ file }) => fs.existsSync(file))
    .map(({ slug, file }) => {
      const source = fs.readFileSync(file, "utf-8");
      return { slug, file, source, frontmatter: readFrontmatter(source, file) };
    });
}

export const lastUpdated = (post: PostFrontmatter) => post.updated ?? post.date;

// --- MDX body -> HTML --------------------------------------------------------

const el = (
  tagName: string,
  properties: Element["properties"],
  children: ElementContent[] = []
): Element => ({ type: "element", tagName, properties, children });

const text = (value: string): ElementContent => ({ type: "text", value });

const figure = (media: Element, caption?: string) =>
  el("figure", {}, caption ? [media, el("figcaption", {}, [text(caption)])] : [media]);

type JsxNode = Extract<RootContent, { type: "mdxJsxFlowElement" | "mdxJsxTextElement" }>;

/** An attribute's value: a string, or a plain literal in braces (rank={2}, ids={["a", "b"]}). */
function attrValue(node: JsxNode, name: string): unknown {
  for (const a of node.attributes) {
    if (a.type !== "mdxJsxAttribute" || a.name !== name) continue;
    if (typeof a.value === "string") return a.value;
    try {
      return new Function(`return (${a.value?.value ?? ""});`)() as unknown;
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function attr(node: JsxNode, name: string): string | undefined {
  const value = attrValue(node, name);
  return typeof value === "string" ? value : undefined;
}

const link = (url: string, label: string, follow = false): Element => {
  const { href, target, rel } = outboundLink(url, follow);
  return el("a", { href, ...(target ? { target } : {}), ...(rel ? { rel: rel.split(" ") } : {}) }, [text(label)]);
};

/** The used <OssApp>s and <OssTable>s, for the ItemList JSON-LD. */
export interface OssUsage {
  cards: { id: string; rank?: number }[];
  tables: string[][];
}

/** Mirrors components/blog/media/oss-app.tsx: the same facts, links and credit. */
function renderOssApp(app: OssApp, rank: number | undefined, bestFor: string | undefined): Element {
  const checked = monthYear(app.checkedAt);
  const shot = app.screenshot;
  const title = `${rank != null ? `${rank}. ` : ""}${app.name}`;
  const fact = (label: string, value: ElementContent[]): ElementContent[] => [
    el("dt", {}, [text(label)]),
    el("dd", {}, value),
  ];
  const children: ElementContent[] = [
    el("p", {}, [
      el("strong", {}, [text(title)]),
      ...(app.status !== "active" ? [text(` (${STATUS_LABELS[app.status]})`)] : []),
    ]),
    el("p", {}, [text(app.tagline)]),
  ];
  if (bestFor) children.push(el("p", {}, [el("strong", {}, [text("Best for:")]), text(` ${bestFor}`)]));
  if (app.caveat) children.push(el("p", {}, [el("strong", {}, [text("Note:")]), text(` ${app.caveat}`)]));
  if (shot.light) {
    children.push(
      figure(
        el("img", {
          src: shot.light,
          alt: `${app.name} screenshot`,
          width: shot.width,
          height: shot.height,
          loading: "lazy",
          decoding: "async",
        }),
        shot.source
      )
    );
  }
  children.push(
    el("dl", {}, [
      ...fact("License", [
        link(licenseUrl(app), licenseShort(app)),
        ...(licenseShort(app) !== app.license.name ? [text(` (${app.license.name})`)] : []),
      ]),
      ...fact("Stars", [text(`${formatStars(app.stars)} (as of ${checked})`)]),
      ...fact("Latest release", [
        text(app.latestRelease ? `${app.latestRelease.version} (${monthYear(app.latestRelease.date)})` : "No tagged releases"),
      ]),
      ...fact("Language", [text(app.primaryLanguage ?? "n/a")]),
      ...fact("Platforms", [text(platformList(app))]),
      ...fact("Self-host", [text(app.selfHost ?? "No server")]),
      ...fact("API", [text(app.api.length ? app.api.join(", ") : "None")]),
      ...fact("MCP", [app.mcp.url ? link(app.mcp.url, mcpLabel(app)) : text(mcpLabel(app))]),
    ]),
    el("p", {}, [
      link(app.repo, "Source code", true),
      text(" · "),
      link(app.website, "Website"),
      ...(app.docs ? [text(" · "), link(app.docs, "Docs")] : []),
      text(` · Facts checked ${checked}`),
    ])
  );
  return el("section", { id: `app-${app.id}`, ariaLabel: title }, children);
}

/** Mirrors components/blog/media/oss-table.tsx. */
function renderOssTable(apps: OssApp[]): Element {
  const cells = (tag: string, values: (string | ElementContent)[]) =>
    el(
      "tr",
      {},
      values.map((v) => el(tag, tag === "th" ? { scope: "col" } : {}, [typeof v === "string" ? text(v) : v]))
    );
  const checked = monthYear(apps.map((a) => a.checkedAt).sort()[0]);
  return figure(
    el("table", {}, [
      el("thead", {}, [
        cells("th", ["App", "License", "Stars", "Latest release", "Platforms", "Self-host", "API", "MCP"]),
      ]),
      el(
        "tbody",
        {},
        apps.map((app) =>
          cells("td", [
            link(app.repo, app.status === "active" ? app.name : `${app.name} (${STATUS_LABELS[app.status]})`, true),
            licenseShort(app),
            formatStars(app.stars),
            app.latestRelease ? `${app.latestRelease.version} (${monthYear(app.latestRelease.date)})` : "None",
            platformList(app),
            app.selfHost ?? "No",
            app.api.length ? app.api.join(", ") : "None",
            mcpLabel(app),
          ])
        )
      ),
    ]),
    `Stars, licenses and releases from each project's repository, checked ${checked}. App names link to the source code.`
  );
}

/**
 * The HTML each media component stands for, mirroring what
 * src/components/blog/media renders (light theme, same captions).
 */
function renderMedia(node: JsxNode, videosUsed: Set<string>, oss: OssUsage): Element | null {
  const id = attr(node, "id") ?? "";
  const caption = attr(node, "caption");

  if (node.name === "OssApp") {
    const app = getOssApp(id);
    if (!app) return null;
    const rankValue = attrValue(node, "rank");
    const rank = typeof rankValue === "number" ? rankValue : undefined;
    oss.cards.push({ id, rank });
    return renderOssApp(app, rank, attr(node, "bestFor"));
  }

  if (node.name === "OssTable") {
    const ids = attrValue(node, "ids");
    const apps = Array.isArray(ids) ? tableOrder(ids.filter((i): i is string => typeof i === "string")) : [];
    if (!apps.length) return null;
    oss.tables.push(apps.map((a) => a.id));
    return renderOssTable(apps);
  }

  if (node.name === "Shot") {
    const shot = BLOG_MEDIA.shots[id];
    if (!shot) return null;
    return figure(
      el("img", {
        src: shot.light,
        alt: attr(node, "alt") ?? "",
        width: shot.width,
        height: shot.height,
        loading: "lazy",
        decoding: "async",
      }),
      caption
    );
  }

  if (node.name === "Clip") {
    const clip = BLOG_MEDIA.clips[id];
    if (!clip) return null;
    return figure(
      el("video", {
        src: clip.light.mp4,
        poster: clip.light.poster,
        width: clip.width,
        height: clip.height,
        muted: true,
        loop: true,
        playsInline: true,
        preload: "none",
        ariaLabel: caption ?? "Product demo clip",
      }),
      caption
    );
  }

  if (node.name === "DemoVideo") {
    const video = BLOG_MEDIA.videos[id];
    if (!video) return null;
    videosUsed.add(id);
    const track = video.captions
      ? [el("track", { kind: "captions", src: video.captions, srcLang: "en", label: "English", default: true })]
      : [];
    return figure(
      el(
        "video",
        {
          src: video.mp4,
          poster: video.poster,
          width: video.width,
          height: video.height,
          controls: true,
          playsInline: true,
          preload: "none",
          ariaLabel: video.title,
        },
        track
      ),
      video.title
    );
  }

  return null;
}

const MEDIA = new Set(["Shot", "Clip", "DemoVideo", "OssApp", "OssTable"]);

/** Drops ESM and {expressions}, turns media JSX into HTML, unwraps other JSX. */
function mapMdxNodes(videosUsed: Set<string>, oss: OssUsage) {
  const walk = (children: RootContent[]): RootContent[] =>
    children.flatMap((node): RootContent[] => {
      switch (node.type) {
        case "mdxjsEsm":
        case "mdxFlowExpression":
        case "mdxTextExpression":
          return [];
        case "mdxJsxFlowElement":
        case "mdxJsxTextElement": {
          if (!node.name || !MEDIA.has(node.name)) return walk(node.children as RootContent[]);
          const media = renderMedia(node, videosUsed, oss);
          if (!media) {
            console.warn(`  <${node.name} id="${attr(node, "id")}"> is not in blog-media.json or oss-apps.json; skipped`);
            return [];
          }
          // mdast-util-to-hast turns an unknown node into its data.hName/hProperties/hChildren
          return [
            {
              type: "blogMedia",
              data: { hName: media.tagName, hProperties: media.properties, hChildren: media.children },
            } as unknown as RootContent,
          ];
        }
        default:
          if ("children" in node) {
            (node as { children: RootContent[] }).children = walk(node.children as RootContent[]);
          }
          return [node];
      }
    });

  return () => (tree: MdastRoot) => {
    tree.children = walk(tree.children);
  };
}

/** Same ids the client's table of contents assigns (components/blog/table-of-contents.tsx) */
export const headingId = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function textOf(node: ElementContent | HastRoot): string {
  if (node.type === "text") return node.value;
  return "children" in node ? node.children.map((c) => textOf(c as ElementContent)).join("") : "";
}

function addHeadingIds() {
  return (tree: HastRoot) => {
    const visit = (node: HastRoot | ElementContent) => {
      if (node.type === "element" && (node.tagName === "h2" || node.tagName === "h3")) {
        node.properties.id ??= headingId(textOf(node));
      }
      if ("children" in node) node.children.forEach((c) => visit(c as ElementContent));
    };
    visit(tree);
  };
}

/**
 * The post body as HTML, plus the DemoVideo ids it uses (for VideoObject
 * JSON-LD) and its <OssApp>/<OssTable> apps (for ItemList JSON-LD).
 */
export async function renderBody(source: string) {
  const videosUsed = new Set<string>();
  const oss: OssUsage = { cards: [], tables: [] };
  const file = await unified()
    .use(remarkParse)
    .use(remarkMdx)
    .use(remarkGfm)
    .use(mapMdxNodes(videosUsed, oss))
    .use(remarkRehype)
    .use(addHeadingIds)
    .use(rehypeStringify)
    .process(source);
  return { html: String(file), videosUsed: [...videosUsed], oss };
}
