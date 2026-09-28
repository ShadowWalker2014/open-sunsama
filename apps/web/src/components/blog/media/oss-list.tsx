import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { JsonLd } from "@/components/seo/json-ld";
import { itemListApps } from "@/lib/oss-apps";
import { ossItemListJsonLd } from "@/lib/oss-structured-data";

type Entry = { kind: "card"; id: string; rank?: number } | { kind: "table"; ids: string[] };

const OssListContext = createContext<((key: string, entry: Entry) => () => void) | null>(null);

/**
 * Collects the <OssApp> cards and <OssTable>s in a post and emits one
 * ItemList JSON-LD for them, ranked. scripts/prerender-blog-meta.ts bakes the
 * same list into the HTML under the same script id, and JsonLd replaces it.
 */
export function OssListProvider({ name, slug, children }: { name: string; slug: string; children: ReactNode }) {
  const [entries, setEntries] = useState<Record<string, Entry>>({});

  const register = useCallback((key: string, entry: Entry) => {
    setEntries((prev) => ({ ...prev, [key]: entry }));
    return () =>
      setEntries((prev) => {
        const { [key]: _removed, ...rest } = prev;
        return rest;
      });
  }, []);

  const apps = useMemo(() => {
    const list = Object.values(entries);
    const cards = list.flatMap((e) => (e.kind === "card" ? [{ id: e.id, rank: e.rank }] : []));
    const tables = list.flatMap((e) => (e.kind === "table" ? [e.ids] : []));
    return itemListApps(cards, tables);
  }, [entries]);

  return (
    <OssListContext.Provider value={register}>
      {children}
      {apps.length > 0 && <JsonLd id="oss-itemlist-schema" data={ossItemListJsonLd(apps, { name, slug })} />}
    </OssListContext.Provider>
  );
}

/** Adds this card or table to the post's ItemList while mounted. */
export function useOssListEntry(key: string, entry: Entry) {
  const register = useContext(OssListContext);
  const serialized = JSON.stringify(entry);
  useEffect(() => register?.(key, JSON.parse(serialized) as Entry), [register, key, serialized]);
}
