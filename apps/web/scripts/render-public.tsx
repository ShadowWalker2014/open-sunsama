import { renderToStaticMarkup } from "react-dom/server";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import LandingPage from "../src/routes/landing";
import SunsamaPage, { FAQS as sunsamaFaqs } from "../src/routes/alternative.sunsama";
import DownloadPage from "../src/routes/download";
import PrivacyPage from "../src/routes/privacy";
import TermsPage from "../src/routes/terms";
import { SEO_CONFIGS } from "../src/hooks/useSEO";
import { FAQS as homeFaqs } from "../src/components/landing/faq-section";
import { faqPageJsonLd, videoObjectJsonLd } from "../src/lib/structured-data";
import { plainText } from "../src/content/marketing/types";
import { BLOG_MEDIA } from "../src/lib/blog-media";

const pages = [
  { path: "/", component: LandingPage, seo: SEO_CONFIGS.landing },
  { path: "/alternative/sunsama", component: SunsamaPage, seo: SEO_CONFIGS.alternative.sunsama },
  { path: "/download", component: DownloadPage, seo: SEO_CONFIGS.download },
  { path: "/privacy", component: PrivacyPage, seo: SEO_CONFIGS.privacy },
  { path: "/terms", component: TermsPage, seo: SEO_CONFIGS.terms },
];

/** Render the real components, so crawler copy cannot drift from the page. */
export async function renderPublicPages() {
  const rendered = [];
  for (const page of pages) {
    const root = createRootRoute({ component: Outlet });
    const route = createRoute({ getParentRoute: () => root, path: page.path, component: page.component });
    const router = createRouter({
      routeTree: root.addChildren([route]),
      history: createMemoryHistory({ initialEntries: [page.path] }),
      isServer: true,
    });
    await router.load();
    const html = renderToStaticMarkup(<RouterProvider router={router} />);
    if (!html.includes("<h1")) throw new Error(`No content rendered for ${page.path}`);
    const jsonLd: Record<string, object> = {};
    const faqs = page.path === "/" ? homeFaqs : page.path === "/alternative/sunsama" ? sunsamaFaqs : null;
    if (faqs) {
      jsonLd["faq-schema"] = faqPageJsonLd(faqs.map(({ question, answer }) => ({ question, answer: plainText(answer) })));
      for (const id of ["tour", "ai"]) {
        const video = BLOG_MEDIA.videos[id];
        if (video) jsonLd[`video-schema-${id}`] = videoObjectJsonLd(video);
      }
    }
    // Presentation-only styles include entrance animations that start invisible.
    // The no-JS copy stays readable and uses the exact same component text.
    const content = html
      .replace(/<svg\b[\s\S]*?<\/svg>/g, "")
      .replace(/\s(?:class|style)="[^"]*"/g, "")
      .replace(/<link\b[^>]*>/g, "");
    rendered.push({ path: page.path, seo: page.seo, html: content, jsonLd });
  }
  return rendered;
}
