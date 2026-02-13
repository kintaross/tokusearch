'use client';

import { usePathname } from 'next/navigation';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? '/';

  // 管理画面・メンテ画面などは共通ヘッダー/フッターを出さない
  const hideChrome =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/maintenance') ||
    pathname.startsWith('/design-preview');

  return (
    <div className="min-h-[100dvh] flex flex-col">
      {!hideChrome && <Header />}
      <main className="flex-1">{children}</main>
      {!hideChrome && <Footer />}
    </div>
  );
}

