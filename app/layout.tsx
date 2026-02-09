import type { Metadata } from 'next'
import Link from 'next/link'
import { ViewModeProvider } from '@/contexts/ViewModeContext'
import Header from '@/components/Header'
import { WebsiteStructuredData, OrganizationStructuredData } from '@/components/StructuredData'
import { metadata } from './metadata'
import './globals.css'

export { metadata }

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" />
        <WebsiteStructuredData />
        <OrganizationStructuredData />
      </head>
      <body className="antialiased">
        <ViewModeProvider>
          <Header />
          <main className="min-h-screen bg-surface-100">
            {children}
          </main>
          <footer className="bg-white border-t border-[#e5e2da] mt-24">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-[#6b6f76]">
                <div className="font-semibold text-[#0f1419]">TokuSearch</div>
                <div className="flex items-center gap-4">
                  <Link href="/about" className="hover:text-[#0f1419] transition-colors">アバウト</Link>
                  <Link href="/policy" className="hover:text-[#0f1419] transition-colors">ポリシー</Link>
                </div>
                <p>© 2024 お得情報まとめサイト</p>
              </div>
            </div>
          </footer>
        </ViewModeProvider>
      </body>
    </html>
  )
}
