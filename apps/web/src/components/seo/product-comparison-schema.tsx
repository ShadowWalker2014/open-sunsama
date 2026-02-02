import { useEffect } from "react";

interface ComparedProduct {
  name: string;
  description: string;
  image?: string;
  url?: string;
  price?: string;
  priceCurrency?: string;
}

interface ProductComparisonSchemaProps {
  mainProduct: ComparedProduct;
  comparedProducts: ComparedProduct[];
  articleTitle: string;
  articleUrl: string;
}

export function ProductComparisonSchema({
  mainProduct,
  comparedProducts,
  articleTitle,
  articleUrl,
}: ProductComparisonSchemaProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "product-comparison-schema";

    // Create ItemList for comparison
    const schemaData = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: articleTitle,
      url: articleUrl,
      numberOfItems: comparedProducts.length + 1,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          item: {
            "@type": "SoftwareApplication",
            name: mainProduct.name,
            description: mainProduct.description,
            applicationCategory: "ProductivityApplication",
            operatingSystem: "Web, Windows, macOS, Linux",
            offers: {
              "@type": "Offer",
              price: mainProduct.price || "0",
              priceCurrency: mainProduct.priceCurrency || "USD",
            },
            url: mainProduct.url || "https://opensunsama.com",
          },
        },
        ...comparedProducts.map((product, index) => ({
          "@type": "ListItem",
          position: index + 2,
          item: {
            "@type": "SoftwareApplication",
            name: product.name,
            description: product.description,
            applicationCategory: "ProductivityApplication",
            offers: product.price
              ? {
                  "@type": "Offer",
                  price: product.price,
                  priceCurrency: product.priceCurrency || "USD",
                }
              : undefined,
            url: product.url,
          },
        })),
      ],
    };

    script.textContent = JSON.stringify(schemaData);

    const existing = document.getElementById("product-comparison-schema");
    if (existing) existing.remove();

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [mainProduct, comparedProducts, articleTitle, articleUrl]);

  return null;
}
