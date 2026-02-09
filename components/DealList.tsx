'use client';

import { useState } from 'react';
import DealCard from './DealCard';
import { Deal } from '@/types/deal';
import { Loader2, ArrowDown } from 'lucide-react';
import { useViewMode } from '@/contexts/ViewModeContext';

interface DealListProps {
  initialDeals: Deal[];
  initialNextCursor?: string;
}

export default function DealList({ initialDeals, initialNextCursor }: DealListProps) {
  const [deals, setDeals] = useState<Deal[]>(initialDeals);
  const [nextCursor, setNextCursor] = useState<string | undefined>(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const { viewMode } = useViewMode();

  const loadMore = async () => {
    if (!nextCursor || loading) return;

    setLoading(true);
    try {
      const params = new URLSearchParams(window.location.search);
      params.set('cursor', nextCursor);
      const response = await fetch(`/api/deals?${params.toString()}`);
      const data = await response.json();
      
      setDeals(prev => [...prev, ...data.deals]);
      setNextCursor(data.pagination.nextCursor);
    } catch (error) {
      console.error('データの読み込みエラー:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-[#ebe7df] rounded-2xl md:rounded-3xl shadow-sm">
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 p-3 md:p-6">
          {deals.map((deal, index) => (
            <div key={deal.id} className="animate-fade-in" style={{ animationDelay: `${index * 0.04}s` }}>
              <DealCard deal={deal} viewMode="grid" compact={false} />
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-[#f2eee4]">
          {deals.map((deal, index) => (
            <div key={deal.id} className="px-4 md:px-6 animate-fade-in" style={{ animationDelay: `${index * 0.04}s` }}>
              <DealCard deal={deal} viewMode="list" />
            </div>
          ))}
        </div>
      )}

      {nextCursor && (
        <div className="text-center px-6 py-8">
          <button
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-full bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin h-5 w-5" />
                <span>読み込み中...</span>
              </>
            ) : (
              <>
                <span>もっと見る</span>
                <ArrowDown className="w-5 h-5" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
