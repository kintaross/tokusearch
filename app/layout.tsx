import type { Metadata } from 'next'
import Link from 'next/link'
import { ViewModeProvider } from '@/contexts/ViewModeContext'
import Header from '@/components/Header'
import Providers from '@/components/Providers'
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
        <link href="https://fonts.googleapis.com" rel="preconnect"/>
        <link crossOrigin="" href="https://fonts.gstatic.com" rel="preconnect"/>
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;700&display=swap" rel="stylesheet"/>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet"/>
        <WebsiteStructuredData />
        <OrganizationStructuredData />
      </head>
      <body className="antialiased font-sans text-accent-brown bg-background-light">
        <Providers>
        <ViewModeProvider>
          <Header />
          <main className="min-h-screen">
            {children}
          </main>
        </ViewModeProvider>
        </Providers>
      </body>
    </html>
  )
}
