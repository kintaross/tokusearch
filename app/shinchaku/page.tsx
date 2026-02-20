import { fetchDealsForPublic } from '@/lib/deals-data';
import DealCard from '@/components/DealCard';
import { getTodayNewDeals } from '@/lib/home-utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ShinchakuPage() {
  const deals = await fetchDealsForPublic();
  
  // 過去24時間の新着を全件取得（limitなし）
  const newDeals = getTodayNewDeals(deals, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fffbf5] via-white to-[#fff8ed]">
      {/* ヘッダー */}
      <header className="bg-white border-b border-[#ebe7df] sticky top-0 z-10 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="text-brand-600 hover:text-brand-700 transition-colors"
            >
              ← TOPへ戻る
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-brand-600 to-brand-400 bg-clip-text text-transparent">
              新着お得情報
            </h1>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            過去24時間以内に追加されたお得情報
          </p>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-6 md:py-10">
        {newDeals.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-gray-600 text-lg">
              過去24時間以内に追加された新着情報はありません
            </p>
            <Link 
              href="/"
              className="inline-block mt-6 px-6 py-3 bg-brand-500 text-white rounded-full font-semibold hover:bg-brand-600 transition-colors"
            >
              TOPページへ戻る
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h2 className="text-lg md:text-xl font-bold text-[#0f1419] mb-2">
                全{newDeals.length}件の新着情報
              </h2>
              <p className="text-sm text-gray-600">
                新しい順に表示しています
              </p>
            </div>
            
            <div className="space-y-4">
              {newDeals.map((deal) => (
                <DealCard key={deal.id} deal={deal} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}

