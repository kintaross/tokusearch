import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://tokusearch.vercel.app'),
  title: 'TokuSearch | お得情報まとめ',
  description: '今日のお得情報を効率的にチェック',
  keywords: ['お得情報', 'キャンペーン', '割引', 'ポイント還元', 'セール情報'],
  authors: [{ name: 'TokuSearch' }],
  creator: 'TokuSearch',
  publisher: 'TokuSearch',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
    apple: '/icon-512.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    url: 'https://tokusearch.vercel.app',
    siteName: 'TokuSearch',
    title: 'TokuSearch | お得情報まとめ',
    description: '今日のお得情報を効率的にチェック',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TokuSearch | お得情報まとめ',
    description: '今日のお得情報を効率的にチェック',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

