import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import type { Persister } from "@tanstack/react-query-persist-client";

const STORAGE_KEY = "open_sunsama_rq_cache_v1";

const QUERY_KEYS_NEVER_PERSIST = new Set<string>([
  "auth",
  "uploads",
  "active-timer",
]);

function shouldPersistQuery(queryKey: readonly unknown[]): boolean {
  const head = typeof queryKey[0] === "string" ? queryKey[0] : "";
  if (QUERY_KEYS_NEVER_PERSIST.has(head)) return false;
  return true;
}

/**
 * Wraps localStorage in a try/catch — Safari private mode and quota errors
 * should never break the app, only skip persistence for that frame.
 */
function safeLocalStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const probe = "__os_persist_probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return undefined;
  }
}

export const persister: Persister | undefined = (() => {
  const storage = safeLocalStorage();
  if (!storage) return undefined;
  return createSyncStoragePersister({
    storage,
    key: STORAGE_KEY,
    // Throttle writes to keep the main thread free during rapid mutations.
    throttleTime: 1000,
  });
})();

/**
 * Predicate passed to PersistQueryClientProvider to filter what gets written
 * to disk. Mutations + sensitive queries stay in memory only.
 */
export function shouldPersistQueryFn(opts: { queryKey: readonly unknown[] }): boolean {
  return shouldPersistQuery(opts.queryKey);
}

export function clearPersistedCache(): void {
  const storage = safeLocalStorage();
  if (!storage) return;
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
