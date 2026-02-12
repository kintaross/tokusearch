import { NextRequest, NextResponse } from 'next/server';
import { getSessionForMe } from '@/lib/me-auth';
import { getDbPool } from '@/lib/db';
import * as dbMe from '@/lib/db-me';

export const dynamic = 'force-dynamic';

/**
 * 初回ログイン時: クライアントが localStorage の内容を送り、サーバーと和集合で保存する。
 * 対象: お気に入り (dealIds)。競合時はサーバー既存 + ローカル未登録分を追加。
 */
export async function POST(request: NextRequest) {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const localDealIds: string[] = Array.isArray(body.favoriteDealIds)
      ? body.favoriteDealIds.filter((id: unknown) => typeof id === 'string')
      : [];
    const pool = getDbPool();
    const existing = await dbMe.getFavorites(pool, session.id);
    const merged = [...new Set([...existing, ...localDealIds])];
    await dbMe.setFavorites(pool, session.id, merged);
    return NextResponse.json({ dealIds: merged, migrated: localDealIds.length });
  } catch (e) {
    console.error('POST /api/me/migrate-local', e);
    return NextResponse.json({ error: '取り込みに失敗しました' }, { status: 500 });
  }
}
