import { Link } from "@tanstack/react-router";
import { getDocsBySection } from "@/lib/docs";
import { SECTION_META } from "@/types/docs";
import { SEOHead } from "@/components/seo";
import { DocsLayoutHeader } from "@/components/docs/docs-layout-header";
import { DocsLayoutFooter } from "@/components/docs/docs-layout-footer";
import { Book, Code, Wrench, BookOpen, Server, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const sectionIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "getting-started": Book,
  api: Code,
  mcp: Wrench,
  guides: BookOpen,
  "self-hosting": Server,
};

/**
 * Main documentation landing page
 * Shows overview of all doc sections
 */
export default function DocsPage() {
  const sections = getDocsBySection();

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
      <SEOHead
        title="Documentation | Open Sunsama"
        description="Comprehensive documentation for Open Sunsama. Learn about the REST API, MCP tools for AI agents, self-hosting, and more."
        canonicalUrl="/docs"
      />

      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-1/4 w-[500px] h-[400px] bg-primary/[0.03] blur-[100px] rounded-full" />
      </div>

      <DocsLayoutHeader sections={sections} />

      <main className="flex-1 relative">
        {/* Hero section */}
        <section className="py-16 md:py-24">
          <div className="container px-4 mx-auto max-w-4xl text-center">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Open Sunsama Documentation
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Learn how to integrate with Open Sunsama's REST API, connect AI
              agents using MCP tools, self-host your own instance, and more.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              {sections[0]?.docs[0] && (
                <Button asChild>
                  <Link to={`/docs/${sections[0].docs[0].slug}` as any}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              )}
              <Button variant="outline" asChild>
                <a
                  href="https://github.com/ShadowWalker2014/open-sunsama"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Sections grid */}
        <section className="pb-16">
          <div className="container px-4 mx-auto max-w-5xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(SECTION_META).map(([id, meta]) => {
                const Icon = sectionIcons[id] ?? Book;
                const sectionData = sections.find((s) => s.id === id);
                const docCount = sectionData?.docs.length ?? 0;
                const firstDoc = sectionData?.docs[0];

                return (
                  <Link
                    key={id}
                    to={(firstDoc ? `/docs/${firstDoc.slug}` : "/docs") as any}
                    className="group block p-6 rounded-xl border border-border/50 bg-card/50 hover:bg-card hover:border-border transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <h2 className="font-semibold group-hover:text-primary transition-colors">
                        {meta.name}
                      </h2>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      {meta.description}
                    </p>
                    {docCount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {docCount} {docCount === 1 ? "article" : "articles"}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        {/* Quick links */}
        <section className="py-12 border-t border-border/40">
          <div className="container px-4 mx-auto max-w-4xl">
            <h2 className="text-lg font-semibold mb-6 text-center">
              Popular Topics
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: "Quick Start", slug: "getting-started" },
                { title: "API Authentication", slug: "api/authentication" },
                { title: "MCP Setup", slug: "mcp/overview" },
                { title: "Self-Hosting", slug: "self-hosting/docker" },
              ].map((item) => (
                <Link
                  key={item.slug}
                  to={`/docs/${item.slug}` as any}
                  className="flex items-center justify-between p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors group"
                >
                  <span className="text-sm font-medium">{item.title}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <DocsLayoutFooter />
    </div>
  );
}
