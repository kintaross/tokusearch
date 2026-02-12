import { NextRequest, NextResponse } from 'next/server';
import { getSessionForMe } from '@/lib/me-auth';
import { getDbPool } from '@/lib/db';
import * as dbMe from '@/lib/db-me';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const pool = getDbPool();
    const note = await dbMe.getDealNote(pool, session.id, params.dealId);
    return NextResponse.json({ note: note ?? '' });
  } catch (e) {
    console.error('GET /api/me/deals/[dealId]/note', e);
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { dealId: string } }
) {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const note = typeof body.note === 'string' ? body.note : '';
    const pool = getDbPool();
    await dbMe.setDealNote(pool, session.id, params.dealId, note);
    return NextResponse.json({ note });
  } catch (e) {
    console.error('PUT /api/me/deals/[dealId]/note', e);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}
