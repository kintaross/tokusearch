import { NextRequest, NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';
import { isIngestAuthorized } from '@/lib/ingest-auth';
import {
  extractImageMarkers,
  autoInsertImageMarkers,
  needsThumbnail,
  buildThumbnailPrompt,
  buildInlinePrompt,
} from '@/lib/column-image-markers';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function requireApiKey(request: NextRequest) {
  if (!isIngestAuthorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  return null;
}

type Row = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  content_markdown: string | null;
  category: string | null;
  tags: string | null;
  thumbnail_url: string | null;
  status: string | null;
  published_at: string | null;
  created_at: string | null;
};

function toIsoOrEmpty(s: any): string {
  if (!s) return '';
  try {
    const d = new Date(s);
    return Number.isNaN(d.getTime()) ? '' : d.toISOString();
  } catch {
    return '';
  }
}

export async function GET(request: NextRequest) {
  try {
    const unauthorized = requireApiKey(request);
    if (unauthorized) return unauthorized;

    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, Math.min(3, parseInt(searchParams.get('limit') || '1', 10) || 1));
    const maxInlinePerArticle = Math.max(0, Math.min(10, parseInt(searchParams.get('max_inline') || '6', 10) || 6));

    const pool = getDbPool();

    // Pick articles that need any images:
    // - thumbnail_url missing/legacy placeholder
    // - or markdown still contains [IMAGE: ...]
    //
    // Note: We do not hard-lock records here (no extra columns/table).
    // n8n should run sequentially (e.g. 3 times/day) to avoid duplicates.
    const { rows } = await pool.query<Row>(
      `
      SELECT
        id, slug, title, description, content_markdown, category, tags, thumbnail_url,
        status, published_at, created_at
      FROM columns
      WHERE status = 'published'
        AND (
          thumbnail_url IS NULL OR btrim(thumbnail_url) = '' OR thumbnail_url LIKE '%placehold.co%'
          OR content_markdown LIKE '%[IMAGE:%'
          OR (
            content_markdown IS NOT NULL
            AND btrim(content_markdown) <> ''
            AND content_markdown NOT LIKE '%![%](http%'
          )
        )
      ORDER BY COALESCE(published_at, created_at) DESC NULLS LAST
      LIMIT $1
      `,
      [limit]
    );

    const items = await Promise.all(rows.map(async (r) => {
      let content_markdown = String(r.content_markdown ?? '');
      let markersAll = extractImageMarkers(content_markdown, { maxMarkers: 50, contextSpanChars: 260 });

      // ----- Auto-insert markers for articles that don't have [IMAGE:] -----
      // This enables inline-image generation for older articles whose
      // generation prompt did not include the marker instruction, or where
      // Gemini simply omitted them.
      if (markersAll.length === 0) {
        const auto = autoInsertImageMarkers(content_markdown, { maxMarkers: maxInlinePerArticle });
        if (auto.inserted > 0) {
          await pool.query(
            'UPDATE columns SET content_markdown = $1, updated_at = NOW() WHERE id = $2',
            [auto.content_markdown, r.id],
          );
          content_markdown = auto.content_markdown;
          markersAll = extractImageMarkers(content_markdown, { maxMarkers: 50, contextSpanChars: 260 });
        }
      }
      // -------------------------------------------------------------------

      const markers = markersAll.slice(0, maxInlinePerArticle);

      const thumbnailNeeded = needsThumbnail(r.thumbnail_url);
      const thumbnail_prompt = thumbnailNeeded ? buildThumbnailPrompt({ title: r.title, category: r.category ?? undefined }) : '';

      const inline = markers.map((m) => ({
        description: m.description,
        kind: m.kind,
        h2: m.h2,
        contextSnippet: m.contextSnippet,
        prompt: buildInlinePrompt({
          columnTitle: r.title,
          category: r.category ?? undefined,
          marker: m,
        }),
      }));

      return {
        id: r.id,
        slug: r.slug,
        title: r.title,
        category: r.category ?? '',
        tags: r.tags ?? '',
        description: r.description ?? '',
        published_at: toIsoOrEmpty(r.published_at),
        created_at: toIsoOrEmpty(r.created_at),
        thumbnail: {
          needs_generation: thumbnailNeeded,
          current_url: r.thumbnail_url ?? '',
          prompt: thumbnail_prompt,
        },
        inline: {
          total_markers_found: markersAll.length,
          markers_returned: inline.length,
          items: inline,
        },
      };
    }));

    return NextResponse.json({ success: true, count: items.length, items });
  } catch (error: any) {
    console.error('Ingest columns-images next error:', error);
    return NextResponse.json({ error: error?.message || 'Failed to pick next columns' }, { status: 500 });
  }
}

