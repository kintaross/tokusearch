/**
 * Simple in-memory TTL cache for server-side data.
 * Used to avoid repeated DB/API calls within the same TTL window.
 */
const cache = new Map<string, { data: unknown; expiresAt: number }>();

export function getCached<T>(key: string, ttlMs: number, fetcher: () => Promise<T>): Promise<T> {
  const entry = cache.get(key);
  if (entry && entry.expiresAt > Date.now()) {
    return Promise.resolve(entry.data as T);
  }
  return fetcher().then((data) => {
    cache.set(key, { data, expiresAt: Date.now() + ttlMs });
    return data;
  });
}

/** Default TTL for public deals/columns data (60 seconds) */
export const CACHE_TTL_PUBLIC_MS = 60_000;
