import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export const dynamic = 'force-dynamic';

function requireApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || '';
  const expected = process.env.N8N_API_KEY || process.env.N8N_INGEST_API_KEY;
  if (!expected || apiKey !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
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

