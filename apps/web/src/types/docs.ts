/**
 * Documentation types for the MDX-based docs system
 */

/**
 * Frontmatter metadata for documentation pages
 */
export interface DocMeta {
  title: string;
  description: string;
  order: number; // For sidebar sorting within section
  section: string; // e.g., "getting-started", "api", "mcp"
  icon?: string; // Optional icon name for sidebar
}

/**
 * Full documentation page with slug
 */
export interface DocPost extends DocMeta {
  slug: string;
}

/**
 * Documentation page with component for rendering
 */
export interface DocPostWithComponent extends DocPost {
  Component: React.ComponentType;
}

/**
 * Section grouping for sidebar navigation
 */
export interface DocSection {
  id: string;
  name: string;
  order: number;
  docs: DocPost[];
}

/**
 * Section metadata for display
 */
export const SECTION_META: Record<
  string,
  { name: string; order: number; description: string }
> = {
  "getting-started": {
    name: "Getting Started",
    order: 1,
    description: "Quick start guides and installation",
  },
  api: {
    name: "API Reference",
    order: 2,
    description: "REST API endpoints and authentication",
  },
  mcp: {
    name: "MCP Tools",
    order: 3,
    description: "AI agent integration with Model Context Protocol",
  },
  guides: {
    name: "Guides",
    order: 4,
    description: "In-depth tutorials and best practices",
  },
  "self-hosting": {
    name: "Self-Hosting",
    order: 5,
    description: "Deploy and run your own instance",
  },
};
