'use client';

import { useState, useEffect } from 'react';
import { Heart, ExternalLink, Share2, Trash2, ArrowLeft } from 'lucide-react';
import { FavoriteItem } from '@/types/poikatsu';
import { getFavorites, removeFavorite, clearFavorites } from '@/lib/poikatsu-favorites';
import Link from 'next/link';

export default function PoikatsuFavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
  }, []);

  const handleRemove = (id: string) => {
    removeFavorite(id);
    setFavorites(getFavorites());
  };

  const handleClearAll = () => {
    if (confirm('すべてのお気に入りを削除しますか？')) {
      clearFavorites();
      setFavorites([]);
    }
  };

  const handleShare = async (item: FavoriteItem) => {
    const url = `${window.location.origin}/poikatsu-search?q=${encodeURIComponent(item.keyword)}&highlight=${encodeURIComponent(item.result.title)}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.result.title,
          text: `${item.result.site}: ${item.result.title}`,
          url,
        });
      } catch (err) {
        // ユーザーがキャンセルした場合など
      }
    } else {
      await navigator.clipboard.writeText(url);
      alert('URLをクリップボードにコピーしました');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <Link
          href="/poikatsu-search"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          検索に戻る
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419] mb-2">
              お気に入り
            </h1>
            <p className="text-sm md:text-base text-[#6b6f76]">
              {favorites.length}件のお気に入り
            </p>
          </div>
          {favorites.length > 0 && (
            <button
              onClick={handleClearAll}
              className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition-colors flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              すべて削除
            </button>
          )}
        </div>
      </div>

      {favorites.length === 0 ? (
        <div className="bg-white border border-[#ebe7df] rounded-xl p-12 text-center">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-[#6b6f76] mb-4">お気に入りがありません</p>
          <Link
            href="/poikatsu-search"
            className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors"
          >
            検索を始める
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {/* デスクトップ: テーブル表示 */}
          <div className="hidden md:block bg-white border border-[#ebe7df] rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-[#ebe7df]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0f1419] whitespace-nowrap">
                      還元金額・還元率
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0f1419] whitespace-nowrap">
                      サイト名
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0f1419]">
                      詳細
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[#0f1419] whitespace-nowrap">
                      検索キーワード
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-[#0f1419] whitespace-nowrap w-24">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ebe7df]">
                  {favorites.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {item.result.rewardAmount && (
                            <span className="text-sm font-bold text-green-600">
                              {item.result.rewardAmount.toLocaleString()}pt
                            </span>
                          )}
                          {item.result.rewardRate && (
                            <span className="text-xs text-green-600">
                              {item.result.rewardRate}%還元
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-medium text-[#0f1419]">
                          {item.result.site}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="max-w-md">
                          <a
                            href={`/api/poikatsu-redirect?url=${encodeURIComponent(item.result.originalUrl)}&site=${encodeURIComponent(item.result.site)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-[#0f1419] mb-1 line-clamp-2 hover:text-brand-600 transition-colors inline-flex items-center gap-1"
                          >
                            {item.result.title}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/poikatsu-search?q=${encodeURIComponent(item.keyword)}`}
                          className="text-sm text-brand-600 hover:text-brand-700"
                        >
                          {item.keyword}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleShare(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                            title="共有"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(item.id)}
                            className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                            title="削除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* モバイル: カード表示 */}
          <div className="md:hidden space-y-3">
            {favorites.map((item) => (
              <div key={item.id} className="bg-white border border-[#ebe7df] rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <a
                      href={`/api/poikatsu-redirect?url=${encodeURIComponent(item.result.originalUrl)}&site=${encodeURIComponent(item.result.site)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-[#0f1419] mb-1 line-clamp-2 hover:text-brand-600 transition-colors inline-flex items-center gap-1"
                    >
                      {item.result.title}
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    </a>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 text-xs font-semibold bg-brand-100 text-brand-700 rounded">
                        {item.result.site}
                      </span>
                      {item.result.rewardAmount && (
                        <span className="text-sm font-bold text-green-600">
                          {item.result.rewardAmount.toLocaleString()}pt
                        </span>
                      )}
                      {item.result.rewardRate && (
                        <span className="text-xs text-green-600">
                          {item.result.rewardRate}%還元
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/poikatsu-search?q=${encodeURIComponent(item.keyword)}`}
                      className="text-xs text-brand-600 hover:text-brand-700 mt-2 inline-block"
                    >
                      検索: {item.keyword}
                    </Link>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    <button
                      onClick={() => handleShare(item)}
                      className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


