import { useParams, Navigate, Link } from "@tanstack/react-router";
import { getDocBySlug, getDocsBySection, getAdjacentDocs } from "@/lib/docs";
import { DocsLayout } from "@/components/docs/docs-layout";
import { ArrowLeft, ArrowRight } from "lucide-react";

/**
 * Individual documentation page
 * Renders MDX content within the docs layout with sidebar
 */
export default function DocPage() {
  // Use splat param to capture nested paths like "api/authentication"
  const params = useParams({ from: "/docs/$" });
  const slug = (params as any)["_splat"] || "";

  const doc = getDocBySlug(slug);
  const sections = getDocsBySection();

  // Redirect to docs landing if page not found
  if (!doc) {
    return <Navigate to="/docs" />;
  }

  const { prev, next } = getAdjacentDocs(slug);
  const { Component } = doc;

  return (
    <DocsLayout doc={doc} sections={sections}>
      <Component />

      {/* Prev/Next navigation */}
      <div className="mt-12 pt-6 border-t border-border/40">
        <div className="flex items-center justify-between gap-4">
          {prev ? (
            <Link
              to={`/docs/${prev.slug}` as any}
              className="group flex-1 flex items-center gap-2 p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
              <div className="text-left">
                <div className="text-xs text-muted-foreground">Previous</div>
                <div className="text-sm font-medium">{prev.title}</div>
              </div>
            </Link>
          ) : (
            <div className="flex-1" />
          )}

          {next ? (
            <Link
              to={`/docs/${next.slug}` as any}
              className="group flex-1 flex items-center justify-end gap-2 p-4 rounded-lg border border-border/50 hover:bg-muted/50 transition-colors"
            >
              <div className="text-right">
                <div className="text-xs text-muted-foreground">Next</div>
                <div className="text-sm font-medium">{next.title}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          ) : (
            <div className="flex-1" />
          )}
        </div>
      </div>
    </DocsLayout>
  );
}
