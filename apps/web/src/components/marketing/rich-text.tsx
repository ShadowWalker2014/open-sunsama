import { Fragment } from "react";
import { Link } from "@tanstack/react-router";
import { parseInline } from "@/content/marketing/types";
import { cn } from "@/lib/utils";

const LINK =
  "font-medium text-foreground underline decoration-border underline-offset-4 transition-colors hover:text-primary hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm";

/**
 * Renders content-module text with its inline markup ([label](href), **bold**).
 * scripts/prerender-marketing.ts renders the same tokens to HTML.
 */
export function RichText({ text, linkClassName }: { text: string; linkClassName?: string }) {
  return (
    <>
      {parseInline(text).map((token, i) => {
        if (token.type === "strong") {
          return (
            <strong key={i} className="font-semibold text-foreground">
              {token.value}
            </strong>
          );
        }
        if (token.type === "link") {
          const external = /^https?:/.test(token.href);
          return external ? (
            <a key={i} href={token.href} target="_blank" rel={externalRel(token.href)} className={cn(LINK, linkClassName)}>
              {token.label}
            </a>
          ) : (
            <Link key={i} to={token.href} className={cn(LINK, linkClassName)}>
              {token.label}
            </Link>
          );
        }
        return <Fragment key={i}>{token.value}</Fragment>;
      })}
    </>
  );
}

/** A link that is internal (router) or external (new tab). */
export function SmartLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (/^https?:/.test(href)) {
    return (
      <a href={href} target="_blank" rel={externalRel(href)} className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link to={href} search={href === "/blog" ? {} : undefined} className={className}>
      {children}
    </Link>
  );
}

/**
 * Links to source code (GitHub, GitLab, Codeberg) stay followed: they are the
 * evidence behind our comparisons. Other outbound links are nofollow.
 */
export function externalRel(href: string): string {
  const codeHost = /^https?:\/\/(www\.)?(github\.com|gitlab\.com|codeberg\.org)\//.test(href);
  return codeHost ? "noopener noreferrer" : "nofollow noopener noreferrer";
}
