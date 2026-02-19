'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Loader2, AlertCircle, ExternalLink, Heart, Share2, X, History, Star, ArrowUpDown, Filter } from 'lucide-react';
import { PoikatsuSearchResponse, PoikatsuSearchResult } from '@/types/poikatsu';
import { getSearchHistory, addSearchHistory, removeSearchHistoryItem, clearSearchHistory } from '@/lib/poikatsu-search-history';
import { getFavorites, addFavorite, removeFavorite, isFavorite } from '@/lib/poikatsu-favorites';
import { getCachedResult, setCachedResult } from '@/lib/poikatsu-cache';

type SortOption = 'rewardRate' | 'rewardAmount' | 'site' | 'title';
type FilterOption = {
  sites: string[];
};

function PoikatsuSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get('q') || '';
  
  const [keyword, setKeyword] = useState(initialKeyword);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<PoikatsuSearchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchHistory, setSearchHistory] = useState(getSearchHistory());
  const [favorites, setFavorites] = useState(getFavorites());
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('rewardRate');
  const [filter, setFilter] = useState<FilterOption>({ sites: [] });
  const [showFilters, setShowFilters] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set(favorites.map(f => f.id)));

  // 人気キーワード（サンプル）
  const popularKeywords = ['セゾン', 'SAISON', 'クレカ', 'クレジットカード', '楽天', 'Amazon', 'PayPay'];

  // URLパラメータから検索キーワードを取得して検索を実行
  useEffect(() => {
    if (initialKeyword && !results) {
      executeSearch(initialKeyword, false);
    }
  }, []);

  // お気に入り状態を更新
  useEffect(() => {
    const favs = getFavorites();
    setFavorites(favs);
    setFavoriteIds(new Set(favs.map(f => f.id)));
  }, []);

  const executeSearch = async (searchKeyword: string, updateUrl: boolean = true, useCache: boolean = true) => {
    const trimmedKeyword = searchKeyword.trim();
    
    if (!trimmedKeyword) {
      setError('キーワードを入力してください');
      return;
    }

    // URLパラメータを更新
    if (updateUrl) {
      router.push(`/poikatsu-search?q=${encodeURIComponent(trimmedKeyword)}`);
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setShowHistory(false);
    setShowSuggestions(false);

    // キャッシュをチェック
    if (useCache) {
      const cached = getCachedResult(trimmedKeyword);
      if (cached) {
        setResults(cached);
        setLoading(false);
        return;
      }
    }

    try {
      const response = await fetch(`/api/poikatsu-search?q=${encodeURIComponent(trimmedKeyword)}`);
      
      if (!response.ok) {
        throw new Error('検索に失敗しました');
      }

      const data: PoikatsuSearchResponse = await response.json();
      setResults(data);

      // キャッシュに保存
      if (data.success) {
        setCachedResult(trimmedKeyword, data);
        
        if (data.results.length > 0) {
          // 検索履歴に追加
          addSearchHistory(trimmedKeyword, data.results.length);
          setSearchHistory(getSearchHistory());
          
          // 閲覧履歴は localStorage で保存（サーバー保存APIは廃止済み）
          try {
            const res = await fetch('/api/poikatsu-save-viewed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ results: data.results }),
            });
            if (res.status === 410) {
              // 廃止済み。localStorage のみ運用で問題なし
            } else if (!res.ok) {
              console.warn('閲覧保存API応答:', res.status);
            }
          } catch (_) {
            // ネットワークエラー時は無視（localStorage で十分）
          }
        }
      }

      if (!data.success) {
        setError(data.error || '検索に失敗しました');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err instanceof Error ? err.message : '検索中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeSearch(keyword, true);
  };

  const handleHistoryClick = (historyKeyword: string) => {
    setKeyword(historyKeyword);
    executeSearch(historyKeyword, true);
  };

  const handleFavoriteToggle = (result: PoikatsuSearchResult) => {
    const id = `${result.site}-${result.title}-${result.originalUrl}`;
    
    if (favoriteIds.has(id)) {
      removeFavorite(id);
    } else {
      if (results) {
        addFavorite(result, results.keyword);
      }
    }
    
    const updatedFavorites = getFavorites();
    setFavorites(updatedFavorites);
    setFavoriteIds(new Set(updatedFavorites.map(f => f.id)));
  };

  const handleShare = async (result?: PoikatsuSearchResult) => {
    const url = result 
      ? `${window.location.origin}/poikatsu-search?q=${encodeURIComponent(results?.keyword || '')}&highlight=${encodeURIComponent(result.title)}`
      : `${window.location.origin}/poikatsu-search?q=${encodeURIComponent(results?.keyword || '')}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: result ? result.title : `「${results?.keyword}」の検索結果`,
          text: result ? `${result.site}: ${result.title}` : `「${results?.keyword}」の検索結果`,
          url,
        });
      } catch (err) {
        // ユーザーがキャンセルした場合など
      }
    } else {
      // フォールバック: クリップボードにコピー
      await navigator.clipboard.writeText(url);
      alert('URLをクリップボードにコピーしました');
    }
  };

  // ソートとフィルターを適用
  const filteredAndSortedResults = useMemo(() => {
    if (!results?.results) return [];
    
    let filtered = [...results.results];
    
    // フィルター適用
    if (filter.sites.length > 0) {
      filtered = filtered.filter(r => filter.sites.includes(r.site));
    }
    
    // ソート適用
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'rewardRate':
          if (a.rewardRate && b.rewardRate) return b.rewardRate - a.rewardRate;
          if (a.rewardRate) return -1;
          if (b.rewardRate) return 1;
          return 0;
        case 'rewardAmount':
          if (a.rewardAmount && b.rewardAmount) return b.rewardAmount - a.rewardAmount;
          if (a.rewardAmount) return -1;
          if (b.rewardAmount) return 1;
          return 0;
        case 'site':
          return a.site.localeCompare(b.site);
        case 'title':
          return a.title.localeCompare(b.title);
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [results, sortBy, filter]);

  // ユニークなサイト名を取得
  const uniqueSites = useMemo(() => {
    if (!results?.results) return [];
    return Array.from(new Set(results.results.map(r => r.site))).sort();
  }, [results]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* ページヘッダー */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-[#0f1419] mb-2">
          ポイ活サイト横断検索
        </h1>
        <p className="text-sm md:text-base text-[#6b6f76]">
          キーワードを入力して、複数のポイ活サイトから最適な案件を検索できます
        </p>
      </div>

      {/* 検索フォーム */}
      <div className="mb-8 relative">
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center bg-white border border-[#e5e2da] rounded-xl hover:border-brand-200 transition-all">
            <Search className="absolute left-4 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="例: セゾン、SAISON、クレカ..."
              className="w-full pl-12 pr-32 py-3 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 outline-none"
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setShowSuggestions(e.target.value.length > 0);
              }}
              onFocus={() => {
                if (keyword.length === 0) setShowHistory(true);
                else setShowSuggestions(true);
              }}
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 px-6 py-2 bg-brand-500 text-white font-semibold rounded-lg hover:bg-brand-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  検索中...
                </>
              ) : (
                '検索'
              )}
            </button>
          </div>
        </form>

        {/* 検索履歴 */}
        {showHistory && searchHistory.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e5e2da] rounded-xl shadow-lg z-10 max-h-64 overflow-y-auto">
            <div className="p-3 border-b border-[#e5e2da] flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#0f1419]">
                <History className="w-4 h-4" />
                検索履歴
              </div>
              <button
                onClick={() => {
                  clearSearchHistory();
                  setSearchHistory([]);
                }}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                すべて削除
              </button>
            </div>
            <div className="p-2">
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleHistoryClick(item.keyword)}
                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between group"
                >
                  <span className="text-sm text-[#0f1419]">{item.keyword}</span>
                  <div className="flex items-center gap-2">
                    {item.resultCount && (
                      <span className="text-xs text-gray-500">{item.resultCount}件</span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeSearchHistoryItem(item.keyword);
                        setSearchHistory(getSearchHistory());
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 検索候補 */}
        {showSuggestions && keyword.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e5e2da] rounded-xl shadow-lg z-10">
            <div className="p-3 border-b border-[#e5e2da]">
              <div className="text-sm font-semibold text-[#0f1419]">人気キーワード</div>
            </div>
            <div className="p-2 flex flex-wrap gap-2">
              {popularKeywords
                .filter(k => k.toLowerCase().includes(keyword.toLowerCase()))
                .slice(0, 5)
                .map((k, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setKeyword(k);
                      executeSearch(k, true);
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-50 hover:bg-brand-50 text-[#0f1419] rounded-lg transition-colors"
                  >
                    {k}
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 mb-1">エラー</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* 検索結果 */}
      {results && (
        <div>
          <div className="mb-4 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-bold text-[#0f1419] mb-1">
                検索結果: 「{results.keyword}」
              </h2>
              <span className="text-sm text-[#6b6f76]">
                {filteredAndSortedResults.length}件見つかりました
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* 共有ボタン */}
              <button
                onClick={() => handleShare()}
                className="px-3 py-1.5 text-sm bg-white border border-[#e5e2da] rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
                title="検索結果を共有"
              >
                <Share2 className="w-4 h-4" />
                共有
              </button>
              {/* ソート・フィルターボタン */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-3 py-1.5 text-sm bg-white border border-[#e5e2da] rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-1"
              >
                <Filter className="w-4 h-4" />
                絞り込み
              </button>
            </div>
          </div>

          {/* ソート・フィルターUI */}
          {showFilters && (
            <div className="mb-4 bg-white border border-[#e5e2da] rounded-xl p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ソート */}
                <div>
                  <label className="block text-sm font-semibold text-[#0f1419] mb-2 flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4" />
                    並び替え
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white text-sm"
                  >
                    <option value="rewardRate">還元率順</option>
                    <option value="rewardAmount">還元額順</option>
                    <option value="site">サイト名順</option>
                    <option value="title">タイトル順</option>
                  </select>
                </div>
                {/* フィルター */}
                <div>
                  <label className="block text-sm font-semibold text-[#0f1419] mb-2">
                    サイトで絞り込み
                  </label>
                  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-2">
                    {uniqueSites.map(site => (
                      <label key={site} className="flex items-center gap-2 py-1 text-sm">
                        <input
                          type="checkbox"
                          checked={filter.sites.includes(site)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFilter({ sites: [...filter.sites, site] });
                            } else {
                              setFilter({ sites: filter.sites.filter(s => s !== site) });
                            }
                          }}
                          className="rounded"
                        />
                        <span>{site}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {filteredAndSortedResults.length === 0 ? (
            <div className="bg-white border border-[#ebe7df] rounded-xl p-12 text-center">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-[#6b6f76]">
                検索結果が見つかりませんでした。別のキーワードでお試しください。
              </p>
            </div>
          ) : (
            <>
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
                        <th className="px-4 py-3 text-center text-xs font-semibold text-[#0f1419] whitespace-nowrap w-20">
                          操作
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ebe7df]">
                      {filteredAndSortedResults.map((result, index) => {
                        const id = `${result.site}-${result.title}-${result.originalUrl}`;
                        const isFav = favoriteIds.has(id);
                        return (
                          <tr key={index} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1">
                                {result.rewardAmount && (
                                  <span className="text-sm font-bold text-green-600">
                                    {result.rewardAmount.toLocaleString()}pt
                                  </span>
                                )}
                                {result.rewardRate && (
                                  <span className="text-xs text-green-600">
                                    {result.rewardRate}%還元
                                  </span>
                                )}
                                {!result.rewardAmount && !result.rewardRate && result.reward && (
                                  <span className="text-sm text-[#6b6f76]">
                                    {result.reward}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-medium text-[#0f1419]">
                                {result.site}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="max-w-md">
                                <a
                                  href={`/api/poikatsu-redirect?url=${encodeURIComponent(result.originalUrl)}&site=${encodeURIComponent(result.site)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm font-semibold text-[#0f1419] mb-1 line-clamp-2 hover:text-brand-600 transition-colors inline-flex items-center gap-1"
                                >
                                  {result.title}
                                  <ExternalLink className="w-3 h-3 flex-shrink-0" />
                                </a>
                                {result.description && (
                                  <p className="text-xs text-[#6b6f76] line-clamp-2">
                                    {result.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleFavoriteToggle(result)}
                                  className={`p-1.5 rounded-lg transition-colors ${
                                    isFav
                                      ? 'text-red-500 hover:bg-red-50'
                                      : 'text-gray-400 hover:bg-gray-100'
                                  }`}
                                  title={isFav ? 'お気に入りから削除' : 'お気に入りに追加'}
                                >
                                  <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                                </button>
                                <button
                                  onClick={() => handleShare(result)}
                                  className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                                  title="共有"
                                >
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* モバイル: カード表示 */}
              <div className="md:hidden space-y-3">
                {filteredAndSortedResults.map((result, index) => {
                  const id = `${result.site}-${result.title}-${result.originalUrl}`;
                  const isFav = favoriteIds.has(id);
                  return (
                    <div key={index} className="bg-white border border-[#ebe7df] rounded-xl p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <a
                            href={`/api/poikatsu-redirect?url=${encodeURIComponent(result.originalUrl)}&site=${encodeURIComponent(result.site)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-semibold text-[#0f1419] mb-1 line-clamp-2 hover:text-brand-600 transition-colors inline-flex items-center gap-1"
                          >
                            {result.title}
                            <ExternalLink className="w-3 h-3 flex-shrink-0" />
                          </a>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 text-xs font-semibold bg-brand-100 text-brand-700 rounded">
                              {result.site}
                            </span>
                            {result.rewardAmount && (
                              <span className="text-sm font-bold text-green-600">
                                {result.rewardAmount.toLocaleString()}pt
                              </span>
                            )}
                            {result.rewardRate && (
                              <span className="text-xs text-green-600">
                                {result.rewardRate}%還元
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={() => handleFavoriteToggle(result)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isFav
                                ? 'text-red-500 hover:bg-red-50'
                                : 'text-gray-400 hover:bg-gray-100'
                            }`}
                          >
                            <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleShare(result)}
                            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 transition-colors"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      {result.description && (
                        <p className="text-xs text-[#6b6f76] line-clamp-2 mt-2">
                          {result.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function PoikatsuSearchPage() {
  return (
    <Suspense fallback={
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    }>
      <PoikatsuSearchContent />
    </Suspense>
  );
}

