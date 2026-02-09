import { Deal } from '@/types/deal';
import { fetchDealsFromSheet, updateDeal as updateDealInSheet } from '@/lib/sheets';
import { getDbPool } from '@/lib/db';
import { fetchDealByIdFromDb, fetchDealsFromDb, updateDealInDb } from '@/lib/db-deals-read';

function dealsSource(): 'db' | 'sheets' {
  return process.env.DEALS_DATA_SOURCE === 'db' ? 'db' : 'sheets';
}

export async function fetchDealsForPublic(): Promise<Deal[]> {
  if (dealsSource() === 'db') {
    const pool = getDbPool();
    return await fetchDealsFromDb(pool, { includePrivate: false });
  }
  return await fetchDealsFromSheet({ includePrivate: false });
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

