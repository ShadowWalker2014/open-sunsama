import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { SiteHeader, SkipLink } from "@/components/marketing/site-header";
import { DocsSidebar } from "./docs-sidebar";
import type { DocSection } from "@/types/docs";

interface DocsLayoutHeaderProps {
  sections: DocSection[];
  currentSlug?: string;
}

/**
 * The site header (same as every public page) with "/ Docs" after the logo
 * and, below `lg`, a button that opens the docs sidebar.
 */
export function DocsLayoutHeader({ sections, currentSlug }: DocsLayoutHeaderProps) {
  return (
    <>
      <SkipLink />
      <SiteHeader
        section={{ label: "Docs", href: "/docs" }}
        leading={
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="-ml-1.5 h-8 w-8 lg:hidden">
                <Menu className="h-4 w-4" />
                <span className="sr-only">Open docs navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="border-b border-border/60 px-4 py-4 text-[14px] font-semibold">Documentation</SheetTitle>
              <DocsSidebar sections={sections} currentSlug={currentSlug} />
            </SheetContent>
          </Sheet>
        }
      />
    </>
  );
}
