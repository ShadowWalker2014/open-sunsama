import { blogPostingJsonLd, type BlogPostingInput } from "@/lib/structured-data";
import { JsonLd } from "./json-ld";

export function ArticleSchema(props: BlogPostingInput) {
  return <JsonLd id="article-schema" data={blogPostingJsonLd(props)} />;
}
