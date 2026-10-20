import type { ReactNode } from "react";

/** Safe, compact Markdown for task titles; HTML remains plain text. */
export function renderInlineMarkdown(value: string): ReactNode[] {
  const parts = value.split(/(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g);

  return parts.filter(Boolean).map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return <code key={index} className="rounded bg-muted px-0.5 font-mono text-[0.95em]">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith("[")) {
      return <span key={index} className="underline">{part.slice(1, part.indexOf("]("))}</span>;
    }
    return part;
  });
}
