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
    // アフィリエイトリンクを置き換え
    const affiliateUrl = await replaceAffiliateLink(originalUrl, siteName);

    if (!affiliateUrl) {
      // 置き換えに失敗した場合は元のURLにリダイレクト
      return NextResponse.redirect(originalUrl, { status: 302 });
    }

    // 置き換え後のURLにリダイレクト
    return NextResponse.redirect(affiliateUrl, { status: 302 });
  } catch (error) {
    console.error('リダイレクトエラー:', error);
    // エラーが発生した場合は元のURLにリダイレクト
    return NextResponse.redirect(originalUrl, { status: 302 });
  }
}


