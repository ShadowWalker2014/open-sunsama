import { faqPageJsonLd, type FAQItem } from "@/lib/structured-data";
import { JsonLd } from "./json-ld";

interface FAQSchemaProps {
  items: FAQItem[];
}

export function FAQSchema({ items }: FAQSchemaProps) {
  return <JsonLd id="faq-schema" data={faqPageJsonLd(items)} />;
}
