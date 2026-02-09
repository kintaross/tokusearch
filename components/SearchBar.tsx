'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';

export default function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    area_type: searchParams.get('area_type') || '',
  });

  useEffect(() => {
    setSearchQuery(searchParams.get('search') || '');
    setFilters({
      category: searchParams.get('category') || '',
      area_type: searchParams.get('area_type') || '',
    });
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    
    const params = new URLSearchParams();
    if (trimmed) params.set('search', trimmed);
    if (filters.category) params.set('category', filters.category);
    if (filters.area_type) params.set('area_type', filters.area_type);
    
    // ホームページから検索した場合はホームページで表示
    if (pathname === '/') {
      router.push(`/?${params.toString()}`);
    } else {
      router.push(`${pathname}?${params.toString()}`);
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilters({ category: '', area_type: '' });
    router.push(pathname);
  };

  return (
    <div className="relative">
      <form onSubmit={handleSubmit} className="relative space-y-2">
        <div className="relative flex items-center transition-all duration-200 rounded-xl bg-white border border-[#e5e2da] hover:border-brand-200">
          <Search className="absolute left-3 w-4 h-4 transition-colors text-gray-400" aria-hidden="true" />
          <input
            type="text"
            placeholder="キーワードで検索..."
            className="w-full pl-10 pr-36 py-2.5 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400 text-sm outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-20 p-1.5 rounded-lg text-xs transition-colors ${showFilters ? 'bg-brand-100 text-brand-600' : 'text-gray-400 hover:text-brand-600'}`}
            title="絞り込み"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <button
            type="submit"
            className="absolute right-2 px-4 py-1.5 bg-brand-500 text-white font-semibold rounded-lg text-xs hover:bg-brand-600 transition-colors"
          >
            検索
          </button>
        </div>

        {/* 絞り込みフィルター（コンパクト版） */}
        {showFilters && (
          <div className="bg-white border border-[#e5e2da] rounded-xl p-3 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <select
                value={filters.category}
                onChange={(e) => setFilters({ ...filters, category: e.target.value })}
                className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white text-gray-900"
              >
                <option value="">カテゴリ</option>
                <option value="ドラッグストア・日用品">日用品</option>
                <option value="スーパー・量販店・EC">EC</option>
                <option value="グルメ・外食">グルメ</option>
                <option value="旅行・交通">旅行</option>
                <option value="決済・ポイント">決済</option>
                <option value="その他">その他</option>
              </select>
              <select
                value={filters.area_type}
                onChange={(e) => setFilters({ ...filters, area_type: e.target.value })}
                className="text-xs px-2 py-1.5 border border-gray-200 rounded-lg focus:ring-1 focus:ring-brand-500 focus:border-brand-500 bg-white text-gray-900"
              >
                <option value="">チャネル</option>
                <option value="online">オンライン</option>
                <option value="store">店舗</option>
                <option value="online+store">両方</option>
              </select>
            </div>
            {(searchQuery || filters.category || filters.area_type) && (
              <button
                type="button"
                onClick={clearFilters}
                className="w-full text-xs text-gray-500 hover:text-gray-700 py-1"
              >
                クリア
              </button>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
