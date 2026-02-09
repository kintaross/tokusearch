'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getTopViewedDeals, getViewCount } from '@/lib/storage';
import { Deal } from '@/types/deal';
import { Eye } from 'lucide-react';
import { CategoryBadge } from './DealBadges';
import { calculateRemainingDays } from '@/lib/home-utils';

interface TopViewedDealsProps {
  deals: Deal[];
  limit?: number;
}

export default function TopViewedDeals({ deals, limit = 5 }: TopViewedDealsProps) {
  const [topDeals, setTopDeals] = useState<Deal[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const dealIds = deals.map((d) => d.id);
    const topViewedIds = getTopViewedDeals(dealIds, limit);
    
    const counts: Record<string, number> = {};
    topViewedIds.forEach((id) => {
      counts[id] = getViewCount(id);
    });
    
    const sortedDeals = topViewedIds
      .map((id) => deals.find((d) => d.id === id))
      .filter((d): d is Deal => d !== undefined);
    
    setTopDeals(sortedDeals);
    setViewCounts(counts);
  }, [deals, limit]);

  if (topDeals.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-8 text-center">
        <Eye className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 text-sm">まだ閲覧履歴がありません</p>
        <p className="text-gray-400 text-xs mt-1">お得情報を見るとここに表示されます</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {topDeals.map((deal, index) => (
        <Link
          key={deal.id}
          href={`/deals/${deal.id}`}
          className="block bg-white border border-[#ebe7df] rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all group"
        >
          <div className="flex items-start gap-4">
            {/* ランク番号 */}
            <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">{index + 1}</span>
            </div>

            <div className="flex-1 min-w-0">
              {/* バッジ */}
              <div className="flex flex-wrap gap-2 mb-2">
                <CategoryBadge category={deal.category_main} />
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  {viewCounts[deal.id] || 0}回
                </span>
              </div>

              {/* タイトル */}
              <h3 className="text-base font-bold text-[#0f1419] mb-2 line-clamp-2 group-hover:text-blue-600 transition-colors">
                {deal.title}
              </h3>

              {/* 概要 */}
              <p className="text-sm text-[#6b6f76] mb-2 line-clamp-2">
                {deal.summary}
              </p>

              {/* 割引情報・期限 */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                {deal.discount_rate && (
                  <span className="font-bold text-brand-600">{deal.discount_rate}%還元</span>
                )}
                {deal.discount_amount && (
                  <span className="font-bold text-green-600">¥{deal.discount_amount.toLocaleString()}</span>
                )}
                {deal.expiration && (
                  <span className="text-red-600 font-medium text-xs">
                    {calculateRemainingDays(deal.expiration)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

