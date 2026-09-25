import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { breadcrumbListJsonLd } from "@/lib/structured-data";
import { JsonLd } from "./json-ld";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

/** Visible trail plus BreadcrumbList JSON-LD (marketing pages use components/marketing/breadcrumbs.tsx). */
export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="text-[11px] text-muted-foreground mb-4">
      <JsonLd id="breadcrumb-schema" data={breadcrumbListJsonLd(items)} />
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link 
            to="/" 
            className="hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Home className="h-3 w-3" />
            <span className="sr-only">Home</span>
          </Link>
        </li>
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-1.5">
            <ChevronRight className="h-3 w-3 text-muted-foreground/50" />
            {item.href ? (
              <Link 
                to={item.href} 
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className="text-foreground font-medium">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
