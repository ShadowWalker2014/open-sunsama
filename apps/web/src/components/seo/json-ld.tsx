import { useEffect } from "react";

/**
 * Puts one JSON-LD <script> in <head> while mounted. A script with the same id
 * (e.g. baked in by scripts/prerender-blog-meta.ts) is replaced, not duplicated.
 */
export function JsonLd({ id, data }: { id: string; data: object }) {
  const json = JSON.stringify(data);

  useEffect(() => {
    document.getElementById(id)?.remove();
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = id;
    script.textContent = json;
    document.head.appendChild(script);
    return () => script.remove();
  }, [id, json]);

  return null;
}
