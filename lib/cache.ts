/**
 * Simple in-memory TTL cache for server-side data.
 * Used to avoid repeated DB/API calls within the same TTL window.
 */
const cache = new Map<string, { data: unknown; expiresAt: number }>();

const MAX_CACHE_ENTRIES = 50;

function evictStale() {
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const now = Date.now();
  for (const [k, v] of cache) {
    if (v.expiresAt <= now) cache.delete(k);
  }
  if (cache.size <= MAX_CACHE_ENTRIES) return;
  const sorted = [...cache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt);
  const toRemove = sorted.slice(0, cache.size - MAX_CACHE_ENTRIES);
  for (const [k] of toRemove) cache.delete(k);
}

export function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return Promise.resolve(entry.data as T);
  }
  return fetcher().then((data) => {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
    evictStale();
    return data;
  });
}

/** Default TTL for public deals/columns data (60 seconds) */
export const CACHE_TTL_PUBLIC_MS = 60_000;
