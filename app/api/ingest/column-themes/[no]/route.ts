import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

function authOk(req: NextRequest): boolean {
  const apiKey = req.headers.get('x-api-key') || '';
  const expected = process.env.N8N_API_KEY || process.env.N8N_INGEST_API_KEY;
  return !!expected && apiKey === expected;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { no: string } }
) {
  try {
    if (!authOk(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const no = parseInt(params.no, 10);
    if (!Number.isFinite(no)) {
      return NextResponse.json({ error: 'Invalid no' }, { status: 400 });
    }

    const body = await request.json();
    const used = body?.used === true;
    const usedAt = body?.used_at ? new Date(body.used_at).toISOString() : new Date().toISOString();

    const pool = getDbPool();
    const res = await pool.query(
      `
      UPDATE column_themes
      SET used = $1, used_at = $2
      WHERE no = $3
      `,
      [used, usedAt, no]
    );

    return NextResponse.json({ success: true, updated: res.rowCount });
  } catch (error: any) {
    console.error('Column themes PATCH error:', error);
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}

