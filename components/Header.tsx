'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'ホーム' },
  { href: '/pickup', label: 'ピックアップ' },
  { href: '/welkatsu', label: 'ウエル活' },
  { href: '/ranking', label: 'ランキング' },
  { href: '/poikatsu-search', label: 'ポイントサイト検索' },
  { href: '/columns', label: 'コラム' },
  { href: '/favorites', label: 'お気に入り' },
  { href: '/about', label: 'アバウト' },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-[#e5e2da]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12 md:h-16">
          <Link href="/" className="text-lg md:text-[22px] font-semibold tracking-tight text-[#0f1419] hover:opacity-80 transition-opacity">
            TokuSearch
          </Link>
          
          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#4c4f55]">
            {NAV_LINKS.map(link => (
              <Link key={link.href} href={link.href} className="hover:text-[#0f1419] transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* ハンバーガーメニューボタン */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#0f1419] hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="メニュー"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-[#e5e2da] shadow-lg animate-fadeIn">
          <nav className="max-w-6xl mx-auto px-4 py-4">
            <div className="grid grid-cols-2 gap-2">
              {NAV_LINKS.map((link, index) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="relative group block px-4 py-3 text-sm font-semibold text-[#0f1419] hover:text-brand-500 bg-[#f8f7f4] hover:bg-brand-50 rounded-xl transition-all duration-200 text-center overflow-hidden"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'slideIn 0.3s ease-out forwards',
                    opacity: 0
                  }}
                >
                  <span className="relative z-10">{link.label}</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-500/0 via-brand-500/5 to-brand-500/0 transform -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                </Link>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}

