import { NextRequest, NextResponse } from 'next/server';
import { fetchDealsFromSheet } from '@/lib/sheets';
import { getDbPool } from '@/lib/db';
import { upsertDeals } from '@/lib/db-deals';
import { Deal } from '@/types/deal';

export const dynamic = 'force-dynamic';

function pickLatestPerId(deals: Deal[]): { latest: Deal[]; duplicates: Record<string, number> } {
  const map = new Map<string, Deal>();
  const counts: Record<string, number> = {};

  const asTime = (d: Deal) => {
    const u = new Date(d.updated_at || '').getTime();
    if (!Number.isNaN(u) && u > 0) return u;
    const c = new Date(d.created_at || '').getTime();
    if (!Number.isNaN(c) && c > 0) return c;
    const dt = new Date(d.date || '').getTime();
    if (!Number.isNaN(dt) && dt > 0) return dt;
    return 0;
  };

  for (const deal of deals) {
    const id = deal.id;
    if (!id) continue;
    counts[id] = (counts[id] || 0) + 1;

    const prev = map.get(id);
    if (!prev) {
      map.set(id, deal);
      continue;
    }

    if (asTime(deal) >= asTime(prev)) {
      map.set(id, deal);
    }
  }

  const duplicates: Record<string, number> = {};
  for (const [id, c] of Object.entries(counts)) {
    if (c > 1) duplicates[id] = c;
  }

  return { latest: Array.from(map.values()), duplicates };
}

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key') || '';
    if (!process.env.DB_SYNC_API_KEY || apiKey !== process.env.DB_SYNC_API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const allDeals = await fetchDealsFromSheet();
    const { latest, duplicates } = pickLatestPerId(allDeals);

    const pool = getDbPool();
    const { upserted } = await upsertDeals(pool, latest);

    return NextResponse.json({
      success: true,
      sourceCount: allDeals.length,
      uniqueCount: latest.length,
      upserted,
      duplicateIds: Object.keys(duplicates).length,
      duplicateSample: Object.entries(duplicates).slice(0, 50),
    });
  } catch (error: any) {
    console.error('DB sync error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to sync deals to DB' },
      { status: 500 }
    );
  }
}

