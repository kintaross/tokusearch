import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { isIngestAuthorized } from '@/lib/ingest-auth';
import { applyInlineImagesToMarkdown } from '@/lib/column-image-markers';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function requireApiKey(request: NextRequest) {
  if (!isIngestAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

type Body = {
  column_id?: string;
  columnId?: string;
  thumbnail_url?: string;
  thumbnailUrl?: string;
  inline_images?: Array<{ description?: string; url?: string }>;
  inlineImages?: Array<{ description?: string; url?: string }>;
};

export async function POST(request: NextRequest) {
  try {
    const unauthorized = requireApiKey(request);
    if (unauthorized) return unauthorized;

    const body = (await request.json()) as Body;
    const columnId = String(body?.column_id ?? body?.columnId ?? '').trim();
    if (!columnId) return NextResponse.json({ error: 'column_id is required' }, { status: 400 });

    const thumbnailUrl = String(body?.thumbnail_url ?? body?.thumbnailUrl ?? '').trim();
    const inline = (Array.isArray(body?.inline_images) ? body.inline_images : body?.inlineImages) || [];
    const inlineImages = (Array.isArray(inline) ? inline : [])
      .map((x) => ({ description: String(x?.description ?? '').trim(), url: String(x?.url ?? '').trim() }))
      .filter((x) => x.description && x.url);

    const pool = getDbPool();
    const { rows } = await pool.query(
      `
      SELECT id, content_markdown, thumbnail_url
      FROM columns
      WHERE id = $1
      LIMIT 1
      `,
      [columnId]
    );

    const row = rows[0];
    if (!row) return NextResponse.json({ error: 'Column not found' }, { status: 404 });

    const currentMarkdown = String(row.content_markdown ?? '');
    const currentThumb = String(row.thumbnail_url ?? '');

    const applied = applyInlineImagesToMarkdown(currentMarkdown, inlineImages);
    const nextMarkdown = applied.content_markdown;

    const updates: Array<{ key: string; value: any }> = [];
    if (thumbnailUrl) updates.push({ key: 'thumbnail_url', value: thumbnailUrl });
    if (inlineImages.length > 0 && nextMarkdown !== currentMarkdown) updates.push({ key: 'content_markdown', value: nextMarkdown });

    // No-op
    if (updates.length === 0) {
      return NextResponse.json({
        success: true,
        updated: false,
        column_id: columnId,
        thumbnail_url: currentThumb,
        replaced_inline_markers: 0,
        message: 'No updates to apply',
      });
    }

    const setParts: string[] = [];
    const values: any[] = [];
    let i = 1;
    for (const u of updates) {
      setParts.push(`${u.key} = $${i++}`);
      values.push(u.value);
    }
    setParts.push(`updated_at = NOW()`);
    values.push(columnId);

    const res = await pool.query(
      `
      UPDATE columns
      SET ${setParts.join(', ')}
      WHERE id = $${i}
      RETURNING id, slug, title, thumbnail_url, status, updated_at
      `,
      values
    );

    return NextResponse.json({
      success: true,
      updated: true,
      column_id: columnId,
      thumbnail_url: res.rows[0]?.thumbnail_url ?? thumbnailUrl ?? currentThumb,
      replaced_inline_markers: applied.replacedCount,
      column: res.rows[0] ?? null,
    });
  } catch (error: any) {
    console.error('Ingest columns-images apply error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to apply images' }, { status: 500 });
  }
}

