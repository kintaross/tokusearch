'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, FolderOpen } from 'lucide-react';

type Props = {
  categories: string[];
  isMobile?: boolean;
};

export function SideNav({ categories, isMobile = false }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const content = (
    <>
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen className="w-5 h-5 text-brand-600" />
        <h2 className="text-lg font-bold text-[#0f1419]">
          {isMobile ? '目的からコラムを探す' : 'カテゴリから探す'}
        </h2>
      </div>
      <nav className="space-y-2">
        {categories.map((category) => (
          <Link
            key={category}
            href={`/columns?category=${encodeURIComponent(category)}`}
            className="block py-2 px-3 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 rounded transition-colors"
          >
            {category}
          </Link>
        ))}
        {categories.length === 0 && (
          <div className="text-sm text-gray-500 py-2">カテゴリがありません</div>
        )}
      </nav>
    </>
  );

  if (isMobile) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-brand-600" />
            <span className="font-bold text-[#0f1419]">目的からコラムを探す</span>
          </div>
          {isOpen ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </button>
        {isOpen && (
          <div className="p-4 pt-0 border-t border-gray-200">
            <nav className="space-y-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  href={`/columns?category=${encodeURIComponent(category)}`}
                  className="block py-2 px-3 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 rounded transition-colors"
                >
                  {category}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {content}
    </div>
  );
}



