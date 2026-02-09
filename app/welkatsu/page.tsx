import Link from 'next/link';
import { Metadata } from 'next';
import { fetchDealsForPublic } from '@/lib/deals-data';
import { isWelkatsuPeriod, getTodayString, calculateRemainingDays } from '@/lib/home-utils';
import { AreaTypeBadge, TargetUserTypeBadge, CategoryBadge } from '@/components/DealBadges';
import { ShoppingBag, Calendar, Archive } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'ウエル活 | TokuSearch',
  description: '毎月20日のウエル活向けお得情報をまとめてチェック。ウエルシアでのポイント活用術やキャンペーン情報。',
  openGraph: {
    title: 'ウエル活 | TokuSearch',
    description: '毎月20日のウエル活向けお得情報',
    url: 'https://tokusearch.vercel.app/welkatsu',
  },
  alternates: {
    canonical: 'https://tokusearch.vercel.app/welkatsu',
  },
};

export default async function WelkatsuPage() {
  const allDeals = await fetchDealsForPublic();
  const today = getTodayString();
  const isActive = isWelkatsuPeriod();
  
  // 今月（当月1-20日）の日付
  const currentMonth = new Date().toLocaleDateString('ja-JP', { year: 'numeric', month: 'long' });
  const welkatsuDay = `${new Date().getFullYear()}年${new Date().getMonth() + 1}月20日`;
  
  // ウエル活案件を抽出（当月のみ）
  const welkatsuDeals = allDeals.filter(deal => {
    if (!deal.is_public || !deal.is_welkatsu) return false;
    
    // expiration が当月1-20日の範囲に含まれるもの
    if (deal.expiration) {
      const expirationDate = new Date(deal.expiration);
      const currentYear = new Date().getFullYear();
      const currentMonthNum = new Date().getMonth();
      
      if (
        expirationDate.getFullYear() === currentYear &&
        expirationDate.getMonth() === currentMonthNum &&
        expirationDate.getDate() >= 1 &&
        expirationDate.getDate() <= 20
      ) {
        return true;
      }
    }
    
    // または、created_at/date が当月のもの
    const dealDate = new Date(deal.date || deal.created_at);
    if (
      dealDate.getFullYear() === new Date().getFullYear() &&
      dealDate.getMonth() === new Date().getMonth()
    ) {
      return true;
    }
    
    return false;
  });
  
  // 優先度順にソート
  const sortedDeals = welkatsuDeals.sort((a, b) => {
    const priorityOrder = { A: 1, B: 2, C: 3 };
    const priorityA = priorityOrder[a.priority];
    const priorityB = priorityOrder[b.priority];
    if (priorityA !== priorityB) return priorityA - priorityB;
    
    return b.score - a.score;
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ヘッダー */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <ShoppingBag className="w-8 h-8 text-purple-600" />
          <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419]">
            ウエル活
          </h1>
        </div>
        <p className="text-sm md:text-base text-[#4c4f55] mb-4">
          毎月20日はウエルシアでポイント1.5倍！ウエル活向けのキャンペーン情報をまとめました。
        </p>
        
        {/* 今月のウエル活デー */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <div className="text-sm font-semibold text-purple-900">今月のウエル活デー</div>
          </div>
          <div className="text-2xl font-bold text-purple-700">{welkatsuDay}</div>
          <div className="text-xs text-purple-600 mt-1">本日：{today}</div>
        </div>
      </div>

      {/* メインコンテンツ */}
      {isActive ? (
        <>
          {/* ウエル活期間中（1-20日） */}
          <section className="mb-8">
            <h2 className="text-xl md:text-2xl font-bold text-[#0f1419] mb-4">
              {currentMonth}のウエル活向けキャンペーン ({sortedDeals.length}件)
            </h2>
            
            {sortedDeals.length === 0 ? (
              <div className="bg-white border border-[#ebe7df] rounded-xl p-8 text-center">
                <p className="text-[#6b6f76] mb-2">現在、ウエル活向けのキャンペーン情報はありません</p>
                <p className="text-xs text-[#6b6f76]">新しい情報が追加され次第、こちらに表示されます</p>
              </div>
            ) : (
              <div className="space-y-4">
                {sortedDeals.map((deal) => (
                  <Link
                    key={deal.id}
                    href={`/deals/${deal.id}`}
                    className="block bg-white border-2 border-purple-200 rounded-xl p-5 hover:shadow-lg transition-shadow group"
                  >
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="px-2.5 py-1 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                        ウエル活
                      </span>
                      <CategoryBadge category={deal.category_main} />
                      {deal.priority === 'A' && (
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                          注目
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-base md:text-lg font-bold text-[#0f1419] mb-2 group-hover:text-brand-600 transition-colors">
                      {deal.title}
                    </h3>
                    
                    <p className="text-sm text-[#6b6f76] mb-3 line-clamp-2">
                      {deal.summary}
                    </p>
                    
                    <div className="flex flex-wrap items-center gap-2 text-sm mb-3">
                      {deal.discount_rate && (
                        <span className="font-bold text-brand-600">{deal.discount_rate}%還元</span>
                      )}
                      {deal.discount_amount && (
                        <span className="font-bold text-green-600">¥{deal.discount_amount.toLocaleString()}</span>
                      )}
                      {deal.expiration && (
                        <span className="text-red-600 font-medium">
                          {calculateRemainingDays(deal.expiration)}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                      <AreaTypeBadge areaType={deal.area_type} />
                      <TargetUserTypeBadge targetUserType={deal.target_user_type} />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </>
      ) : (
        <>
          {/* ウエル活期間外（21日以降） */}
          <div className="bg-white border border-[#ebe7df] rounded-xl p-8 text-center mb-8">
            <div className="text-4xl mb-4">📅</div>
            <h2 className="text-xl font-bold text-[#0f1419] mb-2">
              今月のウエル活情報は終了しました
            </h2>
            <p className="text-sm text-[#6b6f76] mb-4">
              次回は来月1日〜20日に更新されます
            </p>
            <div className="text-xs text-[#6b6f76]">
              毎月20日がウエルシアのポイント1.5倍デーです
            </div>
          </div>
        </>
      )}

      {/* 過去アーカイブへのリンク */}
      <section className="bg-gray-50 border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Archive className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-bold text-[#0f1419]">過去のウエル活情報</h3>
        </div>
        <p className="text-sm text-[#6b6f76] mb-4">
          過去のウエル活キャンペーン情報をご覧になれます
        </p>
        <Link
          href="/welkatsu/archive"
          className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors text-sm"
        >
          <Archive className="w-4 h-4" />
          アーカイブを見る
        </Link>
      </section>

      {/* ホームへ戻るリンク */}
      <div className="mt-8 text-center">
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

