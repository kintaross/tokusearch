import { NextRequest, NextResponse } from 'next/server';
import { filterAndSortDeals, paginateDeals } from '@/lib/sheets';
import { fetchDealsForPublic } from '@/lib/deals-data';
import { DealFilters, SortOption } from '@/types/deal';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // クエリパラメータを取得
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') as DealFilters['period'] | null;
    const category = searchParams.get('category') as DealFilters['category'] | null;
    const search = searchParams.get('search') || undefined;
    const sort = (searchParams.get('sort') as SortOption) || 'default';
    const cursor = searchParams.get('cursor') || undefined;
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // データを取得（Sheets/DBは env で切替）
    const allDeals = await fetchDealsForPublic();

    // フィルタリングとソート
    const filteredDeals = filterAndSortDeals(
      allDeals,
      {
        period: period || undefined,
        category: category || undefined,
        search,
      },
      sort
    );

    // ページネーション
    const { deals, nextCursor } = paginateDeals(filteredDeals, cursor, limit);

    return NextResponse.json({
      deals,
      pagination: {
        nextCursor,
        total: filteredDeals.length,
      },
    });
  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

