import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { JsonLd } from "@/components/seo";
import { JSON_LD_IDS } from "@/content/marketing/json-ld";
import { breadcrumbListJsonLd, type BreadcrumbInput } from "@/lib/structured-data";
import { cn } from "@/lib/utils";

/**
 * Visible trail (Home › … › this page) plus BreadcrumbList JSON-LD with the
 * same id the prerendered HTML uses, so the client replaces it.
 */
export function Breadcrumbs({
  items,
  path,
  className,
}: {
  /** Crumbs after Home. The last one is the current page and has no href. */
  items: BreadcrumbInput[];
  /** The current page's path, for the last crumb's URL in the JSON-LD. */
  path: string;
  className?: string;
}) {
  const link =
    "rounded-sm transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
  return (
    <nav aria-label="Breadcrumb" className={cn("text-[12.5px] text-muted-foreground", className)}>
      <JsonLd id={JSON_LD_IDS.breadcrumbs} data={breadcrumbListJsonLd(items, path)} />
      <ol className="flex flex-wrap items-center gap-1.5">
        <li>
          <Link to="/" className={link}>
            Home
          </Link>
        </li>
        {items.map((item, i) => (
          <li key={item.label} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" aria-hidden />
            {item.href?.includes("#") ? (
              <a href={item.href} className={link}>
                {item.label}
              </a>
            ) : item.href ? (
              <Link to={item.href} className={link}>
                {item.label}
              </Link>
            ) : i === items.length - 1 ? (
              <span aria-current="page" className="font-medium text-foreground/80">
                {item.label}
              </span>
            ) : (
              <span>{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
