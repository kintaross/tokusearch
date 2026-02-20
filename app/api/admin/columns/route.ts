import { NextRequest, NextResponse } from 'next/server';
import {
  fetchColumnsFromSheet,
  createColumn,
  generateSlug,
} from '@/lib/columns';
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

  if (!adminOk && !apiKeyOk) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || undefined;
  const category = searchParams.get('category') || undefined;
  const titlesOnly = searchParams.get('titles_only') === 'true';

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

    // [IMAGE:] マーカーが無い記事には自動挿入
    // → 画像バックフィルワークフローがマーカーを検知して画像を生成する
    let content_markdown: string = body.content_markdown || '';
    const autoMarkers = autoInsertImageMarkers(content_markdown);
    if (autoMarkers.inserted > 0) {
      content_markdown = autoMarkers.content_markdown;
      console.log(`📸 [IMAGE:] マーカーを ${autoMarkers.inserted} 箇所自動挿入しました`);
    }

    // マークダウンをHTMLに変換（簡易版、実際にはライブラリ使用推奨）
    const content_html = content_markdown;

    const slug = body.slug || generateSlug(body.title);

    const newColumn = await createColumn({
      slug,
      title: body.title || '',
      description: body.description || '',
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

    return NextResponse.json(newColumn, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to create column' },
      { status: 500 }
    );
  }
}

