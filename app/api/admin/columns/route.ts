import { NextRequest, NextResponse } from 'next/server';
import {
  fetchColumnsFromSheet,
  createColumn,
  generateSlug,
} from '@/lib/columns';
import { revalidateColumns } from '@/lib/cache';
import { autoInsertImageMarkers } from '@/lib/column-image-markers';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionValue } from '@/lib/admin-session';
import { getIngestApiKey, isIngestAuthorized } from '@/lib/ingest-auth';

function getAdminSessionFromRequest(request: NextRequest) {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.NEXTAUTH_SECRET || '';
  const value = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || '';
  return verifyAdminSessionValue({ value, secret });
}

// コラム一覧取得（管理者Cookie OR APIキー認証）
export async function GET(request: NextRequest) {
  const session = getAdminSessionFromRequest(request);
  const adminOk = !!session && (session.user.role === 'admin' || session.user.role === 'editor');
  const apiKeyOk = isIngestAuthorized(request);

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || undefined;
  const category = searchParams.get('category') || undefined;
  const titlesOnly = searchParams.get('titles_only') === 'true';

  if (!adminOk && !apiKeyOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // APIキー認証は、重複チェック用途（タイトル一覧）に限定して被害範囲を最小化する
  // - 管理者Cookieなしで詳細（本文など）を返さない
  if (!adminOk && apiKeyOk && !titlesOnly) {
    return NextResponse.json(
      { error: 'Forbidden (titles_only=true is required for API key access)' },
      { status: 403 }
    );
  }

  const columns = await fetchColumnsFromSheet({
    status: status as any,
    category,
  });

  if (titlesOnly) {
    return NextResponse.json(columns.map((c: any) => ({ title: c.title, slug: c.slug })));
  }

  return NextResponse.json(columns);
}

// コラム作成
export async function POST(request: NextRequest) {
  // 認証チェック: 管理者Cookie OR API Key（n8n用）
  const session = getAdminSessionFromRequest(request);
  const apiKey = getIngestApiKey(request);
  
  // 認証チェック（NextAuth または N8N_API_KEY）
  // ※ ここは必ず厳密一致で検証する（誤って第三者が投稿できるのを防ぐ）
  const expected = (process.env.N8N_API_KEY ?? process.env.N8N_INGEST_API_KEY ?? '').trim();
  const apiKeyOk = expected.length > 0 && apiKey === expected;
  const adminOk = !!session && (session.user.role === 'admin' || session.user.role === 'editor');
  if (!adminOk && !apiKeyOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();

    const title = String(body?.title ?? '').trim();
    const description = String(body?.description ?? '').trim();

    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 });
    }

    // [IMAGE:] マーカーが無い記事には自動挿入
    // → 画像バックフィルワークフローがマーカーを検知して画像を生成する
    let content_markdown: string = String(body?.content_markdown ?? '');
    if (!content_markdown.trim()) {
      return NextResponse.json({ error: 'content_markdown is required' }, { status: 400 });
    }
    const autoMarkers = autoInsertImageMarkers(content_markdown);
    if (autoMarkers.inserted > 0) {
      content_markdown = autoMarkers.content_markdown;
      console.log(`📸 [IMAGE:] マーカーを ${autoMarkers.inserted} 箇所自動挿入しました`);
    }

    // マークダウンをHTMLに変換（簡易版、実際にはライブラリ使用推奨）
    const content_html = content_markdown;

    const rawSlug = String(body?.slug ?? '').trim();
    const slug = rawSlug || generateSlug(title);
    if (!slug) {
      return NextResponse.json({ error: 'slug could not be generated from title' }, { status: 400 });
    }

    const newColumn = await createColumn({
      slug,
      title,
      description,
      content_markdown,
      content_html,
      category: body.category || 'その他',
      tags: body.tags || '',
      thumbnail_url: body.thumbnail_url || '',
      author: body.author || session?.user?.name || 'TokuSearch編集部',
      status: body.status || 'draft',
      is_featured: body.is_featured || false,
      view_count: 0,
      published_at: body.status === 'published' ? new Date().toISOString() : '',
    });

    // 公開コラムのキャッシュ(Data Cache + ISRページのFull Route Cache)を即時無効化
    revalidateColumns();

    return NextResponse.json(newColumn, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create column' },
      { status: 500 }
    );
  }
}

