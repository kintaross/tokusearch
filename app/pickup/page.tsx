import Link from 'next/link';
import { Metadata } from 'next';
import { fetchDealsForPublic } from '@/lib/deals-data';
import { calculateRemainingDays, getTodayNewDeals } from '@/lib/home-utils';
import { AreaTypeBadge, TargetUserTypeBadge, CategoryBadge } from '@/components/DealBadges';
import { Star, Sparkles, Eye } from 'lucide-react';
import TopViewedDeals from '@/components/TopViewedDeals';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ピックアップ | TokuSearch - 今日の注目お得',
  description: '今特に注目してほしいお得情報をピックアップ。優先度Aランクの厳選キャンペーンをまとめました。',
  openGraph: {
    title: 'ピックアップ | TokuSearch',
    description: '今特に注目してほしいお得情報をピックアップ',
    url: 'https://tokusearch.vercel.app/pickup',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app/pickup',
  },
};

export default async function PickupPage() {
  const allDeals = await fetchDealsForPublic();
  
  // priority=Aの案件を抽出（ピックアップ扱い）
  const pickupDeals = allDeals
    .filter(deal => 
      deal.is_public &&
      deal.priority === 'A' &&
      (!deal.expiration || new Date(deal.expiration) >= new Date())
    )
    .sort((a, b) => b.score - a.score);
  
  // トップ3を大きく表示
  const topDeals = pickupDeals.slice(0, 3);
  // それ以外
  const otherDeals = pickupDeals.slice(3);
  
  // 新着お得（過去24時間、最大10件）
  const newDeals = getTodayNewDeals(allDeals, 10);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
          <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419]">
            ピックアップ
          </h1>
        </div>
        <p className="text-sm md:text-base text-[#4c4f55] mb-4">
          今日の注目お得・特集。迷ったらここから見る！
        </p>
        
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-yellow-600" />
            <p className="text-sm text-yellow-900">
              <span className="font-bold">優先度Aランク</span>の案件を厳選してご紹介します
            </p>
          </div>
        </div>
      </div>

      {pickupDeals.length === 0 ? (
        /* 空状態 */
        <div className="bg-white border border-[#ebe7df] rounded-xl p-12 text-center">
          <div className="text-4xl mb-4">⭐</div>
          <h2 className="text-xl font-bold text-[#0f1419] mb-2">
            現在ピックアップ中のお得はありません
          </h2>
          <p className="text-sm text-[#6b6f76] mb-6">
            新しい注目案件が追加され次第、こちらに表示されます
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-brand-500 text-white rounded-full font-semibold hover:bg-brand-600 transition-colors"
          >
            ホームに戻る
          </Link>
        </div>
      ) : (
        <>
          {/* ビュー数ランキング */}
          <section className="mb-12">
            <h2 className="text-xl md:text-2xl font-bold text-[#0f1419] mb-6 flex items-center gap-2">
              <Eye className="w-6 h-6 text-blue-500" />
              みんなが見ているお得
            </h2>
            <TopViewedDeals deals={allDeals} limit={5} />
          </section>

          {/* トップ3注目案件 */}
          {topDeals.length > 0 && (
            <section className="mb-12">
              <h2 className="text-xl md:text-2xl font-bold text-[#0f1419] mb-6 flex items-center gap-2">
                <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                特に注目のお得 TOP{topDeals.length}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {topDeals.map((deal, index) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="relative bg-white border-2 border-yellow-300 rounded-xl p-6 hover:shadow-xl transition-all group"
                  >
                    {/* ランク番号 */}
                    <div className="absolute top-3 right-3 w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{index + 1}</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mb-3 pr-12">
                      <CategoryBadge category={deal.category_main} />
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        注目
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-bold text-[#0f1419] mb-3 line-clamp-2 group-hover:text-brand-600 transition-colors">
                      {deal.title}
                    </h3>
                    
                    <p className="text-sm text-[#6b6f76] mb-4 line-clamp-3">
                      {deal.summary}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                      {deal.discount_rate && (
                        <span className="font-bold text-brand-600 text-base">{deal.discount_rate}%還元</span>
                      )}
                      {deal.discount_amount && (
                        <span className="font-bold text-green-600 text-base">¥{deal.discount_amount.toLocaleString()}</span>
                      )}
                      {deal.expiration && deal.expiration !== 'null' && deal.expiration.trim() !== '' && (
                        <span className="text-red-600 font-medium">
                          {calculateRemainingDays(deal.expiration)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <AreaTypeBadge areaType={deal.area_type} />
                      <TargetUserTypeBadge targetUserType={deal.target_user_type} />
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        スコア: <span className="font-bold text-gray-700">{deal.score}</span>/100
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

        </>
      )}

      {/* 新着お得セクション */}
      <section className="mt-12">
        <div className="flex items-center gap-3 mb-6">
          <Sparkles className="w-6 h-6 text-brand-500" />
          <h2 className="text-2xl font-bold text-[#0f1419]">
            新着お得情報
          </h2>
        </div>
        
        {newDeals.length === 0 ? (
          <div className="bg-white border border-[#ebe7df] rounded-xl p-8 text-center">
            <p className="text-gray-600">現在、新着情報はありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {newDeals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="block bg-white border border-[#ebe7df] rounded-xl p-4 hover:shadow-md transition-shadow group"
              >
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <CategoryBadge category={deal.category_main} />
                  {deal.priority === 'A' && (
                    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                      注目
                    </span>
                  )}
                </div>
                
                <h3 className="text-base font-bold text-[#0f1419] mb-2 line-clamp-2 group-hover:text-brand-600 transition-colors">
                  {deal.title}
                </h3>
                
                <p className="text-sm text-[#6b6f76] mb-3 line-clamp-2">
                  {deal.summary}
                </p>
                
                {deal.expiration && deal.expiration !== 'null' && deal.expiration.trim() !== '' && (
                  <div className="flex items-center gap-1.5 text-xs text-gray-600">
                    <span>⏰</span>
                    <span>{calculateRemainingDays(deal.expiration)}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* その他のピックアップ */}
      {pickupDeals.length > 0 && otherDeals.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl md:text-2xl font-bold text-[#0f1419] mb-6">
            その他のピックアップ ({otherDeals.length}件)
          </h2>
          
          <div className="space-y-4">
            {otherDeals.map((deal) => (
              <Link
                key={deal.id}
                href={`/deals/${deal.id}`}
                className="block bg-white border border-[#ebe7df] rounded-xl p-5 hover:shadow-md hover:border-yellow-300 transition-all group"
              >
                <div className="flex flex-wrap gap-2 mb-3">
                  <CategoryBadge category={deal.category_main} />
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                    注目
                  </span>
                </div>
                
                <h3 className="text-base md:text-lg font-bold text-[#0f1419] mb-2 group-hover:text-brand-600 transition-colors">
                  {deal.title}
                </h3>
                
                <p className="text-sm text-[#6b6f76] mb-3 line-clamp-2">
                  {deal.summary}
                </p>
                
                <div className="flex flex-wrap items-center gap-3 text-sm mb-3">
                  {deal.discount_rate && (
                    <span className="font-bold text-brand-600">{deal.discount_rate}%還元</span>
                  )}
                  {deal.discount_amount && (
                    <span className="font-bold text-green-600">¥{deal.discount_amount.toLocaleString()}</span>
                  )}
                  {deal.expiration && deal.expiration !== 'null' && deal.expiration.trim() !== '' && (
                    <span className="text-red-600 font-medium">
                      {calculateRemainingDays(deal.expiration)}
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    スコア: <span className="font-semibold">{deal.score}</span>
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <AreaTypeBadge areaType={deal.area_type} />
                  <TargetUserTypeBadge targetUserType={deal.target_user_type} />
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ホームへ戻るリンク */}
      <div className="mt-10 text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-brand-600 hover:text-brand-700 font-semibold"
        >
          ← ホームに戻る
        </Link>
      </div>
    </div>
  );
}

