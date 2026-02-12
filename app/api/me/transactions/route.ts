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
    const dealId = searchParams.get('dealId') ?? undefined;
    const from = searchParams.get('from') ?? undefined;
    const to = searchParams.get('to') ?? undefined;
    const pool = getDbPool();
    const list = await dbMe.getTransactions(pool, session.id, { dealId, from, to });
    return NextResponse.json({ transactions: list });
  } catch (e) {
    console.error('GET /api/me/transactions', e);
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
    const occurred_on =
      typeof body.occurred_on === 'string' ? body.occurred_on : new Date().toISOString().slice(0, 10);
    const direction = body.direction === 'in' || body.direction === 'out' ? body.direction : 'out';
    const value_type =
      body.value_type === 'cash' || body.value_type === 'points' || body.value_type === 'other'
        ? body.value_type
        : 'other';
    const amount = typeof body.amount === 'number' ? body.amount : 0;
    const status =
      body.status === 'pending' || body.status === 'confirmed' ? body.status : 'pending';
    const deal_id = body.deal_id != null ? (body.deal_id as string) : undefined;
    const memo = body.memo != null ? (body.memo as string) : undefined;
    const pool = getDbPool();
    const tx = await dbMe.createTransaction(pool, session.id, {
      deal_id,
      occurred_on,
      direction,
      value_type,
      amount,
      status,
      memo,
    });
    return NextResponse.json(tx);
  } catch (e) {
    console.error('POST /api/me/transactions', e);
    return NextResponse.json({ error: '登録に失敗しました' }, { status: 500 });
  }
}
