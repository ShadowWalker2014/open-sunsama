import { useEffect } from "react";

interface HowToStep {
  name: string;
  text: string;
  image?: string;
}

interface HowToSchemaProps {
  name: string;
  description: string;
  totalTime?: string; // ISO 8601 duration, e.g., "PT30M" for 30 minutes
  steps: HowToStep[];
}

export function HowToSchema({ name, description, totalTime, steps }: HowToSchemaProps) {
  useEffect(() => {
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "how-to-schema";
    
    const schemaData: any = {
      "@context": "https://schema.org",
      "@type": "HowTo",
      "name": name,
      "description": description,
      "step": steps.map((step, index) => ({
        "@type": "HowToStep",
        "position": index + 1,
        "name": step.name,
        "text": step.text,
        ...(step.image && { "image": step.image })
      }))
    };
    
    if (totalTime) {
      schemaData.totalTime = totalTime;
    }
    
    script.textContent = JSON.stringify(schemaData);
    
    const existing = document.getElementById("how-to-schema");
    if (existing) existing.remove();
    
    document.head.appendChild(script);
    
    return () => {
      script.remove();
    };
  }, [name, description, totalTime, steps]);
  
  return null;
}
