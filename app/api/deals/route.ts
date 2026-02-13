import { NextRequest, NextResponse } from 'next/server';
import { fetchDealsFilteredPublic } from '@/lib/deals-data';
import { DealFilters, SortOption } from '@/types/deal';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') as DealFilters['period'] | null;
    const category = searchParams.get('category') as DealFilters['category'] | null;
    const search = searchParams.get('search') || undefined;
    const sort = (searchParams.get('sort') as SortOption) || 'default';
    const cursor = searchParams.get('cursor') || undefined;
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '20', 10), 1), 100);

    // cursor: offset as string (e.g. "0", "20") for pagination
    const offset = cursor !== undefined && /^\d+$/.test(cursor) ? parseInt(cursor, 10) : 0;

    const { deals, total } = await fetchDealsFilteredPublic({
      period: period || undefined,
      category: category || undefined,
      search,
      sort,
      limit,
      offset,
    });

    const nextOffset = offset + deals.length;
    const nextCursor = nextOffset < total ? String(nextOffset) : undefined;

    const res = NextResponse.json({
      deals,
      pagination: {
        nextCursor,
        total,
      },
    });
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res;
  } catch (error) {
    console.error('APIエラー:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}

