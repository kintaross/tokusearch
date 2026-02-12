'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Filter, Calendar, Tag, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
import { CategoryMain } from '@/types/deal';
import { useViewMode } from '@/contexts/ViewModeContext';

export default function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { viewMode, setViewMode } = useViewMode();
  const [isExpanded, setIsExpanded] = useState(false);

  const period = searchParams.get('period') || '';
  const category = searchParams.get('category') || '';
  const sort = searchParams.get('sort') || 'default';

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  };

  const categories: CategoryMain[] = [
    'ドラッグストア・日用品',
    'スーパー・量販店・EC',
    'グルメ・外食',
    '子育て',
    '旅行・交通',
    '決済・ポイント',
    'タバコ・嗜好品',
    'その他',
  ];

  const activeFilterCount = [period, category, sort !== 'default' ? sort : ''].filter(Boolean).length;

  return (
    <div className="space-y-3 mt-4">
      {/* フィルターヘッダー（常に表示） */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-semibold text-[#4c4f55] hover:text-[#0f1419] transition-colors"
        >
          <Filter size={16} />
          絞り込み
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 bg-brand-500 text-white text-xs rounded-full">
              {activeFilterCount}
            </span>
          )}
          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        {/* 表示切り替え（常に表示） */}
        <div className="flex items-center gap-1 rounded-full bg-[#f2efe6] px-1 py-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              viewMode === 'grid'
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#6b6f76] hover:text-[#111827]'
            }`}
            aria-label="グリッド表示"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-grid3x3 lucide-grid-3x3" aria-hidden="true">
              <rect width="18" height="18" x="3" y="3" rx="2"></rect>
              <path d="M3 9h18"></path>
              <path d="M3 15h18"></path>
              <path d="M9 3v18"></path>
              <path d="M15 3v18"></path>
            </svg>
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              viewMode === 'list'
                ? 'bg-white text-[#111827] shadow-sm'
                : 'text-[#6b6f76] hover:text-[#111827]'
            }`}
            aria-label="リスト表示"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-list" aria-hidden="true">
              <path d="M3 5h.01"></path>
              <path d="M3 12h.01"></path>
              <path d="M3 19h.01"></path>
              <path d="M8 5h13"></path>
              <path d="M8 12h13"></path>
              <path d="M8 19h13"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* フィルターオプション（展開時のみ表示） */}
      {isExpanded && (
        <div className="space-y-4 pt-3 border-t border-[#ebe7df] animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 期間フィルター */}
          <div>
            <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-2">
              <Calendar size={14} />
              投稿日
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => updateFilter('period', '')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  !period
                    ? 'bg-[#0f1419] text-white'
                    : 'bg-white text-[#4c4f55] border border-[#e5e2da] hover:border-brand-300'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => updateFilter('period', 'today')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  period === 'today'
                    ? 'bg-[#0f1419] text-white'
                    : 'bg-white text-[#4c4f55] border border-[#e5e2da] hover:border-brand-300'
                }`}
              >
                24時間以内
              </button>
              <button
                onClick={() => updateFilter('period', '3days')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  period === '3days'
                    ? 'bg-[#0f1419] text-white'
                    : 'bg-white text-[#4c4f55] border border-[#e5e2da] hover:border-brand-300'
                }`}
              >
                3日以内
              </button>
              <button
                onClick={() => updateFilter('period', '7days')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  period === '7days'
                    ? 'bg-[#0f1419] text-white'
                    : 'bg-white text-[#4c4f55] border border-[#e5e2da] hover:border-brand-300'
                }`}
              >
                7日以内
              </button>
              <button
                onClick={() => updateFilter('period', '30days')}
                className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  period === '30days'
                    ? 'bg-[#0f1419] text-white'
                    : 'bg-white text-[#4c4f55] border border-[#e5e2da] hover:border-brand-300'
                }`}
              >
                30日以内
              </button>
            </div>
          </div>

            {/* カテゴリフィルター */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-2">
                <Tag size={14} />
                カテゴリ
              </label>
              <div className="relative">
                <select
                  value={category}
                  onChange={(e) => updateFilter('category', e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-white border border-[#e5e2da] rounded-xl text-xs text-[#4c4f55] focus:ring-1 focus:ring-brand-400 focus:border-brand-400 appearance-none cursor-pointer hover:border-brand-200 transition-colors"
                >
                  <option value="">すべて</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* 並び順 */}
            <div>
              <label className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-2">
                <ArrowUpDown size={14} />
                並び順
              </label>
              <div className="relative">
                <select
                  value={sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="w-full pl-3 pr-10 py-2 bg-white border border-[#e5e2da] rounded-xl text-xs text-[#4c4f55] focus:ring-1 focus:ring-brand-400 focus:border-brand-400 appearance-none cursor-pointer hover:border-brand-200 transition-colors"
                >
                  <option value="default">おすすめ順</option>
                  <option value="newest">新しい順</option>
                  <option value="expiring">期限順</option>
                  <option value="discount_rate">還元率が高い順</option>
                  <option value="discount_amount">還元額が多い順</option>
                  <option value="score">スコアが高い順</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* フィルタークリア */}
          {activeFilterCount > 0 && (
            <div className="flex justify-end">
              <button
                onClick={() => router.push('/')}
                className="text-xs text-[#6b6f76] hover:text-[#0f1419] transition-colors underline"
              >
                絞り込みをクリア
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
