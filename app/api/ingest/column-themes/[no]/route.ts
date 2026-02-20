import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { isIngestAuthorized } from '@/lib/ingest-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { no: string } }
) {
  try {
    if (!isIngestAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

