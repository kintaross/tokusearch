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
    const dealIds = await dbMe.getFavorites(pool, session.id);
    return NextResponse.json({ dealIds });
  } catch (e) {
    console.error('GET /api/me/favorites', e);
    return NextResponse.json({ error: '取得に失敗しました' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const dealIds = Array.isArray(body.dealIds) ? body.dealIds : [];
    if (!dealIds.every((id: unknown) => typeof id === 'string')) {
      return NextResponse.json({ error: 'dealIds は文字列の配列で指定してください' }, { status: 400 });
    }
    const pool = getDbPool();
    await dbMe.setFavorites(pool, session.id, dealIds);
    return NextResponse.json({ dealIds });
  } catch (e) {
    console.error('PUT /api/me/favorites', e);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}
