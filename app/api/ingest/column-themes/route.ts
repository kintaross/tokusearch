import { NextRequest, NextResponse } from 'next/server'
import { getDbPool } from '@/lib/db'

export const dynamic = 'force-dynamic'

function requireApiKey(request: NextRequest) {
  const apiKey = request.headers.get('x-api-key') || ''
  const expected = process.env.N8N_API_KEY || process.env.N8N_INGEST_API_KEY
  if (!expected || apiKey !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireApiKey(request)
    if (unauthorized) return unauthorized

    const { searchParams } = new URL(request.url)
    const usedParam = (searchParams.get('used') || '').toLowerCase()
    const used = usedParam === 'true' ? true : usedParam === 'false' ? false : undefined
    const limit = Math.max(1, Math.min(1000, parseInt(searchParams.get('limit') || '500', 10) || 500))

    const pool = getDbPool()
    const where = used === undefined ? '' : 'WHERE used = $1'
    const args = used === undefined ? [limit] : [used, limit]
    const { rows } = await pool.query(
      `
      SELECT no, level, theme, used, used_at
      FROM column_themes
      ${where}
      ORDER BY no ASC
      LIMIT $${used === undefined ? 1 : 2}
      `,
      args
    )

    return NextResponse.json({ themes: rows })
  } catch (error: any) {
    console.error('Ingest column_themes GET error:', error)
    return NextResponse.json({ error: error?.message || 'Failed to fetch themes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const unauthorized = requireApiKey(request)
  if (unauthorized) return unauthorized

  const body = await request.json()
  const themes = Array.isArray(body) ? body : Array.isArray(body?.themes) ? body.themes : []

  if (!Array.isArray(themes) || themes.length === 0) {
    return NextResponse.json({ error: 'No themes provided' }, { status: 400 })
  }
  if (themes.length > 1000) {
    return NextResponse.json({ error: 'Too many themes (max 1000)' }, { status: 400 })
  }

  const pool = getDbPool()
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    let upserted = 0
    for (const t of themes) {
      const no = Number(t?.no)
      const theme = String(t?.theme || t?.title || '').trim()
      if (!Number.isFinite(no) || no <= 0 || !theme) continue
      const level = t?.level ? String(t.level) : null
      const used = String(t?.used || '').toUpperCase() === 'TRUE' || t?.used === true
      const usedAt = t?.used_at ? new Date(t.used_at) : null

      await client.query(
        `
        INSERT INTO column_themes (no, level, theme, used, used_at)
        VALUES ($1,$2,$3,$4,$5)
        ON CONFLICT (no) DO UPDATE SET
          level = EXCLUDED.level,
          theme = EXCLUDED.theme,
          used = EXCLUDED.used,
          used_at = EXCLUDED.used_at
        `,
        [no, level, theme, used, usedAt && !Number.isNaN(usedAt.getTime()) ? usedAt.toISOString() : null]
      )
      upserted++
    }

    await client.query('COMMIT')
    return NextResponse.json({ success: true, received: themes.length, upserted })
  } catch (e: any) {
    await client.query('ROLLBACK')
    console.error('Ingest column_themes error:', e)
    return NextResponse.json({ error: e?.message || 'Failed to ingest themes' }, { status: 500 })
  } finally {
    client.release()
  }
}

