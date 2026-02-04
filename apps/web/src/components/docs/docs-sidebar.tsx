import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import type { DocSection } from "@/types/docs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronRight,
  Book,
  Code,
  Wrench,
  BookOpen,
  Server,
} from "lucide-react";
import { useState } from "react";

interface DocsSidebarProps {
  sections: DocSection[];
  currentSlug?: string;
}

const sectionIcons: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "getting-started": Book,
  api: Code,
  mcp: Wrench,
  guides: BookOpen,
  "self-hosting": Server,
};

/**
 * Sidebar navigation for documentation
 * Shows sections with collapsible doc lists
 */
export function DocsSidebar({ sections, currentSlug }: DocsSidebarProps) {
  // Determine which sections should be open initially
  const initialOpenSections = sections
    .filter((section) => section.docs.some((doc) => doc.slug === currentSlug))
    .map((section) => section.id);

  const [openSections, setOpenSections] = useState<string[]>(
    initialOpenSections.length > 0
      ? initialOpenSections
      : [sections[0]?.id ?? ""]
  );

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  return (
    <nav className="py-4 overflow-y-auto h-[calc(100vh-3rem)]">
      <div className="space-y-1 px-2">
        {sections.map((section) => {
          const Icon = sectionIcons[section.id] ?? Book;
          const isOpen = openSections.includes(section.id);
          const hasActiveDocs = section.docs.some(
            (doc) => doc.slug === currentSlug
          );

          return (
            <Collapsible
              key={section.id}
              open={isOpen}
              onOpenChange={() => toggleSection(section.id)}
            >
              <CollapsibleTrigger className="flex items-center gap-2 w-full px-2 py-1.5 text-[13px] font-medium rounded-md hover:bg-muted/50 transition-colors">
                <ChevronRight
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    isOpen && "rotate-90"
                  )}
                />
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className={cn(hasActiveDocs && "text-primary")}>
                  {section.name}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="pl-4 mt-1">
                <ul className="space-y-0.5 border-l border-border/50 ml-2">
                  {section.docs.map((doc) => {
                    const isActive = doc.slug === currentSlug;
                    return (
                      <li key={doc.slug}>
                        <Link
                          to={`/docs/${doc.slug}` as any}
                          className={cn(
                            "block pl-4 py-1.5 text-[12px] hover:text-foreground transition-colors border-l -ml-px",
                            isActive
                              ? "text-primary border-primary font-medium"
                              : "text-muted-foreground border-transparent hover:border-muted-foreground/50"
                          )}
                        >
                          {doc.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    </nav>
  );
}
