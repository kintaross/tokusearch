import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const apiKey = request.headers.get('x-api-key') || '';
    const expected = process.env.N8N_API_KEY || process.env.N8N_INGEST_API_KEY;
    if (!expected || apiKey !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const daysRaw = searchParams.get('days') || '7';
    const days = Math.max(1, Math.min(30, parseInt(daysRaw, 10) || 7));

    const pool = getDbPool();
    const { rows } = await pool.query(
      `
      SELECT
        id, date, title, summary, detail, steps, service, expiration, conditions, notes,
        category_main, category_sub, is_public, priority, discount_rate, discount_amount, score,
        created_at, updated_at, difficulty, area_type, target_user_type, usage_type, is_welkatsu, tags
      FROM deals
      WHERE
        created_at >= (NOW() - ($1::int * INTERVAL '1 day'))
        OR updated_at >= (NOW() - ($1::int * INTERVAL '1 day'))
      ORDER BY GREATEST(created_at, updated_at) DESC
      LIMIT 2000
      `,
      [days]
    );

    return NextResponse.json({ days, deals: rows });
  } catch (error: any) {
    console.error('Ingest recent deals error:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to fetch recent deals' },
      { status: 500 }
    );
  }
}

