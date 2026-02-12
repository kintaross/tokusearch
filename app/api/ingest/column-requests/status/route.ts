import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { isIngestAuthorized } from '@/lib/ingest-auth';

export const dynamic = 'force-dynamic';

function requireApiKey(request: NextRequest) {
  if (!isIngestAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

export async function POST(request: NextRequest) {
  const unauthorized = requireApiKey(request);
  if (unauthorized) return unauthorized;

  const body = await request.json();
  const requestId = String(body?.request_id || body?.requestId || '').trim();
  const status = String(body?.status || '').trim();
  if (!requestId || !status) {
    return NextResponse.json({ error: 'request_id and status are required' }, { status: 400 });
  }

  const pool = getDbPool();
  await pool.query(`UPDATE column_requests SET status = $2 WHERE request_id = $1`, [requestId, status]);

  return NextResponse.json({ success: true, request_id: requestId, status });
}

