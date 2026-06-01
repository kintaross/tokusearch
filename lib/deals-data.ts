import { unstable_cache } from 'next/cache';
import { Deal } from '@/types/deal';
import { getDbPool, withDbRetry } from '@/lib/db';
import {
  fetchDealByIdFromDb,
  fetchDealsFromDb,
  fetchDealsFiltered,
  fetchDealsByIdsFromDb,
  type FetchDealsFilteredOpts,
  updateDealInDb,
} from '@/lib/db-deals-read';
import { DEALS_TAG, CACHE_TTL_PUBLIC_SEC } from '@/lib/cache';

/**
 * 公開Dealsのタグ付きキャッシュ（Next.js Data Cache）。
 * - 全インスタンス共有なので、インスタンスごとに別スナップショットを持つ問題が無い。
 * - 取り込み/更新時に revalidateTag(DEALS_TAG) で即時無効化される。
 * - revalidate は保険（取り込みが無い間の自然な期限切れ対策）。
 */
const getPublicDealsCached = unstable_cache(
  () => withDbRetry(() => fetchDealsFromDb(getDbPool(), { includePrivate: false })),
  ['deals:public'],
  { tags: [DEALS_TAG], revalidate: CACHE_TTL_PUBLIC_SEC }
);

export async function fetchDealsForPublic(): Promise<Deal[]> {
  return getPublicDealsCached();
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
