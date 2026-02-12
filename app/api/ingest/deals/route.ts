import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { upsertDeals } from '@/lib/db-deals';
import { isIngestAuthorized } from '@/lib/ingest-auth';
import { Deal } from '@/types/deal';

export const dynamic = 'force-dynamic';

type IngestBody =
  | Deal
  | Deal[]
  | { deals: Deal | Deal[] }
  | { items: Deal[] };

function normalizeToArray(body: IngestBody): Deal[] {
  if (Array.isArray(body)) return body as Deal[];
  if ((body as any)?.deals) {
    const d = (body as any).deals;
    return Array.isArray(d) ? d : [d];
  }
  if ((body as any)?.items && Array.isArray((body as any).items)) return (body as any).items;
  return [body as Deal];
}

export async function POST(request: NextRequest) {
  try {
    if (!isIngestAuthorized(request)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as IngestBody;
    const deals = normalizeToArray(body);

    if (deals.length === 0) {
      return NextResponse.json({ error: 'No deals provided' }, { status: 400 });
    }

    // safety cap
    if (deals.length > 500) {
      return NextResponse.json({ error: 'Too many deals (max 500)' }, { status: 400 });
    }

    // minimal validation
    const invalid = deals.filter((d) => !d?.id || !d?.title);
    if (invalid.length > 0) {
      return NextResponse.json(
        { error: 'Invalid deal(s): id/title required', invalidCount: invalid.length },
        { status: 400 }
      );
    }

    const pool = getDbPool();
    const { upserted } = await upsertDeals(pool, deals);

    return NextResponse.json({ success: true, received: deals.length, upserted });
  } catch (error: any) {
    console.error('Ingest deals error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to ingest deals' },
      { status: 500 }
    );
  }
}

