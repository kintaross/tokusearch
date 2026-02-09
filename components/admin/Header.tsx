'use client';

import { User, Menu } from 'lucide-react';
import { useSidebar } from './SidebarContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export default function Header({ title, subtitle, user }: HeaderProps) {
  const { toggleSidebar } = useSidebar();
  return (
    <div className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* ハンバーガーメニューボタン（スマホ時のみ表示） */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="メニューを開く"
          >
            <Menu className="w-6 h-6 text-gray-700" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs sm:text-sm text-gray-600 mt-1 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {user && (
          <div className="hidden sm:flex items-center gap-3 flex-shrink-0 ml-4">
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                {user.name}
              </div>
              <div className="text-xs text-gray-500 truncate max-w-[150px]">{user.email}</div>
            </div>
            <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-5 h-5 text-brand-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

