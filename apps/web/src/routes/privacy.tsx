import { LegalLayout } from "@/components/layout/legal-layout";
import PrivacyContent from "@/content/legal/privacy.mdx";

/**
 * Privacy Policy page
 * Renders MDX content within the legal layout
 */
export default function PrivacyPage() {
  return (
    <LegalLayout>
      <PrivacyContent />
    </LegalLayout>
  );
}
