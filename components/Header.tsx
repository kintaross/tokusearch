'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { Menu, X, User, LogOut, ChevronDown, ChevronUp } from 'lucide-react';

const NAV_LINKS = [
  { href: '/', label: 'ホーム' },
  { href: '/welkatsu', label: 'ウエル活' },
  { href: '/kotsukotsu', label: 'コツコツポイ活' },
  { href: '/pickup', label: '注目のお得情報' },
  { href: '/columns', label: '特集コラム' },
];

function isEndUser(session: { user?: { role?: string } } | null): boolean {
  if (!session?.user) return false;
  const role = (session.user as { role?: string }).role;
  return role !== 'admin' && role !== 'editor';
}

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, status } = useSession();
  const showAccount = status === 'authenticated' && isEndUser(session);

  // モバイルメニュー内のアコーディオン状態管理（必要であれば）
  // 今回はすべて展開して表示する形にします

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-xl border-b border-soft-greige">
      <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-2xl">magic_button</span>
            </div>
            <span className="text-2xl font-bold tracking-tight text-accent-brown">TokuSearch</span>
          </Link>
        </div>

        {/* デスクトップナビゲーション */}
        <nav className="hidden lg:flex items-center gap-10">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} className="text-[15px] font-medium text-accent-brown hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-5">
          <Link href="/favorites" className="p-2.5 hover:bg-soft-greige rounded-full transition-colors text-accent-brown">
            <span className="material-symbols-outlined">favorite</span>
          </Link>
          
          {showAccount ? (
            <div className="flex items-center gap-3">
              <Link href="/account" className="text-sm font-bold text-accent-brown hover:text-primary transition-colors">
                マイページ
              </Link>
              <button 
                onClick={() => signOut({ callbackUrl: '/' })}
                className="px-6 py-2.5 bg-accent-brown text-white text-sm font-bold rounded-full hover:bg-accent-brown/90 transition-all"
              >
                ログアウト
              </button>
            </div>
          ) : status !== 'loading' ? (
            <Link href="/signin" className="px-6 py-2.5 bg-accent-brown text-white text-sm font-bold rounded-full hover:bg-accent-brown/90 transition-all">
              ログイン
            </Link>
          ) : null}
        </div>

        {/* ハンバーガーメニューボタン */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="lg:hidden p-2 text-accent-brown hover:bg-soft-greige rounded-lg transition-colors"
          aria-label="メニュー"
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* モバイルメニュー */}
      {mobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-soft-greige shadow-lg animate-fadeIn h-[calc(100vh-80px)] overflow-y-auto">
          <nav className="max-w-7xl mx-auto px-6 py-6 pb-20">
            <div className="flex flex-col gap-6">
              {/* メインナビゲーション */}
              <div className="flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-xl font-bold text-accent-brown hover:text-primary transition-colors py-2"
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/favorites"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xl font-bold text-accent-brown hover:text-primary transition-colors py-2"
                >
                  お気に入り
                </Link>
                 <Link
                  href="/poikatsu-search"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-xl font-bold text-accent-brown hover:text-primary transition-colors py-2"
                >
                  ポイント比較
                </Link>
              </div>

              {/* ログイン・マイページエリア */}
              <div className="py-4 border-y border-soft-greige/50 flex flex-col gap-3">
                {showAccount ? (
                  <>
                    <Link 
                      href="/account" 
                      onClick={() => setMobileMenuOpen(false)}
                      className="w-full text-center px-6 py-3 bg-white border-2 border-accent-brown text-accent-brown font-bold rounded-full hover:bg-accent-brown hover:text-white transition-all"
                    >
                      マイページ
                    </Link>
                    <button 
                      onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                      className="w-full px-6 py-3 bg-accent-brown text-white font-bold rounded-full hover:bg-accent-brown/90 transition-all"
                    >
                      ログアウト
                    </button>
                  </>
                ) : status !== 'loading' ? (
                  <Link 
                    href="/signin" 
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center px-6 py-3 bg-accent-brown text-white font-bold rounded-full hover:bg-accent-brown/90 transition-all"
                  >
                    ログイン
                  </Link>
                ) : null}
              </div>

              {/* フッターコンテンツ */}
              <div className="grid grid-cols-1 gap-8 mt-2">
                <div>
                  <h4 className="font-bold mb-4 text-sm tracking-widest text-accent-brown/60 uppercase">マガジン</h4>
                  <ul className="space-y-3 text-base text-accent-brown font-medium">
                    <li><Link onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors" href="/columns">最新コラム</Link></li>
                    <li><Link onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors" href="/columns?category=beginner">ポイ活入門</Link></li>
                    <li><Link onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors" href="/columns?category=interview">インタビュー</Link></li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-4 text-sm tracking-widest text-accent-brown/60 uppercase">サポート</h4>
                  <ul className="space-y-3 text-base text-accent-brown font-medium">
                    <li><Link onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors" href="/about">お問い合わせ</Link></li>
                    <li><Link onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors" href="/policy">利用規約</Link></li>
                    <li><Link onClick={() => setMobileMenuOpen(false)} className="hover:text-primary transition-colors" href="/policy">プライバシー</Link></li>
                  </ul>
                </div>
              </div>

              {/* コピーライト & SNS */}
              <div className="pt-8 mt-4 border-t border-soft-greige/50 flex flex-col gap-6 items-center text-center">
                <div className="flex gap-8">
                  <a className="text-accent-brown hover:text-primary transition-colors font-bold" href="#">Instagram</a>
                  <a className="text-accent-brown hover:text-primary transition-colors font-bold" href="#">Twitter</a>
                  <a className="text-accent-brown hover:text-primary transition-colors font-bold" href="#">Pinterest</a>
                </div>
                <p className="text-[11px] text-accent-brown/40 font-bold tracking-widest uppercase">
                  © 2024 TokuSearch. Crafted for a Better Life.
                </p>
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
