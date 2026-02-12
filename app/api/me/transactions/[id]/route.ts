import { NextRequest, NextResponse } from 'next/server';
import { getSessionForMe } from '@/lib/me-auth';
import { getDbPool } from '@/lib/db';
import * as dbMe from '@/lib/db-me';

export const dynamic = 'force-dynamic';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const body = await request.json();
    const data: Parameters<typeof dbMe.updateTransaction>[3] = {};
    if (body.deal_id !== undefined) data.deal_id = body.deal_id;
    if (typeof body.occurred_on === 'string') data.occurred_on = body.occurred_on;
    if (body.direction === 'in' || body.direction === 'out') data.direction = body.direction;
    if (body.value_type === 'cash' || body.value_type === 'points' || body.value_type === 'other')
      data.value_type = body.value_type;
    if (typeof body.amount === 'number') data.amount = body.amount;
    if (body.status === 'pending' || body.status === 'confirmed') data.status = body.status;
    if (body.memo !== undefined) data.memo = body.memo;
    const pool = getDbPool();
    const ok = await dbMe.updateTransaction(pool, session.id, params.id, data);
    if (!ok) {
      return NextResponse.json({ error: '見つかりません' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('PUT /api/me/transactions/[id]', e);
    return NextResponse.json({ error: '更新に失敗しました' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getSessionForMe();
  if (!session) {
    return NextResponse.json({ error: 'ログインが必要です' }, { status: 401 });
  }
  try {
    const pool = getDbPool();
    const ok = await dbMe.deleteTransaction(pool, session.id, params.id);
    if (!ok) {
      return NextResponse.json({ error: '見つかりません' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error('DELETE /api/me/transactions/[id]', e);
    return NextResponse.json({ error: '削除に失敗しました' }, { status: 500 });
  }
}
