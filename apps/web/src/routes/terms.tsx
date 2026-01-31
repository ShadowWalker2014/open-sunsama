import { LegalLayout } from "@/components/layout/legal-layout";
import TermsContent from "@/content/legal/terms.mdx";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";

/**
 * Terms of Service page
 * Renders MDX content within the legal layout
 */
export default function TermsPage() {
  useSEO(SEO_CONFIGS.terms);
  
  return (
    <LegalLayout>
      <TermsContent />
    </LegalLayout>
  );
}
