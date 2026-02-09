'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams?: Record<string, string | undefined>;
}

export function Pagination({ currentPage, totalPages, baseUrl, searchParams = {} }: PaginationProps) {
  if (totalPages <= 1) return null;

  const createUrl = (page: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      // 全ページを表示
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // 最初のページ
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // 現在のページの前後
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // 最後のページ
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* 前へボタン */}
      {currentPage > 1 ? (
        <Link
          href={createUrl(currentPage - 1)}
          className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#ebe7df] bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          前へ
        </Link>
      ) : (
        <div className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#ebe7df] bg-gray-100 text-gray-400 cursor-not-allowed">
          <ChevronLeft className="w-4 h-4" />
          前へ
        </div>
      )}

      {/* ページ番号 */}
      <div className="flex items-center gap-1">
        {getPageNumbers().map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="px-2 py-2 text-gray-400">
                ...
              </span>
            );
          }

          const pageNum = page as number;
          const isActive = pageNum === currentPage;

          return (
            <Link
              key={pageNum}
              href={createUrl(pageNum)}
              className={`min-w-[40px] px-3 py-2 text-center rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white font-semibold'
                  : 'border border-[#ebe7df] bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {pageNum}
            </Link>
          );
        })}
      </div>

      {/* 次へボタン */}
      {currentPage < totalPages ? (
        <Link
          href={createUrl(currentPage + 1)}
          className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#ebe7df] bg-white text-gray-700 hover:bg-gray-50 transition-colors"
        >
          次へ
          <ChevronRight className="w-4 h-4" />
        </Link>
      ) : (
        <div className="flex items-center gap-1 px-4 py-2 rounded-lg border border-[#ebe7df] bg-gray-100 text-gray-400 cursor-not-allowed">
          次へ
          <ChevronRight className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
