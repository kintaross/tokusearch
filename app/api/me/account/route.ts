import { NextResponse } from 'next/server';
import { getSessionForMe } from '@/lib/me-auth';
import { getDbPool } from '@/lib/db';
import { deleteUser } from '@/lib/db-users';

export const dynamic = 'force-dynamic';

/**
 * アカウント削除（本人の個人データをすべて削除）
 */
export async function DELETE() {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const pool = getDbPool();
    const ok = await deleteUser(pool, session.id);
    if (!ok) {
      return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/me/account', e);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
}
