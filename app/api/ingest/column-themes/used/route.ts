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
  const no = Number(body?.no);
  const used = body?.used === true || String(body?.used || '').toUpperCase() === 'TRUE';
  const usedAt = body?.used_at ? new Date(body.used_at) : new Date();

  if (!Number.isFinite(no) || no <= 0) {
    return NextResponse.json({ error: 'Invalid no' }, { status: 400 });
  }

  const pool = getDbPool();
  await pool.query(
    `
    UPDATE column_themes
    SET used = $2, used_at = $3
    WHERE no = $1
    `,
    [no, used, usedAt.toISOString()]
  );

  return NextResponse.json({ success: true, no, used, used_at: usedAt.toISOString() });
}

