import { type ReactNode, useEffect, useState } from "react";
import { SEOHead } from "@/components/seo";
import { DocsLayoutHeader } from "./docs-layout-header";
import { DocsLayoutFooter } from "./docs-layout-footer";
import { DocsSidebar } from "./docs-sidebar";
import {
  TableOfContents,
  extractHeadings,
  type TOCHeading,
} from "@/components/blog/table-of-contents";
import type { DocPostWithComponent, DocSection } from "@/types/docs";

interface DocsLayoutProps {
  children: ReactNode;
  doc: DocPostWithComponent;
  sections: DocSection[];
}

/**
 * Layout wrapper for individual documentation pages
 * Includes sidebar navigation and optional table of contents
 */
export function DocsLayout({ children, doc, sections }: DocsLayoutProps) {
  const [headings, setHeadings] = useState<TOCHeading[]>([]);
  const canonicalUrl = `/docs/${doc.slug}`;

  // Extract headings after content renders
  useEffect(() => {
    const timer = setTimeout(() => {
      const extractedHeadings = extractHeadings();
      setHeadings(extractedHeadings);
    }, 100);
    return () => clearTimeout(timer);
  }, [doc.slug]);

  // Show TOC if 4+ headings
  const showTOC = headings.length >= 4;

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      <SEOHead
        title={`${doc.title} | Open Sunsama Docs`}
        description={doc.description}
        canonicalUrl={canonicalUrl}
        ogType="article"
      />

      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
      </div>

      <DocsLayoutHeader sections={sections} currentSlug={doc.slug} />

      <div className="flex-1 container mx-auto max-w-6xl px-4">
        <div className="flex gap-8">
          {/* Sidebar - desktop only */}
          <aside className="hidden lg:block w-64 flex-shrink-0 sticky top-12 h-[calc(100vh-3rem)]">
            <DocsSidebar sections={sections} currentSlug={doc.slug} />
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0 py-8">
            <article className="max-w-3xl">
              {/* Page header */}
              <header className="mb-8">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-2">
                  {doc.title}
                </h1>
                <p className="text-muted-foreground">{doc.description}</p>
              </header>

              {/* Content with optional TOC */}
              <div className={showTOC ? "flex gap-8" : ""}>
                <div className={showTOC ? "flex-1 min-w-0" : ""}>
                  <div className="docs-prose">{children}</div>
                </div>

                {/* TOC sidebar (desktop only, when enough headings) */}
                {showTOC && (
                  <aside className="hidden xl:block w-48 flex-shrink-0">
                    <div className="sticky top-24">
                      <TableOfContents headings={headings} />
                    </div>
                  </aside>
                )}
              </div>
            </article>
          </main>
        </div>
      </div>

      <DocsLayoutFooter />
    </div>
  );
}
