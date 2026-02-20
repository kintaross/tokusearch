import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { isIngestAuthorized } from '@/lib/ingest-auth';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function PATCH(
  request: NextRequest,
  { params }: { params: { request_id: string } }
) {
  try {
    if (!isIngestAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const requestId = decodeURIComponent(params.request_id);
    const body = await request.json();

    const fields: Array<{ k: string; v: any }> = [];
    const allowed = ['status', 'thread_ts', 'parent_thread_ts'];
    for (const k of allowed) {
      if (body?.[k] !== undefined) fields.push({ k, v: body[k] });
    }
    if (fields.length === 0) return NextResponse.json({ success: true, updated: 0 });

    const set = fields.map((f, idx) => `${f.k} = $${idx + 1}`).join(', ');
    const values = fields.map((f) => f.v);
    values.push(requestId);

    const pool = getDbPool();
    const res = await pool.query(`UPDATE column_requests SET ${set} WHERE request_id = $${values.length}`, values);

    return NextResponse.json({ success: true, updated: res.rowCount });
  } catch (error: any) {
    console.error('Column requests PATCH error:', error);
    return NextResponse.json({ error: error?.message || 'Failed' }, { status: 500 });
  }
}

