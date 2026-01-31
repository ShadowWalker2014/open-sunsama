declare module "*.mdx" {
  import type { ComponentType } from "react";
  import type { BlogMeta } from "@/types/blog";
  
  const MDXComponent: ComponentType;
  export default MDXComponent;
  
  // Frontmatter exports for blog posts
  export const frontmatter: BlogMeta | undefined;
}
