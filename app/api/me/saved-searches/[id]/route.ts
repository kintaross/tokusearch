import { NextRequest, NextResponse } from 'next/server';
import { getSessionForMe } from '@/lib/me-auth';
import { getDbPool } from '@/lib/db';
import * as dbMe from '@/lib/db-me';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data: { name?: string; query_json?: Record<string, unknown> } = {};
    if (typeof body.name === 'string') data.name = body.name;
    if (body.query_json && typeof body.query_json === 'object') data.query_json = body.query_json;
    const pool = getDbPool();
    const { id } = await context.params;
    const ok = await dbMe.updateSavedSearch(pool, session.id, id, data);
    if (!ok) {
      return NextResponse.json({ error: '見つかりません' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PUT /api/me/saved-searches/[id]', e);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const pool = getDbPool();
    const { id } = await context.params;
    const ok = await dbMe.deleteSavedSearch(pool, session.id, id);
    if (!ok) {
      return NextResponse.json({ error: '見つかりません' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/me/saved-searches/[id]', e);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
}
