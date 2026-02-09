'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Heart, ArrowLeft } from 'lucide-react';
import DealCard from '@/components/DealCard';
import { Deal } from '@/types/deal';
import { getFavorites } from '@/lib/storage';

export default function FavoritesPage() {
  const [favoriteDeals, setFavoriteDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const favoriteIds = getFavorites();
        
        if (favoriteIds.length === 0) {
          setFavoriteDeals([]);
          setLoading(false);
          return;
        }

        // お気に入りIDリストを使ってデータを取得
        const response = await fetch('/api/deals');
        const data = await response.json();
        
        const filtered = data.deals.filter((deal: Deal) => 
          favoriteIds.includes(deal.id)
        );
        
        setFavoriteDeals(filtered);
      } catch (error) {
        console.error('お気に入りの読み込みエラー:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-12">
      <div className="mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-[#6b6f76] hover:text-[#0f1419] transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          ホームに戻る
        </Link>
        
        <div className="flex items-center gap-3 mb-4">
          <Heart size={28} className="text-brand-500" fill="currentColor" />
          <h1 className="text-3xl md:text-4xl font-semibold text-[#0f1419]">
            お気に入り
          </h1>
        </div>
        
        <p className="text-sm md:text-base text-[#4c4f55]">
          保存したお得情報を一覧で確認できます
        </p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-2 text-[#a9a49a]">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#0f1419] border-t-transparent"></div>
            <span>読み込み中...</span>
          </div>
        </div>
      ) : favoriteDeals.length === 0 ? (
        <div className="bg-white rounded-2xl md:rounded-3xl border border-[#ebe7df] p-12 md:p-16 text-center shadow-sm">
          <Heart size={48} className="mx-auto mb-4 text-[#d9d4c8]" />
          <p className="text-[#6b6f76] text-lg mb-4">
            お気に入りに登録されたお得情報がありません
          </p>
          <p className="text-[#6b6f76] text-sm mb-6">
            気になる情報を見つけたら、ハートアイコンをクリックして保存しましょう
          </p>
          <Link 
            href="/" 
            className="inline-block px-6 py-2.5 bg-brand-500 text-white rounded-full font-semibold text-sm hover:bg-brand-600 transition-colors"
          >
            お得情報を探す
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-[#ebe7df] rounded-2xl md:rounded-3xl shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 p-3 md:p-6">
            {favoriteDeals.map((deal) => (
              <DealCard key={deal.id} deal={deal} viewMode="grid" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

