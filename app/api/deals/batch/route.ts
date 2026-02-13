import { NextRequest, NextResponse } from 'next/server';
import { fetchDealsByIds } from '@/lib/deals-data';

/** GET /api/deals/batch?ids=id1,id2,id3 - Fetch deals by ids (for favorites/account). Preserves order. */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const idsParam = searchParams.get('ids');
    const ids = idsParam ? idsParam.split(',').map((s) => s.trim()).filter(Boolean) : [];

    if (ids.length === 0) {
      return NextResponse.json({ deals: [] });
    }

    // Limit to 200 ids to avoid abuse
    const limitedIds = ids.slice(0, 200);
    const deals = await fetchDealsByIds(limitedIds);

    const res = NextResponse.json({ deals });
    res.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
    return res;
  } catch (error) {
    console.error('Batch deals API error:', error);
    return NextResponse.json(
      { error: 'データの取得に失敗しました' },
      { status: 500 }
    );
  }
}
