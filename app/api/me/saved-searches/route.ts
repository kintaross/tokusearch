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
    const list = await dbMe.getSavedSearches(pool, session.id);
    return NextResponse.json({ savedSearches: list });
  } catch (e) {
    console.error('GET /api/me/saved-searches', e);
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
    const name = typeof body.name === 'string' ? body.name : '保存した検索';
    const query_json = body.query_json && typeof body.query_json === 'object' ? body.query_json : {};
    const pool = getDbPool();
    const saved = await dbMe.createSavedSearch(pool, session.id, name, query_json);
    return NextResponse.json(saved);
  } catch (e) {
    console.error('POST /api/me/saved-searches', e);
    return NextResponse.json({ error: '作成に失敗しました' }, { status: 500 });
  }
}
