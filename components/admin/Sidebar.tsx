'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Tag,
  Image,
  Settings,
  LogOut,
  X,
  User,
} from 'lucide-react';

const menuItems = [
  {
    label: 'ダッシュボード',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'コラム管理',
    href: '/admin/columns',
    icon: FileText,
  },
  {
    label: 'お得情報管理',
    href: '/admin/deals',
    icon: Tag,
  },
  {
    label: 'ユーザー側ログイン（テスト）',
    href: '/signin?callbackUrl=/account',
    icon: User,
    target: '_blank',
    rel: 'noreferrer',
  },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  // スマホ時はbodyのスクロールを無効化
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    // クリーンアップ
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => null);
    window.location.href = '/login';
  };

  return (
    <>
      {/* オーバーレイ（スマホ時のみ表示） */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* サイドバー */}
      <div
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-gray-900 text-white flex flex-col h-screen transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
      {/* ロゴ */}
      <div className="p-6 border-b border-gray-800 flex items-center justify-between">
        <Link href="/admin/dashboard" className="flex items-center gap-2" onClick={onClose}>
          <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-lg">
            T
          </div>
          <div>
            <div className="font-bold text-lg">TokuSearch</div>
            <div className="text-xs text-gray-400">管理画面</div>
          </div>
        </Link>
        {/* 閉じるボタン（スマホ時のみ表示） */}
        <button
          onClick={onClose}
          className="lg:hidden p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="メニューを閉じる"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* メニュー */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              target={'target' in item ? item.target : undefined}
              rel={'rel' in item ? item.rel : undefined}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-brand-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* フッター */}
      <div className="p-4 border-t border-gray-800 space-y-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-sm"
        >
          サイトを表示 →
        </Link>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">ログアウト</span>
        </button>
      </div>
    </div>
    </>
  );
}

