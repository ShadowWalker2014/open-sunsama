import { docsArticleJsonLd, type DocsArticleInput } from "@/lib/structured-data";
import { JsonLd } from "./json-ld";

export function DocsSchema(props: DocsArticleInput) {
  return <JsonLd id="docs-schema" data={docsArticleJsonLd(props)} />;
}
