import { Deal } from '@/types/deal';
import { fetchDealsFromSheet, updateDeal as updateDealInSheet } from '@/lib/sheets';
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

function dealsSource(): 'db' | 'sheets' {
  return process.env.DEALS_DATA_SOURCE === 'db' ? 'db' : 'sheets';
}

export async function fetchDealsForPublic(): Promise<Deal[]> {
  return getCached('deals:public', CACHE_TTL_PUBLIC_MS, async () => {
    if (dealsSource() === 'db') {
      const pool = getDbPool();
      return await fetchDealsFromDb(pool, { includePrivate: false });
    }
    return await fetchDealsFromSheet({ includePrivate: false });
  });
}

export async function fetchDealsForAdmin(): Promise<Deal[]> {
  if (dealsSource() === 'db') {
    const pool = getDbPool();
    return await fetchDealsFromDb(pool, { includePrivate: true });
  }
  return await fetchDealsFromSheet({ includePrivate: true });
}

export async function fetchDealById(id: string, opts?: { includePrivate?: boolean }): Promise<Deal | null> {
  const includePrivate = opts?.includePrivate === true;
  if (dealsSource() === 'db') {
    const pool = getDbPool();
    return await fetchDealByIdFromDb(pool, id, { includePrivate });
  }

  const all = await fetchDealsFromSheet({ includePrivate });
  return all.find((d) => d.id === id) ?? null;
}

export async function updateDealById(id: string, updates: Partial<Deal>): Promise<void> {
  if (dealsSource() === 'db') {
    const pool = getDbPool();
    await updateDealInDb(pool, id, updates);
    return;
  }
  await updateDealInSheet(id, updates);
}

/** Filtered + paginated deals (DB only). When sheets, falls back to fetchDealsForPublic + client filter. */
export async function fetchDealsFilteredPublic(
  opts: FetchDealsFilteredOpts
): Promise<{ deals: Deal[]; total: number }> {
  if (dealsSource() === 'db') {
    const pool = getDbPool();
    return await fetchDealsFiltered(pool, opts);
  }
  const all = await fetchDealsForPublic();
  const { filterAndSortDeals, paginateDeals } = await import('@/lib/sheets');
  const filtered = filterAndSortDeals(
    all,
    {
      period: opts.period,
      category: opts.category as Deal['category_main'],
      search: opts.search,
    },
    opts.sort ?? 'default'
  );
  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;
  const deals = filtered.slice(offset, offset + limit);
  return { deals, total: filtered.length };
}

/** Fetch deals by ids (for favorites/batch). Preserves order of ids. */
export async function fetchDealsByIds(ids: string[]): Promise<Deal[]> {
  if (ids.length === 0) return [];
  if (dealsSource() === 'db') {
    const pool = getDbPool();
    return await fetchDealsByIdsFromDb(pool, ids);
  }
  const all = await fetchDealsForPublic();
  const byId = new Map(all.map((d) => [d.id, d]));
  return ids.filter((id) => byId.has(id)).map((id) => byId.get(id)!);
}

