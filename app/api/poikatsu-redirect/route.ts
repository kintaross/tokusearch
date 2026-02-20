import { NextRequest, NextResponse } from 'next/server';
import { replaceAffiliateLink } from '@/lib/poikatsu-affiliate';

export const dynamic = 'force-dynamic';

/**
 * アフィリエイトリンクをリダイレクトするAPI
 * ユーザーには元のURLを表示し、実際にはアフィリエイトIDが置き換えられたURLにリダイレクト
 * 
 * クエリパラメータ:
 * - url: リダイレクト先の元のURL
 * - site: ポイ活サイト名
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const originalUrl = searchParams.get('url');
  const siteName = searchParams.get('site');

  if (!originalUrl) {
    return NextResponse.json(
      { error: 'URLパラメータが必要です' },
      { status: 400 }
    );
  }

  if (!siteName) {
    return NextResponse.json(
      { error: 'siteパラメータが必要です' },
      { status: 400 }
    );
  }

  try {
    // オープンリダイレクト対策:
    // - 入力URLは「どこ得？」のリンク (`https://dokotoku.jp/link/...`) のみに限定
    let parsed: URL;
    try {
      parsed = new URL(originalUrl);
    } catch {
      return NextResponse.json({ error: 'URLパラメータが不正です' }, { status: 400 });
    }
    if (parsed.protocol !== 'https:') {
      return NextResponse.json({ error: 'https のURLのみ許可されています' }, { status: 400 });
    }
    if (parsed.username || parsed.password) {
      return NextResponse.json({ error: 'URLに認証情報を含めることはできません' }, { status: 400 });
    }
    if (parsed.hostname !== 'dokotoku.jp' || !parsed.pathname.startsWith('/link/')) {
      return NextResponse.json(
        { error: '許可されていないURLです（dokotoku.jp/link のみ）' },
        { status: 400 }
      );
    }

    // アフィリエイトリンクを置き換え
    const affiliateUrl = await replaceAffiliateLink(originalUrl, siteName);

    if (!affiliateUrl) {
      return NextResponse.json(
        { error: 'アフィリエイトリンクの生成に失敗しました（紹介ID未設定の可能性があります）' },
        { status: 400 }
      );
    }

    // 出力URLも安全性チェック（https のみ）
    const out = new URL(affiliateUrl);
    if (out.protocol !== 'https:' || out.username || out.password) {
      return NextResponse.json({ error: '生成されたURLが不正です' }, { status: 500 });
    }

    // 置き換え後のURLにリダイレクト
    return NextResponse.redirect(affiliateUrl, { status: 302 });
  } catch (error) {
    console.error('リダイレクトエラー:', error);
    return NextResponse.json({ error: 'リダイレクトに失敗しました' }, { status: 500 });
  }
}


