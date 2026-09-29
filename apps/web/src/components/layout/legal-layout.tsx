import type * as React from "react";
import { MarketingLayout } from "@/components/marketing/marketing-layout";

interface LegalLayoutProps {
  children: React.ReactNode;
}

/**
 * Privacy Policy and Terms of Service: the shared site header and footer, and
 * the blog's reading styles (.blog-prose in index.css) in a narrow column.
 */
export function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <MarketingLayout>
      <div className="container mx-auto max-w-[720px] px-4 pb-24 pt-10 md:pt-16">
        <article className="blog-prose [&>h1:first-child]:mt-0 [&>h1]:text-[34px] md:[&>h1]:text-[44px]">{children}</article>
      </div>
    </MarketingLayout>
  );
}
