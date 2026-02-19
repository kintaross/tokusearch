import { Deal } from '@/types/deal';
import { getDbPool } from '@/lib/db';
import {
  fetchDealByIdFromDb,
  fetchDealsFromDb,
  fetchDealsFiltered,
  fetchDealsByIdsFromDb,
  type FetchDealsFilteredOpts,
  updateDealInDb,
} from '@/lib/db-deals-read';
import { getCached, CACHE_TTL_PUBLIC_MS } from '@/lib/cache';

export async function fetchDealsForPublic(): Promise<Deal[]> {
  return getCached('deals:public', CACHE_TTL_PUBLIC_MS, async () => {
    const pool = getDbPool();
    return await fetchDealsFromDb(pool, { includePrivate: false });
  });
}

export async function fetchDealsForAdmin(): Promise<Deal[]> {
  const pool = getDbPool();
  return await fetchDealsFromDb(pool, { includePrivate: true });
}

export async function fetchDealById(id: string, opts?: { includePrivate?: boolean }): Promise<Deal | null> {
  const includePrivate = opts?.includePrivate === true;
  const pool = getDbPool();
  return await fetchDealByIdFromDb(pool, id, { includePrivate });
}

export async function updateDealById(id: string, updates: Partial<Deal>): Promise<void> {
  const pool = getDbPool();
  await updateDealInDb(pool, id, updates);
}

export async function fetchDealsFilteredPublic(
  opts: FetchDealsFilteredOpts
): Promise<{ deals: Deal[]; total: number }> {
  const pool = getDbPool();
  return await fetchDealsFiltered(pool, opts);
}

/** Fetch deals by ids (for favorites/batch). Preserves order of ids. */
export async function fetchDealsByIds(ids: string[]): Promise<Deal[]> {
  if (ids.length === 0) return [];
  const pool = getDbPool();
  return await fetchDealsByIdsFromDb(pool, ids);
}
