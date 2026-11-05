import { createServer } from "vite";
import { readTemplate, SITE_NAME, writePage } from "./prerender-html";

// Vite compiles the existing TSX and MDX with the app's aliases and plugins.
// Middleware mode opens no HTTP listener and makes no browser/API requests.
const vite = await createServer({ server: { middlewareMode: true }, appType: "custom" });
try {
  const { renderPublicPages } = await vite.ssrLoadModule("/scripts/render-public.tsx");
  const template = readTemplate();
  const pages = await renderPublicPages();
  for (const page of pages) {
    writePage(template, {
      path: page.path,
      title: `${page.seo.title} | ${SITE_NAME}`,
      description: page.seo.description,
      ogType: "website",
      ogImage: "/og-image.png",
      noscript: page.html,
      jsonLd: page.jsonLd,
    });
  }
  console.log(`Pre-rendered ${pages.length} public pages from their React components`);
} finally {
  await vite.close();
}
