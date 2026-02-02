import { Link } from "@tanstack/react-router";
import { ChevronRight, Home } from "lucide-react";
import { useEffect } from "react";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  // Add schema markup
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "breadcrumb-schema";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://opensunsama.com"
        },
        ...items.map((item, index) => ({
          "@type": "ListItem",
          "position": index + 2,
          "name": item.label,
          "item": item.href ? `https://opensunsama.com${item.href}` : undefined
        }))
      ]
    });
    
    const existing = document.getElementById("breadcrumb-schema");
    if (existing) existing.remove();
    
    document.head.appendChild(script);
    
    return () => {
      script.remove();
    };
  }, [items]);

  return (
    <nav aria-label="Breadcrumb" className="text-[11px] text-muted-foreground mb-4">
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
