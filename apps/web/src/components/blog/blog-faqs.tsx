import { Plus } from "lucide-react";
import { FAQSchema } from "@/components/seo";
import type { BlogFaq } from "@/types/blog";

/**
 * "Frequently asked questions" at the end of a post, as a <details> list plus
 * FAQPage JSON-LD. Closed answers stay in the DOM, so crawlers read them all.
 * scripts/prerender-blog-meta.ts renders the same text for crawlers without JS.
 */
export function BlogFaqs({ faqs }: { faqs?: BlogFaq[] }) {
  if (!faqs?.length) return null;

  return (
    <section aria-labelledby="faq" className="blog-faq">
      <FAQSchema items={faqs} />
      <h2 id="faq">Frequently asked questions</h2>
      <div className="blog-faq-list">
        {faqs.map((faq, i) => (
          <details key={faq.question} className="group" open={i === 0}>
            <summary>
              <h3>{faq.question}</h3>
              <span aria-hidden className="blog-faq-icon">
                <Plus className="h-4 w-4 transition-transform duration-300 group-open:rotate-45 motion-reduce:transition-none" />
              </span>
            </summary>
            <p>{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
