'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Deal } from '@/types/deal';
import { getTopViewedDeals, getViewCounts } from '@/lib/storage';
import { TrendingUp } from 'lucide-react';

interface PopularDealsClientProps {
  allDeals: Deal[];
}

export default function PopularDealsClient({ allDeals }: PopularDealsClientProps) {
  const [popularDeals, setPopularDeals] = useState<Deal[]>([]);

  useEffect(() => {
    const dealIds = allDeals.map(d => d.id);
    const topViewedIds = getTopViewedDeals(dealIds, 5);
    const popular = topViewedIds
      .map(id => allDeals.find(d => d.id === id))
      .filter((d): d is Deal => d !== undefined);
    
    const counts = getViewCounts();
    if (popular.length === 0 || popular.every(d => (counts[d.id]?.count || 0) === 0)) {
      const sortedByScore = [...allDeals]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      setPopularDeals(sortedByScore);
    } else {
      setPopularDeals(popular);
    }
  }, [allDeals]);

  if (popularDeals.length === 0) return null;

  return (
    <section className="bg-white border border-[#ebe7df] rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4 text-sm font-semibold text-[#0f1419]">
        <TrendingUp size={18} />
        人気のお得情報
      </div>
      <ol className="space-y-4">
        {popularDeals.map((deal, index) => (
          <li key={deal.id} className="flex gap-3 text-sm">
            <span className="text-[#b3b0a6] font-semibold">{String(index + 1).padStart(2, '0')}</span>
            <div className="flex-1 space-y-1">
              <Link href={`/deals/${deal.id}`} className="font-semibold text-[#0f1419] hover:text-brand-500 transition-colors line-clamp-2">
                {deal.title}
              </Link>
              <p className="text-xs text-[#6b6f76]">{deal.category_main}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
