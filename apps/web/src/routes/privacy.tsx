import { LegalLayout } from "@/components/layout/legal-layout";
import PrivacyContent from "@/content/legal/privacy.mdx";
import { useSEO, SEO_CONFIGS } from "@/hooks/useSEO";

/**
 * Privacy Policy page
 * Renders MDX content within the legal layout
 */
export default function PrivacyPage() {
  useSEO(SEO_CONFIGS.privacy);
  
  return (
    <LegalLayout>
      <PrivacyContent />
    </LegalLayout>
  );
}
