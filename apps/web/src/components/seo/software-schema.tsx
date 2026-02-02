import { useEffect } from "react";

interface SoftwareSchemaProps {
  name: string;
  description: string;
  applicationCategory?: string;
  operatingSystem?: string;
  price?: string;
  priceCurrency?: string;
  aggregateRating?: {
    ratingValue: number;
    ratingCount: number;
  };
  featureList?: string[];
  url?: string;
}

export function SoftwareApplicationSchema({
  name = "Open Sunsama",
  description,
  applicationCategory = "ProductivityApplication",
  operatingSystem = "Web, Windows, macOS, Linux",
  price = "0",
  priceCurrency = "USD",
  aggregateRating,
  featureList,
  url = "https://opensunsama.com",
}: SoftwareSchemaProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "software-schema";
    
    const schemaData: any = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      "name": name,
      "description": description,
      "applicationCategory": applicationCategory,
      "operatingSystem": operatingSystem,
      "url": url,
      "downloadUrl": "https://opensunsama.com/download",
      "offers": {
        "@type": "Offer",
        "price": price,
        "priceCurrency": priceCurrency
      },
      "author": {
        "@type": "Organization",
        "name": "Open Sunsama",
        "url": "https://opensunsama.com"
      }
    };
    
    if (aggregateRating) {
      schemaData.aggregateRating = {
        "@type": "AggregateRating",
        "ratingValue": aggregateRating.ratingValue,
        "ratingCount": aggregateRating.ratingCount
      };
    }
    
    if (featureList && featureList.length > 0) {
      schemaData.featureList = featureList;
    }
    
    script.textContent = JSON.stringify(schemaData);
    
    const existing = document.getElementById("software-schema");
    if (existing) existing.remove();
    
    document.head.appendChild(script);
    
    return () => {
      script.remove();
    };
  }, [name, description, applicationCategory, operatingSystem, price, priceCurrency, aggregateRating, featureList, url]);
  
  return null;
}
