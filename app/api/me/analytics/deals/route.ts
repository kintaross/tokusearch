import { NextRequest, NextResponse } from 'next/server';
import { getSessionForMe } from '@/lib/me-auth';
import { getDbPool } from '@/lib/db';
import * as dbMe from '@/lib/db-me';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const { searchParams } = request.nextUrl;
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;
    const dealId = searchParams.get('dealId') ?? undefined;
    const pool = getDbPool();
    const summaries = await dbMe.getDealAnalytics(pool, session.id, { from, to, dealId });
    return NextResponse.json({ summaries });
  } catch (e) {
    console.error('GET /api/me/analytics/deals', e);
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
  }
}
