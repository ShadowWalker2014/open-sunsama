import { LegalLayout } from "@/components/layout/legal-layout";
import TermsContent from "@/content/legal/terms.mdx";

/**
 * Terms of Service page
 * Renders MDX content within the legal layout
 */
export default function TermsPage() {
  return (
    <LegalLayout>
      <TermsContent />
    </LegalLayout>
  );
}
