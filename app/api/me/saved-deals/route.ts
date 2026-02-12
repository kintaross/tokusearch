import { NextRequest, NextResponse } from 'next/server';
import { getSessionForMe } from '@/lib/me-auth';
import { getDbPool } from '@/lib/db';
import * as dbMe from '@/lib/db-me';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const pool = getDbPool();
    const dealIds = await dbMe.getSavedDeals(pool, session.id);
    return NextResponse.json({ dealIds });
  } catch (e) {
    console.error('GET /api/me/saved-deals', e);
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const dealId = typeof body.dealId === 'string' ? body.dealId : null;
    if (!dealId) {
      return NextResponse.json({ error: 'dealId を指定してください' }, { status: 400 });
    }
    const pool = getDbPool();
    await dbMe.addSavedDeal(pool, session.id, dealId);
    return NextResponse.json({ success: true, dealId });
  } catch (e) {
    console.error('POST /api/me/saved-deals', e);
    return NextResponse.json({ error: '追加に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  const dealId = request.nextUrl.searchParams.get('dealId');
  if (!dealId) {
    return NextResponse.json({ error: 'dealId を指定してください' }, { status: 400 });
  }
  try {
    const pool = getDbPool();
    await dbMe.removeSavedDeal(pool, session.id, dealId);
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/me/saved-deals', e);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
}
