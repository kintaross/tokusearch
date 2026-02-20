import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'
import { isIngestAuthorized } from '@/lib/ingest-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function requireApiKey(request: NextRequest) {
  if (!isIngestAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  return null
}

export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized

    const body = await request.json()
    const requestId = String(body?.request_id || body?.requestId || '').trim()
    if (!requestId) return NextResponse.json({ error: 'request_id is required' }, { status: 400 })

    const now = new Date().toISOString()
    const pool = getDbPool()

    await pool.query(
      `
      INSERT INTO column_requests (
        request_id, source, channel_id, thread_ts, parent_thread_ts,
        original_text, themes_json, status, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
      ON CONFLICT (request_id) DO UPDATE SET
        source = EXCLUDED.source,
        channel_id = EXCLUDED.channel_id,
        thread_ts = EXCLUDED.thread_ts,
        parent_thread_ts = EXCLUDED.parent_thread_ts,
        original_text = EXCLUDED.original_text,
        themes_json = EXCLUDED.themes_json,
        status = EXCLUDED.status,
        created_at = COALESCE(column_requests.created_at, EXCLUDED.created_at)
      `,
      [
        requestId,
        body?.source ?? null,
        body?.channel_id ?? body?.channelId ?? null,
        body?.thread_ts ?? body?.threadTs ?? null,
        body?.parent_thread_ts ?? body?.parentThreadTs ?? null,
        body?.original_text ?? body?.originalText ?? body?.requestText ?? null,
        body?.themes_json ?? body?.themesJson ?? null,
        body?.status ?? 'pending',
        body?.created_at ?? now,
      ]
    )

    return NextResponse.json({ success: true, request_id: requestId })
  } catch (error: any) {
    console.error('Ingest column_requests error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to ingest request' }, { status: 500 })
  }
}

