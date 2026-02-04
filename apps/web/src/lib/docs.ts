/**
 * Documentation utilities for the MDX-based docs system
 * Uses Vite's import.meta.glob for dynamic MDX imports
 */

import type {
  DocMeta,
  DocPost,
  DocPostWithComponent,
  DocSection,
} from "@/types/docs";
import { SECTION_META } from "@/types/docs";

// Dynamically import all MDX files from docs content directory
// Supports nested structure: /content/docs/{section}/{slug}/index.mdx
// Or flat structure: /content/docs/{section}-{slug}.mdx
const docsModules = import.meta.glob<{
  default: React.ComponentType;
  frontmatter?: DocMeta;
}>("/src/content/docs/**/*.mdx", { eager: true });

/**
 * Extract section and slug from file path
 * /src/content/docs/api/tasks.mdx -> { section: "api", slug: "api/tasks" }
 * /src/content/docs/getting-started/index.mdx -> { section: "getting-started", slug: "getting-started" }
 */
function extractPathInfo(
  path: string
): { section: string; slug: string } | null {
  // Match pattern: /content/docs/{section}/{name}.mdx or /content/docs/{section}/index.mdx
  const match = path.match(/\/content\/docs\/([^/]+)\/(.+)\.mdx$/);
  if (!match || !match[1] || !match[2]) return null;

  const section = match[1];
  const fileName = match[2];

  // If filename is 'index', slug is just the section
  // Otherwise, slug is section/filename
  const slug = fileName === "index" ? section : `${section}/${fileName}`;

  return { section, slug };
}

/**
 * Get all documentation pages sorted by section and order
 */
export function getAllDocs(): DocPost[] {
  const docs: DocPost[] = [];

  for (const [path, module] of Object.entries(docsModules)) {
    const pathInfo = extractPathInfo(path);
    if (!pathInfo) continue;

    const frontmatter = module.frontmatter;
    if (!frontmatter) {
      console.warn(`Doc at ${path} is missing frontmatter`);
      continue;
    }

    docs.push({
      slug: pathInfo.slug,
      title: frontmatter.title,
      description: frontmatter.description,
      order: frontmatter.order ?? 999,
      section: pathInfo.section,
      icon: frontmatter.icon,
    });
  }

  // Sort by section order, then by doc order within section
  return docs.sort((a, b) => {
    const sectionOrderA = SECTION_META[a.section]?.order ?? 999;
    const sectionOrderB = SECTION_META[b.section]?.order ?? 999;

    if (sectionOrderA !== sectionOrderB) {
      return sectionOrderA - sectionOrderB;
    }

    return a.order - b.order;
  });
}

/**
 * Get a single documentation page by slug with its MDX component
 */
export function getDocBySlug(slug: string): DocPostWithComponent | null {
  // Try different path patterns
  const pathPatterns = [
    `/src/content/docs/${slug}.mdx`,
    `/src/content/docs/${slug}/index.mdx`,
  ];

  for (const path of pathPatterns) {
    const module = docsModules[path];
    if (module) {
      const frontmatter = module.frontmatter;
      if (!frontmatter) {
        console.warn(`Doc at ${path} is missing frontmatter`);
        return null;
      }

      const pathInfo = extractPathInfo(path);
      const slugParts = slug.split("/");
      const section: string = pathInfo?.section ?? slugParts[0] ?? "unknown";

      return {
        slug,
        title: frontmatter.title,
        description: frontmatter.description,
        order: frontmatter.order ?? 999,
        section,
        icon: frontmatter.icon,
        Component: module.default,
      };
    }
  }

  return null;
}

/**
 * Get all docs grouped by section for sidebar navigation
 */
export function getDocsBySection(): DocSection[] {
  const docs = getAllDocs();
  const sectionMap = new Map<string, DocPost[]>();

  // Group docs by section
  for (const doc of docs) {
    const existing = sectionMap.get(doc.section) ?? [];
    existing.push(doc);
    sectionMap.set(doc.section, existing);
  }

  // Convert to array of sections
  const sections: DocSection[] = [];

  for (const [sectionId, sectionDocs] of sectionMap) {
    const meta = SECTION_META[sectionId];
    sections.push({
      id: sectionId,
      name: meta?.name ?? sectionId,
      order: meta?.order ?? 999,
      docs: sectionDocs.sort((a, b) => a.order - b.order),
    });
  }

  // Sort sections by order
  return sections.sort((a, b) => a.order - b.order);
}

/**
 * Get adjacent docs for prev/next navigation
 */
export function getAdjacentDocs(currentSlug: string): {
  prev: DocPost | null;
  next: DocPost | null;
} {
  const allDocs = getAllDocs();
  const currentIndex = allDocs.findIndex((doc) => doc.slug === currentSlug);

  if (currentIndex === -1) {
    return { prev: null, next: null };
  }

  return {
    prev: currentIndex > 0 ? (allDocs[currentIndex - 1] ?? null) : null,
    next:
      currentIndex < allDocs.length - 1
        ? (allDocs[currentIndex + 1] ?? null)
        : null,
  };
}

/**
 * Search docs by query
 */
export function searchDocs(query: string): DocPost[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return [];

  const allDocs = getAllDocs();

  return allDocs.filter(
    (doc) =>
      doc.title.toLowerCase().includes(normalizedQuery) ||
      doc.description.toLowerCase().includes(normalizedQuery)
  );
}
