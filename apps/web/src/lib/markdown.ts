import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";

const htmlDocumentStart =
  /^\s*<(?:p|br|strong|b|em|i|u|s|a|ul|ol|li|blockquote|pre|code|span|div|img|h[1-6]|hr)\b/i;

/** Existing rich-text descriptions are HTML; plain descriptions are Markdown. */
export function descriptionToHtml(description: string) {
  if (htmlDocumentStart.test(description)) return description;

  // remark-rehype does not pass raw HTML through, then HtmlContent sanitizes it.
  return String(
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .processSync(description)
  );
}
