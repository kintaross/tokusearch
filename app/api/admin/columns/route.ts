import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import {
  fetchColumnsFromSheet,
  createColumn,
  generateSlug,
} from '@/lib/columns';
import { autoInsertImageMarkers } from '@/lib/column-image-markers';

// コラム一覧取得
export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const status = searchParams.get('status') || undefined;
  const category = searchParams.get('category') || undefined;

  const columns = await fetchColumnsFromSheet({
    status: status as any,
    category,
  });

  return NextResponse.json(columns);
}

// コラム作成
export async function POST(request: NextRequest) {
  // 認証チェック: NextAuth OR API Key（n8n用）
  const session = await getServerSession(authOptions);
  const apiKey = request.headers.get('x-api-key');
  
  // デバッグログ
  console.log('🔑 認証デバッグ:');
  console.log('  - Session:', session ? 'あり' : 'なし');
  console.log('  - 受信APIキー:', apiKey || '(なし)');
  console.log('  - 環境変数APIキー:', process.env.N8N_API_KEY ? `${process.env.N8N_API_KEY.substring(0, 8)}...` : '(未設定)');
  console.log('  - 一致:', apiKey === process.env.N8N_API_KEY);
  
  // 認証チェック（NextAuth または N8N_API_KEY）
  // ※ ここは必ず厳密一致で検証する（誤って第三者が投稿できるのを防ぐ）
  const expected = process.env.N8N_API_KEY || process.env.N8N_INGEST_API_KEY;
  const apiKeyOk = !!expected && apiKey === expected;
  if (!session && !apiKeyOk) {
    console.log('❌ 認証失敗: セッションなし、APIキー不一致');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('✅ 認証成功（セッションまたはAPIキー一致）');

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

